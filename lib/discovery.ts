import { z } from "zod";

export const discoveryInput = z.union([
  z.object({ query: z.string().trim().min(2).max(100), location: z.string().trim().max(100).default(""), budget: z.number().nonnegative().max(1_000_000_000).optional() }).strict(),
  z.object({ saveId: z.string().regex(/^\d{1,12}$/) }).strict(),
]);
export type SourceSignal = {
  id: string; provider: string; kind?: "discussion" | "official" | "buyer" | "supplier"; authorId?: string;
  title: string; excerpt: string; url: string; publishedAt: string; retrievedAt: string;
  /** Source location, distinct from the user's requested research geography. */
  locality?: { place: string; basis: "source-stated" | "verified" };
  engagement?: { metric: "comments" | "answers"; count: number };
  /** Legacy saved research; new collectors use engagement. */ comments?: number;
  facts?: { tables: string[][]; products: { name: string; price: string; currency: string }[] };
};
export type OpportunityFinding = { name: string; problem: string; buyer: "Unknown"; gap: "Unknown"; business: "Unqualified"; investment: "Unknown"; monthlyProfit: "Unknown"; strength: "Unrated"; confidence: "Low"; sources: SourceSignal[]; missing: string[] };
const hit = z.object({ objectID: z.string().regex(/^\d+$/), author: z.string().optional(), title: z.string(), story_text: z.string().nullable(), created_at: z.string().datetime(), num_comments: z.number().nonnegative().nullable() });

export async function collectSignals(query?: string, id?: string, signal?: AbortSignal): Promise<SourceSignal[]> {
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("tags", id ? `ask_hn,story_${id}` : "ask_hn");
  url.searchParams.set("hitsPerPage", "20");
  if (query) url.searchParams.set("query", query);
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), redirect: "manual", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Source unavailable (${response.status}). Try later.`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source response.");
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) throw new Error("Source response too large.");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { await reader.cancel(); }
  const payload = z.object({ hits: z.array(hit).max(20) }).parse(JSON.parse(text));
  const retrievedAt = new Date().toISOString();
  return [...new Map(payload.hits.map((item) => [item.objectID, {
    id: item.objectID, provider: "Ask HN" as const, kind: "discussion" as const, authorId: item.author, title: item.title.slice(0, 240),
    excerpt: (item.story_text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200),
    url: `https://news.ycombinator.com/item?id=${item.objectID}`,
    publishedAt: item.created_at, retrievedAt, engagement: { metric: "comments" as const, count: item.num_comments ?? 0 },
  }])).values()];
}

export async function collectStackOverflow(query: string, signal?: AbortSignal): Promise<SourceSignal[]> {
  const url = new URL("https://api.stackexchange.com/2.3/search/advanced");
  url.searchParams.set("site", "stackoverflow");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("pagesize", "20");
  url.searchParams.set("filter", "withbody");
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), redirect: "manual", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Stack Overflow unavailable (" + response.status + ").");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty Stack Overflow response.");
  const decoder = new TextDecoder();
  let body = "", bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) throw new Error("Stack Overflow response too large.");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally { await reader.cancel(); }
  const payload = z.object({ items: z.array(z.object({
    question_id: z.number().int().nonnegative(), title: z.string(), link: z.string().url().refine((value) => new URL(value).hostname === "stackoverflow.com"),
    owner: z.object({ user_id: z.number().int().optional() }).optional(), body: z.string().optional(),
    creation_date: z.number().int().nonnegative(), answer_count: z.number().int().nonnegative(),
  })).max(20) }).parse(JSON.parse(body));
  const retrievedAt = new Date().toISOString();
  return payload.items.map((item) => ({
    id: "so:" + item.question_id, provider: "Stack Overflow" as const, kind: "discussion" as const, authorId: item.owner?.user_id?.toString(),
    title: item.title.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code))).slice(0, 240),
    excerpt: (item.body ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200),
    url: item.link, publishedAt: new Date(item.creation_date * 1000).toISOString(),
    retrievedAt, engagement: { metric: "answers" as const, count: item.answer_count },
  }));
}

const stopWords = new Set("a an and are as at be by for from how i in is it of on or the to was what when where who why with".split(" "));
function fingerprint(signal: SourceSignal) {
  return `${signal.title} ${signal.excerpt}`.toLowerCase().replace(/https?:\/\/\S+/g, " ").match(/[a-z0-9]{3,}/g)?.filter((word) => !stopWords.has(word)).slice(0, 30).sort().join(" ") ?? signal.id;
}
function similarity(a: string, b: string) {
  const left = new Set(a.split(" ")), right = new Set(b.split(" "));
  const overlap = [...left].filter((word) => right.has(word)).length;
  return overlap / Math.max(1, Math.min(left.size, right.size));
}
export function analyzeSignals(signals: SourceSignal[]): OpportunityFinding[] {
  const groups: SourceSignal[][] = [];
  for (const signal of signals) {
    const key = fingerprint(signal);
    const group = groups.find((items) => similarity(key, fingerprint(items[0])) >= 0.6);
    if (group) group.push(signal); else groups.push([signal]);
  }
  return groups.map((sources) => {
    const first = sources[0];
    return { name: first.title, problem: first.excerpt || first.title, buyer: "Unknown" as const, gap: "Unknown" as const, business: "Unqualified" as const, investment: "Unknown" as const, monthlyProfit: "Unknown" as const, strength: "Unrated" as const, confidence: "Low" as const, sources, missing: ["Named buyer and payment evidence", "Alternative solutions and their gap", "Location-specific demand", "Priced unit economics and funding"] };
  }).sort((a, b) => b.sources.length - a.sources.length);
}

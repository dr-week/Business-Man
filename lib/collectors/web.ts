import { z } from "zod";
import type { SourceSignal } from "@/lib/discovery";

const source = z.object({
  id: z.string().max(100), provider: z.string().max(100), kind: z.enum(["discussion", "official", "buyer", "supplier"]).optional(), authorId: z.string().max(200).optional(), title: z.string().max(240), excerpt: z.string().max(1200),
  url: z.string().url().refine((url) => new URL(url).protocol === "https:"), publishedAt: z.string().max(40),
  retrievedAt: z.string().datetime({ offset: true }),
  engagement: z.object({ metric: z.enum(["comments", "answers"]), count: z.number().int().nonnegative() }).optional(),
  comments: z.number().int().nonnegative().optional(),
  facts: z.object({ tables: z.array(z.array(z.string().max(180)).max(6)).max(30), products: z.array(z.object({ name: z.string().max(200), price: z.string().max(40), currency: z.string().max(8) })).max(50) }).optional(),
}).refine((value) => value.engagement !== undefined || value.comments !== undefined, "Missing engagement metric");
const result = z.object({ results: z.array(z.unknown()).max(3) });
function isSafeHttps(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}
const resultItem = z.object({
  url: z.string().max(2000).refine(isSafeHttps, "Expected a public HTTPS URL"),
  status: z.enum(["ok", "blocked", "failed", "unsupported"]),
  reason: z.string().max(240).optional(),
  signal: source.optional(),
});

function sourceHost(value: unknown): string {
  if (typeof value !== "string") return "Supplied URL";
  try { return isSafeHttps(value) ? new URL(value).hostname : "Supplied URL"; }
  catch { return "Supplied URL"; }
}

/** Keep valid page results when a sibling row violates the collector contract. */
export function parseCollectorResults(payload: unknown): { sources: SourceSignal[]; errors: string[] } {
  const envelope = result.parse(payload);
  const sources: SourceSignal[] = [], errors: string[] = [];
  for (const candidate of envelope.results) {
    const parsed = resultItem.safeParse(candidate);
    if (!parsed.success) {
      const url = candidate && typeof candidate === "object" ? (candidate as { url?: unknown }).url : undefined;
      errors.push(`${sourceHost(url)}: Invalid collector result`);
      continue;
    }
    const item = parsed.data;
    if (item.status === "ok" && item.signal) {
      const { comments, ...signal } = item.signal;
      sources.push({ ...signal, engagement: signal.engagement ?? { metric: "comments", count: comments ?? 0 } });
    }
    else errors.push(`${sourceHost(item.url)}: ${item.reason ?? (item.status === "ok" ? "No usable content" : item.status)}`);
  }
  return { sources, errors };
}

/** The rest of the app depends on this contract, not on a particular scraper. */
export async function collectWebPages(urls: string[], config: { url?: string; key?: string }, signal: AbortSignal): Promise<{ sources: SourceSignal[]; errors: string[] }> {
  if (!urls.length) return { sources: [], errors: [] };
  if (!config.url || !config.key) return { sources: [], errors: ["Web collector not configured"] };
  try {
    const endpoint = new URL(config.url);
    if (endpoint.username || endpoint.password || (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)))) throw new Error("Invalid endpoint");
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ urls }), redirect: "manual", signal: AbortSignal.any([signal, AbortSignal.timeout(35000)]),
    });
    if (!response.ok) throw new Error("Collector unavailable");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty response");
    const decoder = new TextDecoder(); let text = ""; let bytes = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 200000) throw new Error("Response too large"); text += decoder.decode(part.value, { stream: true }); } text += decoder.decode(); }
    finally { await reader.cancel().catch(() => {}); }
    return parseCollectorResults(JSON.parse(text));
  } catch { return { sources: [], errors: ["Web collector unavailable or response invalid"] }; }
}

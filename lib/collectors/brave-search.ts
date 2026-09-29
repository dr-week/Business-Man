import { z } from "zod";

const payloadSchema = z.object({
  web: z.object({
    results: z.array(z.object({
      title: z.string().max(1000),
      url: z.string().url(),
      description: z.string().max(5000).optional(),
    })).max(20).optional(),
  }).optional(),
});

const countries: Record<string, string> = {
  australia: "AU", canada: "CA", france: "FR", germany: "DE", india: "IN",
  japan: "JP", "united kingdom": "GB", uk: "GB", "united states": "US", usa: "US",
};

export type WebResearchResult = { title: string; url: string; snippet: string };

/** Search candidates only. Results are transient and excluded from scores and persistence. */
export async function collectBraveWebResults(topic: string, geography: string, apiKey?: string, signal?: AbortSignal): Promise<WebResearchResult[]> {
  if (!apiKey) return [];
  const terms = `${topic.slice(0, 240)} ${geography.slice(0, 80)} business market`;
  const query = new URL("https://api.search.brave.com/res/v1/web/search");
  query.searchParams.set("q", terms.slice(0, 400));
  query.searchParams.set("count", "8");
  query.searchParams.set("safesearch", "moderate");
  const country = countries[geography.split(",").at(-1)?.trim().toLowerCase() ?? ""];
  if (country) query.searchParams.set("country", country);

  const response = await fetch(query, {
    signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8000)]),
    redirect: "manual",
    headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
  });
  if (!response.ok) throw new Error(`Web search unavailable (${response.status})`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty web search response");
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512_000) throw new Error("Web search response too large");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { await reader.cancel(); }

  const parsed = payloadSchema.parse(JSON.parse(text));
  return (parsed.web?.results ?? []).flatMap((item) => {
    try {
      const url = new URL(item.url);
      if (url.protocol !== "https:" || url.username || url.password) return [];
      return [{ title: item.title.trim().slice(0, 240) || url.hostname, url: url.href, snippet: (item.description ?? "").replace(/\s+/g, " ").trim().slice(0, 600) }];
    } catch { return []; }
  }).slice(0, 8);
}

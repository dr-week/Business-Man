import { z } from "zod";
import type { SourceSignal } from "@/lib/discovery";

const source = z.object({
  id: z.string().max(100), provider: z.string().max(100), title: z.string().max(240), excerpt: z.string().max(1200),
  url: z.string().url().refine((url) => new URL(url).protocol === "https:"), publishedAt: z.string().max(40),
  retrievedAt: z.string().datetime({ offset: true }), comments: z.number().int().nonnegative(),
  facts: z.object({ tables: z.array(z.array(z.string().max(180)).max(6)).max(30), products: z.array(z.object({ name: z.string().max(200), price: z.string().max(40), currency: z.string().max(8) })).max(50) }).optional(),
});
const result = z.object({ results: z.array(z.object({ url: z.string().max(2000), status: z.enum(["ok", "blocked", "failed", "unsupported"]), reason: z.string().max(240).optional(), signal: source.optional() })).max(3) });

/** The rest of the app depends on this contract, not on a particular scraper. */
export async function collectWebPages(urls: string[], config: { url?: string; key?: string }, signal: AbortSignal): Promise<{ sources: SourceSignal[]; errors: string[] }> {
  if (!urls.length) return { sources: [], errors: [] };
  if (!config.url || !config.key) return { sources: [], errors: ["Web collector not configured"] };
  try {
    const endpoint = new URL(config.url);
    if (endpoint.username || endpoint.password || (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)))) throw new Error("Invalid endpoint");
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ urls }), redirect: "error", signal: AbortSignal.any([signal, AbortSignal.timeout(35000)]),
    });
    if (!response.ok) throw new Error("Collector unavailable");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty response");
    const decoder = new TextDecoder(); let text = ""; let bytes = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 200000) throw new Error("Response too large"); text += decoder.decode(part.value, { stream: true }); } text += decoder.decode(); }
    finally { await reader.cancel(); }
    const data = result.parse(JSON.parse(text));
    return {
      sources: data.results.flatMap((item) => item.status === "ok" && item.signal ? [item.signal] : []),
      errors: data.results.filter((item) => item.status !== "ok" || !item.signal).map((item) => `${new URL(item.url).hostname}: ${item.reason ?? "No usable content"}`),
    };
  } catch { return { sources: [], errors: ["Web collector unavailable or response invalid"] }; }
}

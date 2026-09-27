import { XMLParser } from "fast-xml-parser";

export type NewsItem = { title: string; url: string; source: string; publishedAt: string; summary: string };
export type NewsFeed = { items: NewsItem[]; fetchedAt: string; unavailable: string[]; stale: boolean };
const feeds = [
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", domains: ["bbc.co.uk", "bbc.com"] },
  { name: "The Guardian", url: "https://www.theguardian.com/business/rss", domains: ["theguardian.com"] },
] as const;
const parser = new XMLParser({ ignoreAttributes: true, processEntities: false, parseTagValue: false });
const clean = (value: unknown, limit: number) => typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim().slice(0, limit) : "";
let cached: NewsFeed | undefined;
let expires = 0;
let pending: Promise<NewsFeed> | undefined;

async function readFeed(feed: typeof feeds[number]): Promise<NewsItem[]> {
  const response = await fetch(feed.url, { signal: AbortSignal.timeout(8000), redirect: "error", headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
  if (!response.ok || !response.body) throw new Error("Feed unavailable");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let xml = ""; let bytes = 0;
  try { while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 500000) throw new Error("Feed too large"); xml += decoder.decode(value, { stream: true }); } xml += decoder.decode(); }
  finally { await reader.cancel(); }
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported XML declaration");
  const raw = parser.parse(xml)?.rss?.channel?.item;
  if (!raw) throw new Error("Invalid RSS feed");
  return (Array.isArray(raw) ? raw : [raw]).slice(0, 40).flatMap((item: Record<string, unknown>) => {
    try {
      const url = new URL(String(item.link));
      if (url.protocol !== "https:" || url.username || url.password || !feed.domains.some((domain) => url.hostname === domain || url.hostname.endsWith("." + domain))) return [];
      for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_")) url.searchParams.delete(key);
      url.hash = "";
      const date = Date.parse(String(item.pubDate)); const title = clean(item.title, 180);
      if (!title || !Number.isFinite(date) || date > Date.now() + 300000) return [];
      return [{ title, url: url.href, source: feed.name, publishedAt: new Date(date).toISOString(), summary: clean(item.description, 180) }];
    } catch { return []; }
  });
}

export async function getNews(): Promise<NewsFeed> {
  if (cached && Date.now() < expires) return cached;
  if (pending) return pending;
  pending = (async () => {
    const results = await Promise.allSettled(feeds.map(readFeed));
    const unavailable = results.flatMap((result, index) => result.status === "rejected" ? [feeds[index].name] : []);
    const sorted = results
      .flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const seen = new Set<string>();
    const items = sorted.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    }).slice(0, 30);
    if (!items.length) {
      if (!cached) throw new Error("News feeds unavailable");
      cached = { ...cached, stale: true, unavailable }; expires = Date.now() + 60000; return cached;
    }
    cached = { items, fetchedAt: new Date().toISOString(), unavailable, stale: false };
    expires = Date.now() + 10 * 60000;
    return cached;
  })();
  try { return await pending; } finally { pending = undefined; }
}

export function resetNewsCache(): void {
  cached = undefined;
  expires = 0;
  pending = undefined;
}

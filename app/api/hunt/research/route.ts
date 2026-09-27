import { ownerId, isCrossOrigin } from "@/lib/hunt-api";
import { collectSignals, collectStackOverflow } from "@/lib/discovery";
import { analyzeResearch, researchInput } from "@/lib/research-engine";

import { prepareResearchQuery } from "@/lib/research-query";
import { classifyQuery } from "@/lib/query-classifier";
import { collectWebPages } from "@/lib/collectors/web";
import { env } from "cloudflare:workers";

const cache = new Map<string, { expires: number; query: ReturnType<typeof prepareResearchQuery>; result: ReturnType<typeof analyzeResearch>; errors: string[] }>();
export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  if (!await ownerId()) return Response.json({ error: "Sign in to research." }, { status: 401 });
  const parsed = researchInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the topic, location, and investment range." }, { status: 400 });
  const input = parsed.data;
  let query = prepareResearchQuery(input.topic, { geography: input.geography, original: input.useOriginalQuery });
  const key = JSON.stringify(input);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Response.json({ query: hit.query, opportunities: hit.result, providerErrors: hit.errors, cached: true }, { headers: { "Cache-Control": "no-store" } });
  if (!input.useOriginalQuery) query = await classifyQuery(query, { url: env.LAYA_URL, key: env.LAYA_API_KEY }, request.signal);
  if (request.signal.aborted) return Response.json({ error: "Research cancelled." }, { status: 499 });
  const urls = [...new Set([...(input.sourceUrls ?? []), ...(/^https:\/\//i.test(input.topic) ? [input.topic] : [])])].slice(0, 3);
  const [results, web] = await Promise.all([Promise.allSettled([
    collectSignals(query.searchTerms, undefined, request.signal),
    collectStackOverflow(query.searchTerms, request.signal),
  ]), collectWebPages(urls, { url: env.COLLECTOR_URL, key: env.COLLECTOR_KEY }, request.signal)]);
  if (request.signal.aborted) return Response.json({ error: "Research cancelled." }, { status: 499 });
  const topicWords = query.searchTerms.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
  const sources = [...web.sources, ...results.flatMap((item) => item.status === "fulfilled" ? item.value : []).filter((source) => {
    const text = (source.title + " " + source.excerpt).toLowerCase();
    return topicWords.some((word) => text.includes(word));
  })];
  const providerErrors = results.flatMap((item, index) => item.status === "rejected" ? [(index === 0 ? "Ask HN" : "Stack Overflow") + " unavailable"] : []);
  const communitiesFailed = providerErrors.length === 2;
  providerErrors.push(...web.errors);
  if (communitiesFailed && !web.sources.length) return Response.json({ error: "Research sources unavailable. Retry later." }, { status: 502 });
  const opportunities = analyzeResearch(input, sources);
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 10 * 60_000, query, result: opportunities, errors: providerErrors });
  return Response.json({ query, opportunities, providerErrors, cached: false }, { headers: { "Cache-Control": "no-store" } });
}

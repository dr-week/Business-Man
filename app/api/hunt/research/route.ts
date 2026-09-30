import { ownerId, isCrossOrigin } from "@/lib/hunt-api";
import { collectSignals, collectStackOverflow } from "@/lib/discovery";
import { analyzeResearch, researchInput } from "@/lib/research-engine";

import { prepareResearchQuery } from "@/lib/research-query";
import { classifyQuery } from "@/lib/query-classifier";
import { collectWebPages } from "@/lib/collectors/web";
import { collectGitHubAlternatives } from "@/lib/collectors/github-alternatives";
import { attachCandidateAlternatives } from "@/lib/market-alternatives";
import { collectBraveWebResults } from "@/lib/collectors/brave-search";
import type { WebResearchResult } from "@/lib/collectors/brave-search";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { RESEARCH_RUN_SCHEMA_VERSION, saveResearchRun } from "@/lib/research-run-store";
import { readLimitedJson } from "@/lib/read-limited-json";
import { createResearchGate } from "@/lib/research-gate";
import { createBoundedCache } from "@/lib/bounded-cache";

const researchGate = createResearchGate(2, 6);
const cache = createBoundedCache<{ query: ReturnType<typeof prepareResearchQuery>; result: ReturnType<typeof analyzeResearch>; errors: string[]; webResearch: WebResearchResult[] }>(8, 1_048_576);

const queryStopWords = new Set("a an and are as at be before by can could do does for from get give go how i in into is it make my of on or sell start the their them there they this to want was what when where which who why with would you your business opportunity opportunities idea ideas".split(" "));
const normalizeWord = (word: string) => word.toLowerCase().replace(/ies$/, "y").replace(/s$/, "");
function matchesResearchTopic(text: string, topic: string, geography: string) {
  const locationWords = new Set(geography.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const anchors = [...new Set(topic.toLowerCase().match(/[a-z0-9]+/g) ?? [])]
    .filter((word) => word.length >= 2 && !queryStopWords.has(word) && !locationWords.has(word))
    .map(normalizeWord);
  if (!anchors.length) return false;
  const sourceWords = new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map(normalizeWord));
  return anchors.some((word) => sourceWords.has(word));
}

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to research." }, { status: 401 });
  let body: unknown;
  try { body = await readLimitedJson(request, 16_384); }
  catch { return Response.json({ error: "Invalid or oversized research request." }, { status: 400 }); }
  const parsed = researchInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the topic, location, and investment range." }, { status: 400 });
  const input = parsed.data;
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  let release: (() => void) | undefined;
  try { release = await researchGate.acquire(request.signal); }
  catch (error) { return Response.json({ error: request.signal.aborted ? "Research cancelled." : (error as Error).message }, { status: request.signal.aborted ? 499 : 503 }); }
  try {
  let query = prepareResearchQuery(input.topic, { geography: input.geography, original: input.useOriginalQuery });
  const key = JSON.stringify([owner, input]);
  const hit = forceRefresh ? undefined : cache.get(key);
  if (hit) {
    return Response.json({ query: hit.query, opportunities: hit.result, providerErrors: hit.errors, webResearch: hit.webResearch, webSearchConfigured: !!env.BRAVE_SEARCH_API_KEY, cached: true }, { headers: { "Cache-Control": "no-store" } });
  }
  if (!input.useOriginalQuery) query = await classifyQuery(query, { url: env.LAYA_URL, key: env.LAYA_API_KEY }, request.signal);
  if (request.signal.aborted) return Response.json({ error: "Research cancelled." }, { status: 499 });
  const urls = [...new Set([...(input.sourceUrls ?? []), ...(/^https:\/\//i.test(input.topic) ? [input.topic] : [])])].slice(0, 3);
  const [results, web, github, webSearch] = await Promise.all([Promise.allSettled([
    collectSignals(query.searchTerms, undefined, request.signal),
    collectStackOverflow(query.searchTerms, request.signal),
  ]), collectWebPages(urls, { url: env.COLLECTOR_URL, key: env.COLLECTOR_KEY }, request.signal),
    collectGitHubAlternatives(query.searchTerms, request.signal).then((value) => ({ value, error: null })).catch(() => ({ value: [], error: "GitHub alternatives unavailable" })),
    collectBraveWebResults(query.searchTerms, input.geography, env.BRAVE_SEARCH_API_KEY, request.signal).then((value) => ({ value, error: null })).catch(() => ({ value: [], error: "Web search unavailable" }))]);
  if (request.signal.aborted) return Response.json({ error: "Research cancelled." }, { status: 499 });
  const sources = [...web.sources, ...results.flatMap((item) => item.status === "fulfilled" ? item.value : []).filter((source) => {
    return matchesResearchTopic(source.title, query.searchTerms, input.geography);
  })];
  const providerErrors = results.flatMap((item, index) => item.status === "rejected" ? [(index === 0 ? "Ask HN" : "Stack Overflow") + " unavailable"] : []);
  const communitiesFailed = providerErrors.length === 2;
  providerErrors.push(...web.errors);
  if (github.error) providerErrors.push(github.error);
  if (webSearch.error) providerErrors.push(webSearch.error);
  if (communitiesFailed && !web.sources.length && !webSearch.value.length) return Response.json({ error: "Research sources unavailable. Retry later." }, { status: 502 });
  const opportunities = attachCandidateAlternatives(analyzeResearch(input, sources), github.value);
  const runId = crypto.randomUUID();
  try {
    await saveResearchRun(getDb(), {
      id: runId, ownerId: owner, schemaVersion: RESEARCH_RUN_SCHEMA_VERSION, topic: input.topic, geography: input.geography, currency: input.currency, createdAt: new Date().toISOString(),
      input: input as Record<string, unknown>,
      result: { query, opportunities, providerErrors },
    });
  } catch {
    providerErrors.push("Research completed, but saving to your archive failed.");
  }
  cache.set(key, { query, result: opportunities, errors: providerErrors, webResearch: webSearch.value }, 10 * 60_000);
  return Response.json({ query, opportunities, providerErrors, webResearch: webSearch.value, webSearchConfigured: !!env.BRAVE_SEARCH_API_KEY, cached: false, runId }, { headers: { "Cache-Control": "no-store" } });
  } finally { release?.(); }
}

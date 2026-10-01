import { z } from "zod";
import { readLimitedJson } from "@/lib/read-limited-json";

const responseSchema = z.object({
  results: z.array(z.object({
    id: z.string().max(200),
    display_name: z.string().max(1000),
    publication_year: z.number().int().nullable(),
    doi: z.string().max(500).nullable().optional(),
    cited_by_count: z.number().int().nonnegative(),
    primary_location: z.object({ landing_page_url: z.string().max(2000).nullable().optional() }).nullable().optional(),
    best_oa_location: z.object({ landing_page_url: z.string().max(2000).nullable().optional() }).nullable().optional(),
  })).max(3),
});

export type AcademicResearchResult = { title: string; url: string; year: number | null; citedByCount: number };

function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Fetch up to three scholarly leads; these remain context and never enter opportunity scoring. */
export async function collectOpenAlexWorks(query: string, signal?: AbortSignal): Promise<AcademicResearchResult[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query.slice(0, 240));
  url.searchParams.set("per_page", "3");
  url.searchParams.set("select", "id,display_name,publication_year,doi,primary_location,best_oa_location,cited_by_count");
  const response = await fetch(url, {
    signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8000)]),
    redirect: "manual", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`OpenAlex unavailable (${response.status})`);
  const parsed = responseSchema.parse(await readLimitedJson(response, 256_000));
  return parsed.results.flatMap((work) => {
    const href = safeHttpsUrl(work.best_oa_location?.landing_page_url)
      ?? safeHttpsUrl(work.primary_location?.landing_page_url)
      ?? safeHttpsUrl(work.doi)
      ?? safeHttpsUrl(work.id);
    if (!href || !work.display_name.trim()) return [];
    return [{ title: work.display_name.trim().slice(0, 240), url: href, year: work.publication_year, citedByCount: work.cited_by_count }];
  });
}

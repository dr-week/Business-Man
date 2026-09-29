import { z } from "zod";
import { readLimitedJson } from "@/lib/read-limited-json";

const repository = z.object({
  full_name: z.string().max(200), html_url: z.string().url().max(300), description: z.string().max(2000).nullable(),
  stargazers_count: z.number().int().nonnegative(), updated_at: z.string().max(40), archived: z.boolean(), fork: z.boolean(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});
const responseShape = z.object({ items: z.array(repository).max(10) });

export type CandidateAlternative = {
  name: string; url: string; description: string; stars: number;
  updatedAt: string; license: string | null;
};

export async function collectGitHubAlternatives(topic: string, signal?: AbortSignal): Promise<CandidateAlternative[]> {
  const terms = topic.match(/[\p{L}\p{N}]{3,}/gu)?.slice(0, 7).join(" ");
  if (!terms) return [];
  const url = new URL("https://api.github.com/search/repositories");
  url.search = new URLSearchParams({ q: `${terms} in:name,description archived:false fork:false`, sort: "stars", per_page: "10" }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8000)]),
    headers: { Accept: "application/vnd.github+json", "User-Agent": "Businessman-research", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!response.ok) throw new Error(`GitHub search unavailable (${response.status})`);
  const parsed = responseShape.parse(await readLimitedJson(response, 256_000));
  return parsed.items.filter((item) => !item.archived && !item.fork && new URL(item.html_url).hostname === "github.com")
    .map((item) => ({ name: item.full_name, url: item.html_url, description: item.description ?? "No description provided", stars: item.stargazers_count, updatedAt: item.updated_at, license: item.license?.spdx_id ?? null }));
}

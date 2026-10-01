import { afterEach, describe, expect, it, vi } from "vitest";
import { collectOpenAlexWorks } from "./openalex";

describe("OpenAlex literature collector", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns bounded scholarly links and uses a safe record link when a landing page is unsafe", async () => {
    const fetch = vi.fn(async () => Response.json({ results: [
      { id: "https://openalex.org/W1", display_name: "Local demand research", publication_year: 2024, doi: "https://doi.org/10.1234/demo", cited_by_count: 12, best_oa_location: { landing_page_url: "https://repo.example/paper" } },
      { id: "https://openalex.org/W2", display_name: "Unsafe link", publication_year: null, doi: null, cited_by_count: 0, primary_location: { landing_page_url: "javascript:alert(1)" } },
    ] }));
    vi.stubGlobal("fetch", fetch);

    const works = await collectOpenAlexWorks("local small business demand");
    expect(works).toEqual([
      { title: "Local demand research", url: "https://repo.example/paper", year: 2024, citedByCount: 12 },
      { title: "Unsafe link", url: "https://openalex.org/W2", year: null, citedByCount: 0 },
    ]);
    expect(works.every((work) => new URL(work.url).protocol === "https:")).toBe(true);
    const calls = fetch.mock.calls as unknown as Array<[unknown]>;
    const requestUrl = new URL(String(calls[0]?.[0]));
    expect(requestUrl.searchParams.get("per_page")).toBe("3");
    expect(requestUrl.searchParams.get("select")).toContain("cited_by_count");
  });

  it("rejects an unavailable provider instead of returning fabricated results", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 429 })));
    await expect(collectOpenAlexWorks("market demand")).rejects.toThrow("OpenAlex unavailable (429)");
  });
});

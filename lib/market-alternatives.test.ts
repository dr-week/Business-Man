import { describe, expect, it } from "vitest";
import { attachCandidateAlternatives } from "./market-alternatives";
import { analyzeResearch, researchInput } from "./research-engine";
import type { SourceSignal } from "./discovery";

const input = researchInput.parse({ topic: "inventory software", geography: "Goa, India", budget: 100000 });
const source: SourceSignal = {
  id: "1", provider: "Ask HN", title: "Inventory software for restaurants", excerpt: "We lose time with restaurant inventory software every week.",
  url: "https://news.ycombinator.com/item?id=1", publishedAt: "2026-01-01", retrievedAt: "2026-09-29", comments: 1,
};

describe("candidate alternatives", () => {
  it("ranks repositories by domain overlap and omits generic vocabulary matches", () => {
    const [original] = analyzeResearch(input, [source]);
    const [result] = attachCandidateAlternatives([original], [
      { name: "example/restaurant-inventory", url: "https://github.com/example/restaurant-inventory", description: "restaurant inventory management", stars: 12, pushedAt: "2026-01-01", license: "MIT" },
      { name: "example/general", url: "https://github.com/example/general", description: "business software service platform", stars: 10000, pushedAt: "2026-01-01", license: "MIT" },
      { name: "example/other", url: "https://github.com/example/other", description: "calendar application", stars: 1000, pushedAt: "2026-01-01", license: "MIT" },
    ]);
    expect(result.candidateAlternatives).toHaveLength(1);
    expect(result.candidateAlternatives?.[0]).toMatchObject({ matchedTerms: expect.arrayContaining(["inventory", "restaurant"]) });
    expect(result.strength).toBe(original.strength);
    expect(result.sources).toEqual(original.sources);
  });

  it("uses code-push recency to break relevance ties before popularity", () => {
    const [original] = analyzeResearch(input, [source]);
    const [result] = attachCandidateAlternatives([original], [
      { name: "restaurant-inventory", url: "https://github.com/example-old/restaurant-inventory", description: "restaurant inventory management", stars: 10000, pushedAt: "2024-01-01", license: "MIT" },
      { name: "restaurant-inventory", url: "https://github.com/example-current/restaurant-inventory", description: "restaurant inventory management", stars: 10, pushedAt: "2026-08-01", license: "MIT" },
    ]);
    expect(result.candidateAlternatives?.map(({ url }) => url)).toEqual([
      "https://github.com/example-current/restaurant-inventory",
      "https://github.com/example-old/restaurant-inventory",
    ]);
  });

  it("collapses URL variants for one repository and keeps its freshest record", () => {
    const [original] = analyzeResearch(input, [source]);
    const [result] = attachCandidateAlternatives([original], [
      { name: "example/restaurant-inventory", url: "https://github.com/Example/restaurant-inventory.git/", description: "restaurant inventory management", stars: 12, pushedAt: "2025-01-01", license: "MIT" },
      { name: "example/restaurant-inventory", url: "https://github.com/example/restaurant-inventory", description: "restaurant inventory management", stars: 20, pushedAt: "2026-08-01", license: "MIT" },
    ]);
    expect(result.candidateAlternatives).toHaveLength(1);
    expect(result.candidateAlternatives?.[0]).toMatchObject({ url: "https://github.com/example/restaurant-inventory", stars: 20, pushedAt: "2026-08-01" });
  });
});

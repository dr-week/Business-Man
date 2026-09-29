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
  it("attaches relevant repositories without changing evidence or strength", () => {
    const [original] = analyzeResearch(input, [source]);
    const [result] = attachCandidateAlternatives([original], [
      { name: "example/restaurant-inventory", url: "https://github.com/example/restaurant-inventory", description: "restaurant inventory management", stars: 12, updatedAt: "2026-01-01", license: "MIT" },
      { name: "example/other", url: "https://github.com/example/other", description: "calendar application", stars: 1000, updatedAt: "2026-01-01", license: "MIT" },
    ]);
    expect(result.candidateAlternatives).toHaveLength(1);
    expect(result.strength).toBe(original.strength);
    expect(result.sources).toEqual(original.sources);
  });
});

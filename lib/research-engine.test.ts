import { describe, expect, it } from "vitest";
import { analyzeResearch, blankFinancials, calculateFinancials, groupSources, researchInput } from "./research-engine";
import type { SourceSignal } from "./discovery";

const input = researchInput.parse({ topic: "inventory", geography: "Goa, India", budget: 150000 });
const source = (id: string, title: string, provider: SourceSignal["provider"] = "Ask HN"): SourceSignal => ({
  id, title, provider, excerpt: "We lose time tracking inventory every week.",
  url: provider === "Ask HN" ? "https://news.ycombinator.com/item?id=" + id : "https://stackoverflow.com/questions/" + id,
  publishedAt: "2026-01-02T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z", comments: 10,
});
describe("market research", () => {
  it("merges overlapping sources while retaining independent links", () => {
    const groups = groupSources([source("1", "How to track restaurant inventory?"), source("2", "How to track restaurant inventory?"), source("1", "How to track restaurant inventory?")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((item) => item.id)).toEqual(["1", "2"]);
  });
  it("keeps discussion-only findings unrated and financial inputs missing", () => {
    const [item] = analyzeResearch(input, [source("1", "How to track restaurant inventory?")]);
    expect(item.sources).toHaveLength(1);
    expect(item.strength).toBeNull();
    expect(item.financials).toBeNull();
    expect(item.claims[0].direction).toBe("context");
    expect(item.assumptions.price.value).toBeNull();
  });
  it("links explicit first-person claims and lowers confidence on contradiction", () => {
    const [item] = analyzeResearch(input, [
      { ...source("1", "How to track restaurant inventory?"), excerpt: "We lose stock every week. We pay for a spreadsheet but it fails." },
      { ...source("2", "How to track restaurant inventory?", "Stack Overflow"), excerpt: "Our existing tool works fine. We do not have this problem." },
    ]);
    expect(item.claims.some((claim) => claim.factor === "Severity and frequency")).toBe(true);
    expect(item.claims.some((claim) => claim.direction === "contradicts")).toBe(true);
    expect(item.confidence).toBe("Low");
    expect(item.factors.find((factor) => factor.name === "Severity and frequency")?.score).toBe(5);
    expect(item.strength).toBeNull();
  });
  it("calculates cash economics from dated assumptions without treating missing as zero", () => {
    const a = blankFinancials(input);
    const values = { price: 1000, variableCost: 400, fixedCost: 20000, setupCost: 50000, equipmentCost: 25000, openingInventory: 15000, reserve: 10000, lowVolume: 50, baseVolume: 100, highVolume: 150 };
    for (const [key, value] of Object.entries(values)) {
      a[key as keyof typeof values] = { ...a[key as keyof typeof values], value, provenance: "User-entered", date: "2026-09-27" };
    }
    expect(calculateFinancials(a)).toMatchObject({
      contribution: 600, funding: 100000, breakEven: 34, paybackMonth: 3,
      scenarios: [{ profit: 10000 }, { revenue: 100000, profit: 40000 }, { profit: 70000 }],
    });
    a.variableCost.value = 1200;
    expect(calculateFinancials(a)?.breakEven).toBeNull();
    a.variableCost.value = null;
    expect(calculateFinancials(a)).toBeNull();
  });
  it("incorporates web collector sources with dates, URL, and provenance into findings", () => {
    const webSource: SourceSignal = {
      id: "web:abc123",
      title: "Commercial Warehouse Inventory System",
      provider: "Web page",
      excerpt: "We operate 3 warehouses and lose stock every week. We currently use a spreadsheet but it fails.",
      url: "https://example.com/warehousing",
      publishedAt: "2026-05-10T00:00:00.000Z",
      retrievedAt: "2026-09-27T00:00:00.000Z",
      comments: 0,
    };
    const [item] = analyzeResearch(input, [webSource]);
    expect(item.sources).toHaveLength(1);
    expect(item.sources[0].url).toBe("https://example.com/warehousing");
    expect(item.sources[0].publishedAt).toBe("2026-05-10T00:00:00.000Z");
    expect(item.sources[0].provider).toBe("Web page");
    expect(item.claims.some((c) => c.sourceIds.includes("web:abc123"))).toBe(true);
    expect(item.assumptions.price.provenance).toBe("Missing");
    expect(item.strength).toBeNull();
  });
});

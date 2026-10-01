import { describe, expect, it } from "vitest";
import { parseSavedResearchBrief } from "./saved-research-brief";
import { generateExecutiveDossierMarkdown } from "./dossier-report";

const validExport = {
  format: "businessman-research-run",
  formatVersion: 1,
  run: {
    schemaVersion: 1,
    topic: "Commercial laundry",
    geography: "Pune, India",
    currency: "INR",
    createdAt: "2026-10-01T10:00:00.000Z",
    result: {
      opportunities: [{
        id: "laundry",
        name: "Laundry route service",
        category: "Services",
        geography: "Pune, India",
        buyer: "Local hotels",
        problem: "Unreliable pickup windows",
        offering: null,
        alternatives: [],
        gap: "No dependable early route",
        risks: ["Demand is unverified"],
        confidence: "Low",
        strength: null,
        financials: {
          funding: 100000,
          scenarios: [
            { name: "Low", profit: -1000, units: 5, margin: -2, revenue: 5000, variableCosts: 4000, fixedCosts: 2000 },
            { name: "Base", profit: 1000, units: 10, margin: 10, revenue: 10000, variableCosts: 7000, fixedCosts: 2000 },
            { name: "High", profit: 5000, units: 15, margin: 30, revenue: 15000, variableCosts: 8000, fixedCosts: 2000 },
          ],
        },
        sources: [{ id: "s1", provider: "Forum", title: "Local laundry demand", excerpt: "Hotels report late pickups in the area.", url: "https://example.com/research", publishedAt: "2026-09-30", retrievedAt: "2026-10-01" }],
        claims: [],
        missing: ["Buyer payment evidence"],
      }],
    },
  },
};

describe("saved research brief export", () => {
  it("converts an archived run into the existing readable dossier format", () => {
    const brief = parseSavedResearchBrief(validExport);
    const markdown = generateExecutiveDossierMarkdown(brief.opportunities, brief.metadata);

    expect(brief.metadata).toMatchObject({ topic: "Commercial laundry", geography: "Pune, India", currency: "INR", opportunitiesCount: 1 });
    expect(markdown).toContain("Laundry route service");
    expect(markdown).toContain("https://example.com/research");
    expect(markdown).toContain("Buyer payment evidence");
  });

  it("rejects unsupported or unsafe source records", () => {
    expect(() => parseSavedResearchBrief({ ...validExport, run: { ...validExport.run, schemaVersion: 99 } })).toThrow();
    const invalidUrl = structuredClone(validExport);
    invalidUrl.run.result.opportunities[0].sources[0].url = "javascript:alert(1)";
    expect(() => parseSavedResearchBrief(invalidUrl)).toThrow();
  });
});

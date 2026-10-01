import { describe, expect, it } from "vitest";
import { createEvidenceCsv } from "./evidence-csv";

const metadata = { title: "Cafe demand", topic: "Cafe demand", geography: "Pune, India", generatedDate: "2026-10-01", currency: "INR", opportunitiesCount: 1 };

describe("evidence CSV export", () => {
  it("keeps each claim connected to its dated source record", () => {
    const csv = createEvidenceCsv([{
      id: "cafe", name: "Office lunch subscriptions", category: "Food", geography: "Pune, India",
      buyer: "Office manager", problem: "Lunch delays", offering: "Subscription meals", alternatives: [], gap: null,
      risks: [], confidence: "Medium", strength: 62, financials: null, missing: [],
      assumptions: {} as never, factors: [],
      claims: [{ id: "claim-1", text: "Nearby offices report recurring lunch delays.", direction: "supports", sourceIds: ["source-1"], publishedAt: "2025-06-01" }],
      sources: [{ id: "source-1", provider: "Open dataset", title: "District business register", excerpt: "2025 establishments", url: "https://example.org/dataset", publishedAt: "2025-06-01", retrievedAt: "2026-09-30" }],
    }], metadata);

    expect(csv).toContain('"claim_direction","claim","source_id"');
    expect(csv).toContain('"supports","Nearby offices report recurring lunch delays.","source-1","Open dataset"');
    expect(csv).toContain('"https://example.org/dataset","2025-06-01","2026-09-30","2025 establishments"');
    expect(csv).toContain("\r\n");
  });

  it("quotes cells and neutralizes spreadsheet formula prefixes", () => {
    const csv = createEvidenceCsv([{
      id: "idea", name: "=HYPERLINK(\"https://bad.test\")", category: "Test", geography: "Pune, India",
      buyer: null, problem: "Problem", offering: null, alternatives: [], gap: null, risks: [], confidence: "Low",
      strength: null, financials: null, missing: [], assumptions: {} as never, factors: [],
      claims: [{ id: "formula", text: "=cmd", direction: "context", sourceIds: [], publishedAt: null }], sources: [],
    }], metadata);

    expect(csv).toContain("'=HYPERLINK(");
    expect(csv).toContain('"\'=HYPERLINK(""https://bad.test"")"');
    expect(csv).toContain('"\u0027=cmd"');
  });

  it("preserves unlinked public-data records as context rows", () => {
    const csv = createEvidenceCsv([{
      id: "idea", name: "Local logistics", category: "Services", geography: "Pune, India", buyer: null,
      problem: "Delivery gaps", offering: null, alternatives: [], gap: null, risks: [], confidence: "Low",
      strength: null, financials: null, missing: [], assumptions: {} as never, factors: [], claims: [],
      sources: [{ id: "wb", provider: "World Bank Indicators API", title: "Internet users", excerpt: "National context only", url: "https://api.worldbank.org/v2/indicator/IT.NET.USER.ZS", publishedAt: "2024", retrievedAt: "2026-10-01" }],
    }], metadata);

    expect(csv).toContain('"context","","wb","World Bank Indicators API"');
  });
});

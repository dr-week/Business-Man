import { describe, expect, it } from "vitest";
import { generateExecutiveDossierMarkdown, type DossierReportMetadata } from "./dossier-report";
import { blankFinancials, type ResearchOpportunity } from "@/lib/research-engine";

const sampleOpportunity: ResearchOpportunity = {
  id: "test-opp-1",
  name: "Agent Commerce Adapters",
  category: "Platforms",
  geography: "India",
  buyer: "D2C Merchants",
  problem: "Merchants cannot interface with autonomous buyer agents.",
  offering: "UCP/ARD Protocol Adapter",
  alternatives: ["Manual entry"],
  gap: "No live Indian adapter",
  risks: ["Low merchant urgency", "Payment gateway integration complexity"],
  confidence: "Medium",
  strength: 78,
  financials: {
    contribution: 3000,
    funding: 45000,
    breakEven: 15,
    paybackMonth: 3,
    cashFlow: [{ month: 1, cumulative: -45000 }, { month: 2, cumulative: -20000 }, { month: 3, cumulative: 10000 }],
    scenarios: [
      { name: "Low", profit: 12000, units: 10, margin: 40, revenue: 30000, variableCosts: 8000, fixedCosts: 10000 },
      { name: "Base", profit: 34000, units: 25, margin: 55, revenue: 75000, variableCosts: 20000, fixedCosts: 21000 },
      { name: "High", profit: 65000, units: 45, margin: 65, revenue: 135000, variableCosts: 35000, fixedCosts: 35000 },
    ],
  },
  claims: [],
  assumptions: blankFinancials({ topic: "Agent Commerce", geography: "India", budget: 100000, currency: "INR" }),
  factors: [],
  missing: [],
  sources: [
    {
      id: "src-1",
      provider: "Google",
      url: "https://developers.googleblog.com/ucp",
      title: "Google UCP Protocol Spec",
      excerpt: "Universal Commerce Protocol standardizes checkout agents across merchant platforms.",
      publishedAt: "2026-03",
      retrievedAt: "2026-03",
      comments: 0,
    },
  ],
};

const metadata: DossierReportMetadata = {
  title: "Agent Commerce Indian Market",
  topic: "Agent Commerce",
  geography: "India",
  generatedDate: "2026-09-30",
  currency: "INR",
  opportunitiesCount: 1,
};

describe("dossier report generator", () => {
  it("generates structured markdown dossier with all core sections", () => {
    const report = generateExecutiveDossierMarkdown([sampleOpportunity], metadata);

    expect(report).toContain("# BUSINESSMAN INTELLIGENCE DESK");
    expect(report).toContain("EXECUTIVE MARKET DOSSIER: AGENT COMMERCE");
    expect(report).toContain("Geography: India");

    expect(report).toContain("### 1. EXECUTIVE SUMMARY & STRATEGIC THESIS");
    expect(report).toContain("### 2. OPPORTUNITY SCORECARD & COMPARATIVE MATRIX");
    expect(report).toContain("### 3. OPPORTUNITY DEEP-DIVES & RISK MITIGATION");
    expect(report).toContain("### 4. Suggested Validation Actions (not completed work)");
    expect(report).toContain("Linked Source Records (not independently verified)");
    expect(report).toContain("not actual results or forecasts");
    expect(report).toContain("require human review and execution");

    expect(report).toContain("Agent Commerce Adapters");
    expect(report).toContain("Platforms");
    expect(report).toContain("78/100");
    expect(report).toContain("No live Indian adapter");
    expect(report).toContain("Low merchant urgency");
    expect(report).toContain("Google UCP Protocol Spec");
  });

  it("handles opportunities with missing financials gracefully", () => {
    const oppWithoutFinancials: ResearchOpportunity = {
      id: "test-opp-2",
      name: "Rural Telematics Hub",
      category: "Devices",
      geography: "India",
      buyer: null,
      problem: "No GPS tracking",
      offering: null,
      alternatives: [],
      gap: null,
      risks: [],
      claims: [],
      assumptions: blankFinancials({ topic: "Rural Telematics Hub", geography: "India", budget: 50000, currency: "INR" }),
      factors: [],
      missing: [],
      confidence: "Low",
      strength: null,
      sources: [],
      financials: null,
    };

    const report = generateExecutiveDossierMarkdown([oppWithoutFinancials], metadata);
    expect(report).toContain("Rural Telematics Hub");
    expect(report).toContain("Needs check");
    expect(report).toContain("—");
  });
});

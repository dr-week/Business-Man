import { describe, expect, it } from "vitest";
import { generateMarketingCampaign } from "./marketing-automation";
import { blankFinancials, type ResearchOpportunity } from "./research-engine";

const sampleOpportunity: ResearchOpportunity = {
  id: "opp-solar-wash",
  name: "Automated Solar Panel Dry Cleaning Robot",
  category: "CleanTech",
  geography: "India",
  buyer: "Utility-scale Solar Farm EPCs & Asset Managers",
  problem: "Dust soiling causes 18% generation losses in Rajasthan, but water tankers are too expensive and scarce.",
  offering: "Waterless autonomous crawler robot with anti-static microfiber rollers.",
  alternatives: ["Manual migrant labour with water squeegees"],
  gap: "No local Indian robot under ₹1.5L with remote IoT telemetry",
  risks: ["Sandstorms jamming guide tracks", "Low initial operator tech literacy"],
  confidence: "High",
  strength: 84,
  financials: {
    contribution: 45000,
    funding: 250000,
    breakEven: 6,
    paybackMonth: 4,
    cashFlow: [{ month: 1, cumulative: -250000 }, { month: 2, cumulative: -120000 }, { month: 3, cumulative: 0 }, { month: 4, cumulative: 120000 }],
    scenarios: [
      { name: "Low", profit: 60000, units: 3, margin: 40, revenue: 150000, variableCosts: 45000, fixedCosts: 45000 },
      { name: "Base", profit: 180000, units: 8, margin: 60, revenue: 400000, variableCosts: 100000, fixedCosts: 120000 },
      { name: "High", profit: 340000, units: 14, margin: 70, revenue: 700000, variableCosts: 180000, fixedCosts: 180000 },
    ],
  },
  claims: [],
  assumptions: blankFinancials({ topic: "Solar Cleaning", geography: "India", budget: 250000, currency: "INR" }),
  factors: [],
  missing: [],
  sources: [],
};

describe("marketing-automation", () => {
  it("generates a complete multi-channel distribution kit from opportunity data", () => {
    const campaign = generateMarketingCampaign(sampleOpportunity, "INR");

    expect(campaign.opportunityName).toBe("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.targetAudience).toBe("Utility-scale Solar Farm EPCs & Asset Managers");
    expect(campaign.viralHook).toContain("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.xThread).toHaveLength(5);
    expect(campaign.xThread[0].text).toContain("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.linkedinPost).toContain("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.linkedinPost).toContain("CleanTech");
    expect(campaign.coldOutreachEmail.subject).toContain("Dust soiling");
    expect(campaign.coldOutreachEmail.body).toContain("Dust soiling");
    expect(campaign.productHuntPitch.tagline).toContain("Source-linked business opportunity research");
    expect(campaign.weeklyDistributionCadence).toHaveLength(5);
    expect(campaign.weeklyDistributionCadence[1].action).toContain("do not scrape or bulk-message");
    expect(campaign.weeklyDistributionCadence[3].successMeasure).toContain("Actual payments");
    expect(campaign.weeklyDistributionCadence[4].successMeasure).toContain("no response is not a positive signal");
    const generatedCopy = [campaign.viralHook, ...campaign.xThread.map((item) => item.text), campaign.linkedinPost, campaign.coldOutreachEmail.body, campaign.productHuntPitch.makerComment].join("\n");
    expect(generatedCopy).toContain("estimates, not actual results");
    expect(generatedCopy).not.toContain("90% of people");
    expect(generatedCopy).not.toContain("3–5 months");
    expect(generatedCopy).not.toContain("vetted");
    expect(campaign.coldOutreachEmail.body).not.toContain("operational savings");
  });

  it("handles opportunities with minimal data gracefully", () => {
    const minimalOpp: ResearchOpportunity = {
      id: "opp-min",
      name: "Local B2B SaaS",
      category: "Software",
      geography: "India",
      buyer: null,
      problem: "Invoicing is manual",
      offering: null,
      alternatives: [],
      gap: null,
      risks: [],
      claims: [],
      assumptions: blankFinancials({ topic: "Local B2B SaaS", geography: "India", budget: 50000, currency: "INR" }),
      factors: [],
      missing: [],
      confidence: "Low",
      strength: null,
      sources: [],
      financials: null,
    };

    const campaign = generateMarketingCampaign(minimalOpp, "INR");
    expect(campaign.opportunityName).toBe("Local B2B SaaS");
    expect(campaign.xThread[0].text).toContain("Local B2B SaaS");
    expect(campaign.coldOutreachEmail.body).toContain("Invoicing is manual");
    expect(campaign.xThread[2].text).toContain("Not estimated");
    expect(campaign.coldOutreachEmail.body).not.toContain("Low upfront capital");
  });
});

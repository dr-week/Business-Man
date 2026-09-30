import { describe, expect, it } from "vitest";
import { buildValidationCalendar, generateMarketingCampaign } from "./marketing-automation";
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
    expect(campaign.targetAudience).toContain("Founders evaluating an idea");
    expect(campaign.targetAudience).not.toContain("Utility-scale Solar Farm EPCs");
    expect(campaign.viralHook).toContain("Businessman");
    expect(campaign.viralHook).toContain("research lead, not proof of demand");
    expect(campaign.xThread).toHaveLength(5);
    expect(campaign.xThread[1].text).toContain("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.linkedinPost).toContain("Automated Solar Panel Dry Cleaning Robot");
    expect(campaign.linkedinPost).toContain("Businessman");
    expect(campaign.linkedinPost).toContain("what do you pay for that research");
    expect(campaign.coldOutreachEmail.subject).toContain("business idea before investing");
    expect(campaign.coldOutreachEmail.body).toContain("founders and advisors");
    expect(campaign.productHuntPitch.tagline).toContain("Source-linked market research briefs");
    expect(campaign.weeklyDistributionCadence).toHaveLength(5);
    expect(campaign.weeklyDistributionCadence[1].action).toContain("do not scrape or bulk-message");
    expect(campaign.weeklyDistributionCadence[3].successMeasure).toContain("Actual payment recorded");
    expect(campaign.weeklyDistributionCadence[4].successMeasure).toContain("silence is not positive demand");
    const generatedCopy = [campaign.viralHook, ...campaign.xThread.map((item) => item.text), campaign.linkedinPost, campaign.coldOutreachEmail.body, campaign.productHuntPitch.makerComment].join("\n");
    expect(generatedCopy).toContain("Scenarios are not forecasts");
    expect(generatedCopy).not.toContain("90% of people");
    expect(generatedCopy).not.toContain("3–5 months");
    expect(generatedCopy).not.toContain("vetted");
    expect(campaign.coldOutreachEmail.body).not.toContain("operational savings");
    expect(campaign.weeklyDistributionCadence[3].action).toContain("stated price");
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
    expect(campaign.xThread[1].text).toContain("Local B2B SaaS");
    expect(campaign.coldOutreachEmail.body).toContain("source-linked market signals");
    expect(campaign.xThread[2].text).toContain("Scenarios are not forecasts");
    expect(campaign.coldOutreachEmail.body).not.toContain("Invoicing is manual");
  });

  it("exports a five-day, all-day calendar with escaped text and RFC-sized UTF-8 lines", () => {
    const campaign = {
      ...generateMarketingCampaign(sampleOpportunity),
      opportunityName: "Café, pilot;\nvalidation",
    };
    const calendar = buildValidationCalendar(campaign, new Date(2026, 9, 3));
    const lines = calendar.split("\r\n");

    expect(calendar.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
    expect((calendar.match(/BEGIN:VEVENT/g) ?? [])).toHaveLength(5);
    expect(calendar).toContain("DTSTART;VALUE=DATE:20261003");
    expect(calendar).toContain("DTEND;VALUE=DATE:20261004");
    expect(calendar.replace(/\r\n[ \t]/g, "")).toContain("Café\\, pilot\\;\\nvalidation");
    expect(lines.every((line) => new TextEncoder().encode(line).byteLength <= 75)).toBe(true);
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

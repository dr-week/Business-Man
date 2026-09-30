import { describe, expect, it } from "vitest";
import { evaluateSystem1Heuristics } from "./system1-decision-engine";
import type { ResearchOpportunity } from "./research-engine";

describe("system1-decision-engine", () => {
  it("delivers immediate hard_pass on negative unit contribution margin", () => {
    const opp: ResearchOpportunity = {
      id: "opp-bad-margin",
      name: "Delivery Drone Rental",
      category: "Logistics",
      geography: "India",
      buyer: "Small Cloud Kitchens",
      problem: "Delivery aggregators charge 30%",
      offering: "Battery-powered short haul quadcopters",
      alternatives: ["Zomato / Swiggy fleet"],
      gap: "No autonomous drone under 50k",
      risks: ["DGCA airspace permissions"],
      confidence: "Medium",
      strength: 40,
      financials: {
        contribution: -150, // Selling at a loss
        funding: 500000,
        breakEven: null,
        paybackMonth: null,
        cashFlow: [],
        scenarios: [
          { name: "Low", profit: -50000, units: 10, margin: -10, revenue: 50000, variableCosts: 51500, fixedCosts: 48500 },
          { name: "Base", profit: -30000, units: 30, margin: -5, revenue: 150000, variableCosts: 154500, fixedCosts: 25500 },
          { name: "High", profit: -10000, units: 50, margin: -1, revenue: 250000, variableCosts: 257500, fixedCosts: 2500 },
        ],
      },
      claims: [],
      assumptions: {} as any,
      factors: [],
      missing: [],
      sources: [],
    };

    const evalResult = evaluateSystem1Heuristics(opp);
    expect(evalResult.quickVerdict).toBe("hard_pass");
    expect(evalResult.fatalFlaws).toContain("Negative or zero unit contribution margin (selling at a loss per customer).");
    expect(evalResult.heuristicSummary).toContain("Immediate Pass recommended");
  });

  it("delivers go_fast verdict when margins, payback speed, and niche buyer are aligned", () => {
    const opp: ResearchOpportunity = {
      id: "opp-solar-fast",
      name: "Solar Robot Dry Cleaner",
      category: "CleanTech",
      geography: "India",
      buyer: "Utility-scale EPC Solar Farm Asset Managers",
      problem: "Dust soiling creates 18% power loss in Thar desert",
      offering: "Waterless crawler with IoT telemetry",
      alternatives: ["Manual labour squeegees"],
      gap: "Direct localized manufacturing in Gujarat under ₹1.5L",
      risks: ["Sand abrasions on solar coating"],
      confidence: "High",
      strength: 88,
      financials: {
        contribution: 65000,
        funding: 250000,
        breakEven: 4,
        paybackMonth: 4,
        cashFlow: [],
        scenarios: [
          { name: "Low", profit: 70000, units: 3, margin: 45, revenue: 150000, variableCosts: 40000, fixedCosts: 40000 },
          { name: "Base", profit: 240000, units: 8, margin: 60, revenue: 400000, variableCosts: 80000, fixedCosts: 80000 },
          { name: "High", profit: 450000, units: 15, margin: 70, revenue: 750000, variableCosts: 150000, fixedCosts: 150000 },
        ],
      },
      claims: [],
      assumptions: {} as any,
      factors: [],
      missing: [],
      sources: [],
    };

    const evalResult = evaluateSystem1Heuristics(opp);
    expect(evalResult.quickVerdict).toBe("go_fast");
    expect(evalResult.instantMoats.length).toBeGreaterThanOrEqual(2);
    expect(evalResult.fatalFlaws).toHaveLength(0);
    expect(evalResult.heuristicSummary).toContain("High Momentum signal");
  });
});

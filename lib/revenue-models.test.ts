import { describe, expect, it } from "vitest";
import {
  BUSINESS_ARCHETYPES,
  calculateRevenueModel,
  revenueEngineInput,
  type RevenueEngineInput,
} from "./revenue-models";

describe("revenue models engine", () => {
  it("provides 5 robust business archetypes with benchmarks", () => {
    expect(Object.keys(BUSINESS_ARCHETYPES)).toEqual([
      "saas_b2b",
      "d2c_ecommerce",
      "marketplace",
      "consulting_service",
      "info_product",
    ]);

    const saas = BUSINESS_ARCHETYPES.saas_b2b;
    expect(saas.defaultPrice).toBe(3500);
    expect(saas.unitName).toBe("subscribers");
  });

  it("calculates SaaS B2B economics with payback and profit targets", () => {
    const input: RevenueEngineInput = {
      archetypeId: "saas_b2b",
      price: 4000,
      variableCost: 400, // contribution = 3600
      monthlyUnits: 25, // revenue = 1,00,000
      fixedCost: 46000, // profit = 3600*25 - 46000 = 90000 - 46000 = 44000
      investment: 132000, // payback = 132000 / 44000 = 3.0 months
      paymentTermsDays: 0,
    };

    const result = calculateRevenueModel(input);
    expect(result.monthlyRevenue).toBe(100000);
    expect(result.netMonthlyProfit).toBe(44000);
    expect(result.annualRunRate).toBe(1200000);
    expect(result.netAnnualProfit).toBe(528000);
    expect(result.grossMarginPct).toBe(90);
    expect(result.paybackMonths).toBe(3);
    expect(result.breakEvenUnits).toBe(13); // ceil(46000 / 3600) = 13
    expect(result.workingCapitalLocked).toBe(0);

    // ₹1,00,000 profit milestone: ceil((46000 + 100000)/3600) = ceil(146000/3600) = 41
    expect(result.targetScaleCustomers.for1LakhProfit).toBe(41);
  });

  it("calculates working capital drag for D2C e-commerce with payment cycles", () => {
    const input: RevenueEngineInput = {
      archetypeId: "d2c_ecommerce",
      price: 1500,
      variableCost: 800,
      monthlyUnits: 200, // 3,00,000 revenue
      fixedCost: 60000,
      investment: 300000,
      paymentTermsDays: 45, // 1.5 months revenue locked in inventory/COD
    };

    const result = calculateRevenueModel(input);
    expect(result.monthlyRevenue).toBe(300000);
    expect(result.workingCapitalLocked).toBe(450000); // 300000 * 1.5
    expect(result.stressScenarios).toHaveLength(4);
  });

  it("handles loss-making scenarios by computing investment runway", () => {
    const input: RevenueEngineInput = {
      archetypeId: "saas_b2b",
      price: 2000,
      variableCost: 500,
      monthlyUnits: 10, // contribution: 15000
      fixedCost: 45000, // net profit: -30000
      investment: 150000,
      paymentTermsDays: 0,
    };

    const result = calculateRevenueModel(input);
    expect(result.netMonthlyProfit).toBe(-30000);
    expect(result.paybackMonths).toBeNull();
    // Runway: 150000 / 30000 = 5.0 months
    expect(result.runwayMonthsWithInvestment).toBe(5);
  });

  it("subtracts cash tied up by collection terms before estimating runway", () => {
    const result = calculateRevenueModel({
      archetypeId: "consulting_service",
      price: 10_000,
      variableCost: 2_000,
      monthlyUnits: 2,
      fixedCost: 25_000,
      investment: 100_000,
      paymentTermsDays: 60,
    });

    expect(result.netMonthlyProfit).toBe(-9_000);
    expect(result.workingCapitalLocked).toBe(40_000);
    expect(result.runwayMonthsWithInvestment).toBe(6.7);
  });

  it("reports no funded runway when collection delays consume the investment", () => {
    const result = calculateRevenueModel({
      archetypeId: "consulting_service",
      price: 10_000,
      variableCost: 2_000,
      monthlyUnits: 2,
      fixedCost: 25_000,
      investment: 30_000,
      paymentTermsDays: 60,
    });

    expect(result.workingCapitalLocked).toBe(40_000);
    expect(result.runwayMonthsWithInvestment).toBeNull();
  });

  it("validates input boundaries using Zod schema", () => {
    expect(
      revenueEngineInput.safeParse({
        archetypeId: "saas_b2b",
        price: -10,
        variableCost: 100,
        monthlyUnits: 10,
        fixedCost: 1000,
        investment: 1000,
      }).success
    ).toBe(false);
  });
});

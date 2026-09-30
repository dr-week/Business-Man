import { describe, expect, it } from "vitest";
import {
  DEFAULT_INDIA_REVENUE_CONFIG,
  DEFAULT_GLOBAL_REVENUE_CONFIG,
  calculateRevenueSystem,
  revenueModelInput,
} from "./revenue-system";

describe("revenue system module", () => {
  it("provides valid default India configuration with 4 tiers and positive unit contributions", () => {
    expect(revenueModelInput.safeParse(DEFAULT_INDIA_REVENUE_CONFIG).success).toBe(true);
    expect(DEFAULT_INDIA_REVENUE_CONFIG.tiers).toHaveLength(4);

    const summary = calculateRevenueSystem(DEFAULT_INDIA_REVENUE_CONFIG);
    expect(summary.currency).toBe("INR");
    expect(summary.totalGrossRevenue).toBeGreaterThan(0);
    expect(summary.totalNetRevenue).toBeLessThanOrEqual(summary.totalGrossRevenue);
    expect(summary.totalContribution).toBeGreaterThan(0);
    expect(summary.isProfitable).toBe(true);
    expect(summary.breakEvenMonthlyNetRevenue).not.toBeNull();
  });

  it("calculates refunds, variable costs, and contribution margin accurately", () => {
    const summary = calculateRevenueSystem(DEFAULT_INDIA_REVENUE_CONFIG);
    const briefTier = summary.tierBreakdown.find((t) => t.id === "decision_brief");
    expect(briefTier).toBeDefined();

    // 35 units * 799 = 27965 gross
    expect(briefTier?.grossRevenue).toBe(27965);
    // 3% refund of 27965 = ~839
    expect(briefTier?.refunds).toBe(839);
    // Net: 27965 - 839 = 27126
    expect(briefTier?.netRevenue).toBe(27126);
    // Var cost: 35 * 60 = 2100
    expect(briefTier?.variableCosts).toBe(2100);
    // Contribution: 27126 - 2100 = 25026
    expect(briefTier?.contribution).toBe(25026);
    expect(briefTier?.contributionMarginPercent).toBeCloseTo(92.3, 1);
    expect(briefTier?.breakEvenUnits).toBe(26);
  });

  it("reports no per-offer break-even when refunds and costs consume the price", () => {
    const input = {
      ...DEFAULT_INDIA_REVENUE_CONFIG,
      monthlyFixedCosts: 10_000,
      tiers: [{ ...DEFAULT_INDIA_REVENUE_CONFIG.tiers[1], price: 100, variableCostPerUnit: 95, refundRatePercent: 5 }],
    };
    const summary = calculateRevenueSystem(input);
    expect(summary.tierBreakdown[0].breakEvenUnits).toBeNull();
  });

  it("handles zero sales gracefully without division-by-zero errors", () => {
    const zeroConfig = {
      ...DEFAULT_INDIA_REVENUE_CONFIG,
      tiers: DEFAULT_INDIA_REVENUE_CONFIG.tiers.map((t) => ({ ...t, estimatedMonthlyUnits: 0 })),
    };
    const summary = calculateRevenueSystem(zeroConfig);
    expect(summary.totalGrossRevenue).toBe(0);
    expect(summary.totalNetRevenue).toBe(0);
    expect(summary.totalContribution).toBe(0);
    expect(summary.operatingMarginPercent).toBeNull();
    expect(summary.breakEvenMonthlyNetRevenue).toBeNull();
    expect(summary.isProfitable).toBe(false);
    expect(summary.monthlyOperatingProfit).toBe(-DEFAULT_INDIA_REVENUE_CONFIG.monthlyFixedCosts);
  });

  it("calculates Global USD benchmark correctly", () => {
    expect(revenueModelInput.safeParse(DEFAULT_GLOBAL_REVENUE_CONFIG).success).toBe(true);
    const summary = calculateRevenueSystem(DEFAULT_GLOBAL_REVENUE_CONFIG);
    expect(summary.currency).toBe("USD");
    expect(summary.isProfitable).toBe(true);
    expect(summary.tierBreakdown).toHaveLength(4);
  });
});

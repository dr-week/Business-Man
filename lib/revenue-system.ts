import { z } from "zod";

export const revenueTierId = z.enum(["preview", "decision_brief", "advisor_workspace", "assisted_validation"]);
export type RevenueTierId = z.infer<typeof revenueTierId>;

export type RevenueTier = {
  id: RevenueTierId;
  name: string;
  targetPayer: string;
  offerType: "free" | "one_time" | "monthly_seat" | "scoped_service";
  decisionJob: string;
  currentPaidWorkaround: string;
  offerDescription: string;
  channel: string;
  price: number;
  estimatedMonthlyUnits: number;
  variableCostPerUnit: number;
  refundRatePercent: number;
  evidenceGate: string;
  verificationMetric: string;
};

export type RevenueTierAssumption = {
  id: RevenueTierId;
  name: string;
  targetPayer: string;
  offerType: "free" | "one_time" | "monthly_seat" | "scoped_service";
  decisionJob: string;
  currentPaidWorkaround: string;
  channel: string;
  price: number;
  estimatedMonthlyUnits: number;
  variableCostPerUnit: number;
  refundRatePercent: number;
};

export const revenueModelInput = z.object({
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  monthlyFixedCosts: z.number().finite().min(0).max(10_000_000),
  tiers: z.array(
    z.object({
      id: revenueTierId,
      name: z.string().min(1).max(100),
      targetPayer: z.string().min(1).max(100),
      offerType: z.enum(["free", "one_time", "monthly_seat", "scoped_service"]),
      decisionJob: z.string().min(1).max(200),
      currentPaidWorkaround: z.string().min(1).max(200),
      channel: z.string().min(1).max(100),
      price: z.number().finite().min(0).max(1_000_000),
      estimatedMonthlyUnits: z.number().int().min(0).max(100_000),
      variableCostPerUnit: z.number().finite().min(0).max(100_000),
      refundRatePercent: z.number().finite().min(0).max(100),
    })
  ).min(1).max(10),
});

export type RevenueModelInput = z.infer<typeof revenueModelInput>;

export type RevenueTierSummary = {
  id: RevenueTierId;
  name: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  variableCosts: number;
  contribution: number;
  contributionMarginPercent: number | null;
};

export type RevenueModelSummary = {
  currency: string;
  totalGrossRevenue: number;
  totalRefunds: number;
  totalNetRevenue: number;
  totalVariableCosts: number;
  totalContribution: number;
  monthlyFixedCosts: number;
  monthlyOperatingProfit: number;
  operatingMarginPercent: number | null;
  breakEvenMonthlyNetRevenue: number | null;
  isProfitable: boolean;
  tierBreakdown: RevenueTierSummary[];
};

export const DEFAULT_INDIA_REVENUE_CONFIG: RevenueModelInput = {
  currency: "INR",
  monthlyFixedCosts: 18000, // Cloudflare, D1, domain, and tooling maintenance
  tiers: [
    {
      id: "preview",
      name: "Free Sourced Preview",
      targetPayer: "solo_founder",
      offerType: "free",
      decisionJob: "Screen initial problem validity and check if sources exist before committing time",
      currentPaidWorkaround: "Manual Reddit/HN search or unvalidated generic chatbots",
      channel: "organic_search_community",
      price: 0,
      estimatedMonthlyUnits: 250,
      variableCostPerUnit: 2, // Minimal transient search/edge compute
      refundRatePercent: 0,
    },
    {
      id: "decision_brief",
      name: "Evidence Decision Brief",
      targetPayer: "solo_founder",
      offerType: "one_time",
      decisionJob: "Validate unit economics, local competitors, and buyer willingness-to-pay before build",
      currentPaidWorkaround: "Consulting desk research (₹10,000+) or superficial AI scorecards (₹159–₹2,999)",
      channel: "self_serve_checkout",
      price: 799,
      estimatedMonthlyUnits: 35,
      variableCostPerUnit: 60, // Scraper/enrichment API costs + payment processing fee
      refundRatePercent: 3,
    },
    {
      id: "advisor_workspace",
      name: "Advisor & Incubator Seat",
      targetPayer: "incubator_advisor",
      offerType: "monthly_seat",
      decisionJob: "Screen and compare 10–50 cohort venture proposals with verifiable claims",
      currentPaidWorkaround: "Incubator management software (₹4,999–₹24,999/mo) with manual review",
      channel: "direct_outreach",
      price: 4999,
      estimatedMonthlyUnits: 3,
      variableCostPerUnit: 150,
      refundRatePercent: 0,
    },
    {
      id: "assisted_validation",
      name: "Assisted Field Validation",
      targetPayer: "funded_venture",
      offerType: "scoped_service",
      decisionJob: "Confirm enterprise buyer willingness-to-pay via customer interviews and vendor audits",
      currentPaidWorkaround: "Traditional research agencies (₹50,000–₹2,00,000+)",
      channel: "bespoke_consultation",
      price: 24999,
      estimatedMonthlyUnits: 1,
      variableCostPerUnit: 4000,
      refundRatePercent: 0,
    },
  ],
};

export const DEFAULT_GLOBAL_REVENUE_CONFIG: RevenueModelInput = {
  currency: "USD",
  monthlyFixedCosts: 250,
  tiers: [
    {
      id: "preview",
      name: "Free Sourced Preview",
      targetPayer: "solo_founder",
      offerType: "free",
      decisionJob: "Screen initial problem validity and check if sources exist",
      currentPaidWorkaround: "Manual search or unvalidated generic chatbots",
      channel: "organic_search_community",
      price: 0,
      estimatedMonthlyUnits: 300,
      variableCostPerUnit: 0.05,
      refundRatePercent: 0,
    },
    {
      id: "decision_brief",
      name: "Evidence Decision Brief",
      targetPayer: "solo_founder",
      offerType: "one_time",
      decisionJob: "Validate unit economics, competitors, and buyer willingness-to-pay",
      currentPaidWorkaround: "Consulting desk research ($500+) or superficial AI scorecards ($19–$99)",
      channel: "self_serve_checkout",
      price: 19,
      estimatedMonthlyUnits: 40,
      variableCostPerUnit: 1.5,
      refundRatePercent: 3,
    },
    {
      id: "advisor_workspace",
      name: "Advisor & Incubator Seat",
      targetPayer: "incubator_advisor",
      offerType: "monthly_seat",
      decisionJob: "Screen and compare cohort venture proposals with verifiable claims",
      currentPaidWorkaround: "Accelerator tools ($199+/mo) with manual review",
      channel: "direct_outreach",
      price: 99,
      estimatedMonthlyUnits: 4,
      variableCostPerUnit: 4,
      refundRatePercent: 0,
    },
    {
      id: "assisted_validation",
      name: "Assisted Field Validation",
      targetPayer: "funded_venture",
      offerType: "scoped_service",
      decisionJob: "Confirm enterprise buyer willingness-to-pay via customer interviews",
      currentPaidWorkaround: "Market research agencies ($2,500–$10,000)",
      channel: "bespoke_consultation",
      price: 499,
      estimatedMonthlyUnits: 1,
      variableCostPerUnit: 80,
      refundRatePercent: 0,
    },
  ],
};

export function calculateRevenueSystem(input: RevenueModelInput): RevenueModelSummary {
  let totalGrossRevenue = 0;
  let totalRefunds = 0;
  let totalNetRevenue = 0;
  let totalVariableCosts = 0;
  let totalContribution = 0;

  const tierBreakdown: RevenueTierSummary[] = input.tiers.map((tier) => {
    const grossRevenue = tier.price * tier.estimatedMonthlyUnits;
    const refunds = (grossRevenue * tier.refundRatePercent) / 100;
    const netRevenue = grossRevenue - refunds;
    const variableCosts = tier.variableCostPerUnit * tier.estimatedMonthlyUnits;
    const contribution = netRevenue - variableCosts;
    const contributionMarginPercent =
      netRevenue > 0 ? (contribution / netRevenue) * 100 : null;

    totalGrossRevenue += grossRevenue;
    totalRefunds += refunds;
    totalNetRevenue += netRevenue;
    totalVariableCosts += variableCosts;
    totalContribution += contribution;

    return {
      id: tier.id,
      name: tier.name,
      grossRevenue: Math.round(grossRevenue),
      refunds: Math.round(refunds),
      netRevenue: Math.round(netRevenue),
      variableCosts: Math.round(variableCosts),
      contribution: Math.round(contribution),
      contributionMarginPercent:
        contributionMarginPercent != null
          ? Math.round(contributionMarginPercent * 10) / 10
          : null,
    };
  });

  const monthlyOperatingProfit = totalContribution - input.monthlyFixedCosts;
  const operatingMarginPercent =
    totalNetRevenue > 0
      ? Math.round((monthlyOperatingProfit / totalNetRevenue) * 1000) / 10
      : null;

  // Break-even revenue needed at current contribution margin
  const overallContributionMarginRatio =
    totalNetRevenue > 0 ? totalContribution / totalNetRevenue : 0;
  const breakEvenMonthlyNetRevenue =
    overallContributionMarginRatio > 0
      ? Math.ceil(input.monthlyFixedCosts / overallContributionMarginRatio)
      : null;

  return {
    currency: input.currency,
    totalGrossRevenue: Math.round(totalGrossRevenue),
    totalRefunds: Math.round(totalRefunds),
    totalNetRevenue: Math.round(totalNetRevenue),
    totalVariableCosts: Math.round(totalVariableCosts),
    totalContribution: Math.round(totalContribution),
    monthlyFixedCosts: Math.round(input.monthlyFixedCosts),
    monthlyOperatingProfit: Math.round(monthlyOperatingProfit),
    operatingMarginPercent,
    breakEvenMonthlyNetRevenue,
    isProfitable: monthlyOperatingProfit >= 0,
    tierBreakdown,
  };
}

import { z } from "zod";

export type ArchetypeId = "saas_b2b" | "d2c_ecommerce" | "marketplace" | "consulting_service" | "info_product";

export interface ArchetypeBenchmark {
  id: ArchetypeId;
  name: string;
  description: string;
  defaultPrice: number;
  defaultVariableCost: number;
  defaultFixedCost: number;
  defaultUnits: number;
  defaultInvestment: number;
  grossMarginRange: string;
  typicalChurnMonthly: number; // percentage, e.g. 3 = 3%
  workingCapitalCycleDays: number;
  unitName: string;
  priceModelName: string;
}

export const BUSINESS_ARCHETYPES: Record<ArchetypeId, ArchetypeBenchmark> = {
  saas_b2b: {
    id: "saas_b2b",
    name: "B2B SaaS / Micro-SaaS",
    description: "Subscription software solving specific workflow / compliance problems in India or globally.",
    defaultPrice: 3500, // ₹3,500/mo per seat/org
    defaultVariableCost: 350, // 10% hosting, payment gateway, support
    defaultFixedCost: 45000, // Tools, infra, legal, base salary
    defaultUnits: 30, // 30 active paying customers
    defaultInvestment: 80000,
    grossMarginRange: "80% - 90%",
    typicalChurnMonthly: 4.5,
    workingCapitalCycleDays: 0, // Advance collection
    unitName: "subscribers",
    priceModelName: "Monthly Subscription",
  },
  d2c_ecommerce: {
    id: "d2c_ecommerce",
    name: "D2C / Physical Niche Brand",
    description: "Specialized direct-to-consumer goods or hardware products with brand differentiation.",
    defaultPrice: 1200, // ₹1,200 per order
    defaultVariableCost: 650, // 54% COGS + courier + packaging
    defaultFixedCost: 55000, // Storage, ads base, shopify, ops
    defaultUnits: 250, // 250 orders/month
    defaultInvestment: 350000, // Initial inventory + shoot + packaging
    grossMarginRange: "40% - 55%",
    typicalChurnMonthly: 25.0, // Non-repeat rate
    workingCapitalCycleDays: 45, // Stock holding + transit + COD cycle
    unitName: "orders",
    priceModelName: "Per Unit Sold",
  },
  marketplace: {
    id: "marketplace",
    name: "Commission / Marketplace / Protocol Adapter",
    description: "Connecting buyers to specialized sellers, charging take-rate commission per trade/booking.",
    defaultPrice: 250, // Commission per transaction (e.g. 10% on ₹2,500 GMV)
    defaultVariableCost: 35, // Payment gateway + cloud verification
    defaultFixedCost: 40000,
    defaultUnits: 500, // 500 transactions/month
    defaultInvestment: 120000,
    grossMarginRange: "75% - 85%",
    typicalChurnMonthly: 10.0,
    workingCapitalCycleDays: 15,
    unitName: "transactions",
    priceModelName: "Take-rate / Commission",
  },
  consulting_service: {
    id: "consulting_service",
    name: "High-Ticket Productized Service",
    description: "Fixed-scope auditing, implementation, or setup consulting (e.g., GST agent adapters, security audits).",
    defaultPrice: 45000, // ₹45,000 per retainer or audit
    defaultVariableCost: 5000, // Subcontracting / tools / research pass-through
    defaultFixedCost: 35000, // Base ops, software, insurance
    defaultUnits: 3, // 3 enterprise clients
    defaultInvestment: 50000,
    grossMarginRange: "70% - 88%",
    typicalChurnMonthly: 15.0,
    workingCapitalCycleDays: 30, // Net 30 invoices
    unitName: "client retainers",
    priceModelName: "Fixed Scope / Retainer",
  },
  info_product: {
    id: "info_product",
    name: "Proprietary Data / Intel Reports",
    description: "High-value quarterly industry intelligence, curated databases, or vendor comparison reports.",
    defaultPrice: 15000, // ₹15,000 per report / annual research desk
    defaultVariableCost: 800, // Server delivery & download bandwidth
    defaultFixedCost: 20000,
    defaultUnits: 8,
    defaultInvestment: 30000,
    grossMarginRange: "90% - 95%",
    typicalChurnMonthly: 8.0,
    workingCapitalCycleDays: 0,
    unitName: "report purchases",
    priceModelName: "Annual / One-off License",
  },
};

export const revenueEngineInput = z.object({
  archetypeId: z.enum(["saas_b2b", "d2c_ecommerce", "marketplace", "consulting_service", "info_product"]),
  price: z.number().finite().min(0).max(10_000_000),
  variableCost: z.number().finite().min(0).max(10_000_000),
  monthlyUnits: z.number().int().min(0).max(1_000_000),
  fixedCost: z.number().finite().min(0).max(10_000_000),
  investment: z.number().finite().min(0).max(50_000_000),
  paymentTermsDays: z.number().int().min(0).max(180).default(0), // Working capital drag
});

export type RevenueEngineInput = z.infer<typeof revenueEngineInput>;

export interface RevenueEngineResult {
  monthlyRevenue: number;
  annualRunRate: number;
  grossMarginPct: number;
  netMonthlyProfit: number;
  netAnnualProfit: number;
  breakEvenUnits: number | null;
  paybackMonths: number | null;
  workingCapitalLocked: number;
  runwayMonthsWithInvestment: number | null;
  targetScaleCustomers: {
    for1LakhProfit: number | null; // Units needed for ₹1,00,000/mo net profit
    for5LakhProfit: number | null; // Units needed for ₹5,00,000/mo net profit
  };
  stressScenarios: {
    label: string;
    monthlyProfit: number;
    description: string;
  }[];
}

export function calculateRevenueModel(input: RevenueEngineInput): RevenueEngineResult {
  const { price, variableCost, monthlyUnits, fixedCost, investment, paymentTermsDays } = input;
  const contribution = price - variableCost;
  const monthlyRevenue = price * monthlyUnits;
  const annualRunRate = monthlyRevenue * 12;
  const netMonthlyProfit = contribution * monthlyUnits - fixedCost;
  const netAnnualProfit = netMonthlyProfit * 12;
  const grossMarginPct = monthlyRevenue > 0 ? (contribution / price) * 100 : 0;
  
  const breakEvenUnits = contribution > 0 ? Math.ceil(fixedCost / contribution) : null;
  const paybackMonths = netMonthlyProfit > 0 && investment > 0 ? Number((investment / netMonthlyProfit).toFixed(1)) : null;

  // Working capital locked: if payment terms > 0 days, (Revenue * (Days / 30)) cash is uncollected
  const workingCapitalLocked = paymentTermsDays > 0 ? Math.round(monthlyRevenue * (paymentTermsDays / 30)) : 0;

  // Runway months if business is currently loss-making:
  const availableOperatingCash = Math.max(0, investment - workingCapitalLocked);
  const runwayMonthsWithInvestment = netMonthlyProfit < 0 && availableOperatingCash > 0
    ? Number((availableOperatingCash / Math.abs(netMonthlyProfit)).toFixed(1))
    : null;

  // Milestone targets
  const for1LakhProfit = contribution > 0 ? Math.ceil((fixedCost + 100_000) / contribution) : null;
  const for5LakhProfit = contribution > 0 ? Math.ceil((fixedCost + 500_000) / contribution) : null;

  // Stress tests (e.g. 20% price drop or 30% unit drop)
  const stressScenarios = [
    {
      label: "Base Case",
      monthlyProfit: netMonthlyProfit,
      description: `Current inputs with ${monthlyUnits} ${BUSINESS_ARCHETYPES[input.archetypeId].unitName}`,
    },
    {
      label: "Price Squeeze (-15%)",
      monthlyProfit: (price * 0.85 - variableCost) * monthlyUnits - fixedCost,
      description: "Competitor discounting or platform fees force a 15% price cut",
    },
    {
      label: "Demand Slump (-30% sales)",
      monthlyProfit: contribution * Math.floor(monthlyUnits * 0.7) - fixedCost,
      description: "Slow acquisition period or season low",
    },
    {
      label: "High Growth (2x sales)",
      monthlyProfit: contribution * (monthlyUnits * 2) - fixedCost,
      description: "Target scale milestone reached",
    },
  ];

  return {
    monthlyRevenue,
    annualRunRate,
    grossMarginPct,
    netMonthlyProfit,
    netAnnualProfit,
    breakEvenUnits,
    paybackMonths,
    workingCapitalLocked,
    runwayMonthsWithInvestment,
    targetScaleCustomers: {
      for1LakhProfit,
      for5LakhProfit,
    },
    stressScenarios,
  };
}

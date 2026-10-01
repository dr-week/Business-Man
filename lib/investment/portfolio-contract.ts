import { z } from "zod";

const supportedCurrencyCodes = new Set(Intl.supportedValuesOf("currency"));

export const portfolioImportInput = z.object({
  csv: z.string().min(1).max(500_000),
  currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter currency code.")
    .refine((value) => supportedCurrencyCodes.has(value), "Use a recognized ISO 4217 currency code."),
  valuedAt: z.string().refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a real date in YYYY-MM-DD format."),
  sourceName: z.string().trim().min(1).max(120),
  sourceUrl: z.string().url().max(2_048).refine((value) => ["http:", "https:"].includes(new URL(value).protocol)).optional(),
}).strict();

export const portfolioSummarySchema = z.object({
  currency: z.string(),
  valuedAt: z.string(),
  source: z.object({ name: z.string(), url: z.string().nullable() }),
  verification: z.literal("user_provided_unverified"),
  positionCount: z.number().int().nonnegative(),
  costBasis: z.number().finite(),
  marketValue: z.number().finite(),
  unrealizedGain: z.number().finite(),
  returnPercent: z.number().finite().nullable(),
  sectorSummary: z.array(z.object({
    sector: z.string(),
    positions: z.number().int().nonnegative(),
    costBasis: z.number().finite(),
    marketValue: z.number().finite(),
    unrealizedGain: z.number().finite(),
    returnPercent: z.number().finite().nullable(),
  })),
  caveat: z.string(),
});

export type PortfolioImportInput = z.infer<typeof portfolioImportInput>;
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;

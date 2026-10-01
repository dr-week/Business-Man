import Papa from "papaparse";
import { z } from "zod";
import { type PortfolioImportInput } from "./portfolio-contract";

const MAX_POSITIONS = 1_000;
const requiredColumns = ["sector", "security", "purchase_price", "current_price", "quantity"] as const;

const positionSchema = z.object({
  sector: z.string().trim().min(1).max(100),
  security: z.string().trim().min(1).max(160),
  purchase_price: z.number().finite().nonnegative().max(1_000_000),
  current_price: z.number().finite().nonnegative().max(1_000_000),
  quantity: z.number().finite().positive().max(1_000_000),
});

export function analyzePortfolioCsv(input: PortfolioImportInput) {
  const { data, errors, meta } = Papa.parse<Record<string, unknown>>(input.csv, {
    header: true,
    comments: "//",
    dynamicTyping: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length) throw new Error("CSV is malformed; correct its rows and try again.");
  const fields = new Set(meta.fields ?? []);
  if (requiredColumns.some((column) => !fields.has(column))) {
    throw new Error(`CSV must include: ${requiredColumns.join(", ")}.`);
  }
  if (data.length === 0 || data.length > MAX_POSITIONS) {
    throw new Error(`CSV must contain 1 to ${MAX_POSITIONS} positions.`);
  }

  const parsed = z.array(positionSchema).safeParse(data);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path.at(-1) ?? "row")))];
    throw new Error(`Check these portfolio columns: ${fields.join(", ")}.`);
  }

  const sectors = new Map<string, { positions: number; costBasis: number; marketValue: number }>();
  for (const position of parsed.data) {
    const sector = sectors.get(position.sector) ?? { positions: 0, costBasis: 0, marketValue: 0 };
    sector.positions += 1;
    sector.costBasis += position.purchase_price * position.quantity;
    sector.marketValue += position.current_price * position.quantity;
    sectors.set(position.sector, sector);
  }

  const sectorSummary = [...sectors.entries()].map(([sector, values]) => {
    const unrealizedGain = values.marketValue - values.costBasis;
    return {
      sector,
      ...values,
      unrealizedGain,
      returnPercent: values.costBasis ? unrealizedGain / values.costBasis * 100 : null,
    };
  }).sort((a, b) => b.marketValue - a.marketValue);

  const costBasis = sectorSummary.reduce((total, sector) => total + sector.costBasis, 0);
  const marketValue = sectorSummary.reduce((total, sector) => total + sector.marketValue, 0);
  const unrealizedGain = marketValue - costBasis;

  return {
    currency: input.currency,
    valuedAt: input.valuedAt,
    source: { name: input.sourceName, url: input.sourceUrl ?? null },
    verification: "user_provided_unverified" as const,
    positionCount: parsed.data.length,
    costBasis,
    marketValue,
    unrealizedGain,
    returnPercent: costBasis ? unrealizedGain / costBasis * 100 : null,
    sectorSummary,
    caveat: "Prices and source details are user-provided and unverified. Calculations exclude fees, taxes, dividends, and currency conversion.",
  };
}

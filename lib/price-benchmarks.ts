import type { SourceSignal } from "./discovery";
import type { FinancialAssumptions } from "./research-engine";

export type PriceBenchmark = { sourceId: string; sourceUrl: string; product: string; price: number; currency: string; quote: string; collectedAt: string };

/** Keep only single, explicit advertised amounts. Ranges and starting prices need manual review. */
export function priceBenchmarks(sources: SourceSignal[], currency: string): PriceBenchmark[] {
  return sources.flatMap((source) => (source.facts?.products ?? []).flatMap((product) => {
    if (product.currency.toUpperCase() !== currency || /\b(?:from|starting|between|up to|approx|estimate)\b|[-–]\s*[\d₹$€£]/i.test(product.price)) return [];
    const amounts = product.price.match(/\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
    if (amounts.length !== 1) return [];
    const price = Number(amounts[0].replaceAll(",", ""));
    if (!Number.isFinite(price) || price <= 0 || !source.retrievedAt) return [];
    return [{ sourceId: source.id, sourceUrl: source.url, product: product.name, price, currency, quote: product.price, collectedAt: source.retrievedAt }];
  }));
}

export function estimatePriceFromBenchmark(assumptions: FinancialAssumptions, benchmark: PriceBenchmark): FinancialAssumptions {
  return { ...assumptions, price: {
    ...assumptions.price, value: benchmark.price, provenance: "Estimated", sourceIds: [benchmark.sourceId],
    date: benchmark.collectedAt.slice(0, 10), geography: "Source location unverified",
    note: `Advertised ${benchmark.product} price (${benchmark.quote}); collected ${benchmark.collectedAt.slice(0, 10)}. Check unit and local fit before relying on it.`,
  } };
}

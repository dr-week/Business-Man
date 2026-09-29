import { describe, expect, it } from "vitest";
import { estimatePriceFromBenchmark, priceBenchmarks } from "./price-benchmarks";
import { blankFinancials, researchInput } from "./research-engine";
import type { SourceSignal } from "./discovery";

const source: SourceSignal = {
  id: "vendor-1", provider: "Web page", title: "Price list", excerpt: "Services", url: "https://example.com/prices",
  publishedAt: "2026-09-01", retrievedAt: "2026-09-29T00:00:00Z", comments: 0,
  facts: { tables: [], products: [
    { name: "Basic", price: "₹1,499 / month", currency: "INR" },
    { name: "Range", price: "₹1,000–2,000", currency: "INR" },
    { name: "US", price: "$20", currency: "USD" },
  ] },
};

describe("price benchmarks", () => {
  it("keeps only a comparable single amount", () => {
    expect(priceBenchmarks([source], "INR")).toMatchObject([{ price: 1499, sourceId: "vendor-1" }]);
  });
  it("labels a competitor quote as estimated selling price with provenance", () => {
    const assumptions = blankFinancials(researchInput.parse({ topic: "service", geography: "Goa, India", budget: null }));
    const price = estimatePriceFromBenchmark(assumptions, priceBenchmarks([source], "INR")[0]).price;
    expect(price).toMatchObject({ value: 1499, provenance: "Estimated", sourceIds: ["vendor-1"], date: "2026-09-29", geography: "Source location unverified" });
    expect(assumptions.price.value).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { correctQuery } from "./query-spelling";
import { prepareResearchQuery } from "./research-query";

const cases = [
  ["moblie repar", "mobile repair"], ["comercial laundary", "commercial laundry"],
  ["soler panel instalation", "solar panel installation"], ["pet groomng", "pet grooming"],
  ["cold storag warehosue", "cold storage warehouse"], ["packging materal", "packaging material"],
  ["weldng equpment", "welding equipment"], ["bakry", "bakery"],
  ["resturant invetory", "restaurant inventory"], ["recyling", "recycling"],
  ["tailroing", "tailoring"], ["furntiure", "furniture"], ["texitle", "textile"],
  ["trasnport", "transport"], ["tourisim", "tourism"], ["rentel", "rental"],
  ["agricuture", "agriculture"], ["clinci", "clinic"], ["pharmcy", "pharmacy"],
  ["distrbution", "distribution"],
] as const;
const constraints = ["under INR 20000", "without burning", "in Mapusa", "500 kg per week", "no franchise", "2 workers", "budget 0", "500 sq ft", "near Pune", "excluding imports"];
describe("typo and constraint matrix", () => {
  it.each(cases.flatMap(([typo, corrected]) => constraints.map((constraint) => [typo, corrected, constraint])))("%s preserves %s / %s", (typo, corrected, constraint) => {
    const query = prepareResearchQuery(`${typo} ${constraint}`);
    expect(query.corrected).toBe(`${corrected} ${constraint}`);
    expect(query.searchTerms).toContain(constraint);
  });
  it.each(["used CAT machines", "shop in Mapusa", "Goa India", "flower mill", "3D printer", "business in soler", "café supplies", "मशीन व्यवसाय", "custom XQZ300 parts"])("does not silently change %s", (input) => {
    expect(correctQuery(input).corrected).toBe(input);
  });
  it("suggests ambiguous valid words without replacing them", () => {
    expect(correctQuery("flower mill").suggestions[0].options).toContain("flour mill");
  });
  it("protects profile location names", () => {
    expect(correctQuery("soler business", ["soler"]).corrected).toBe("soler business");
  });
  it("original mode bypasses correction and query rewriting", () => {
    const original = "I have an emty garaj";
    expect(prepareResearchQuery(original, { original: true }).searchTerms).toBe(original);
  });
  it("extracts constraints without dropping them from the query", () => {
    const query = prepareResearchQuery("500 kg sawdst in Pune under INR 20000 without burning");
    expect(query.constraints.quantities).toEqual(["500 kg"]);
    expect(query.constraints.budgets).toContain("INR 20000");
    expect(query.constraints.exclusions).toEqual(["without burning"]);
  });
});

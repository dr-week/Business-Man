import { describe, expect, it } from "vitest";
import { calculateEconomics, economicsInput, emptyEconomics } from "./economics";

const sample = { price: 1000, variableCost: 400, monthlyUnits: 100, fixedCost: 20000, investment: 200000, basis: "Test assumptions" };
describe("opportunity economics", () => {
  it("calculates contribution, returns and rounded break-even from assumptions", () => {
    expect(calculateEconomics(sample)).toMatchObject({ revenue: 100000, profit: 40000, margin: 40, breakEven: 34, payback: 5 });
    expect(calculateEconomics(sample)?.scenarios.map((item) => item.profit)).toEqual([10000, 40000, 70000]);
  });
  it("keeps missing data unknown instead of treating it as zero", () => {
    expect(calculateEconomics(emptyEconomics)).toBeNull();
    expect(calculateEconomics({ ...sample, investment: null })).toBeNull();
  });
  it("does not claim a reachable break-even or payback at negative contribution", () => {
    expect(calculateEconomics({ ...sample, variableCost: 1200 })).toMatchObject({ profit: -40000, breakEven: null, payback: null });
  });
  it("handles zero sales and zero investment without division errors", () => {
    expect(calculateEconomics({ ...sample, monthlyUnits: 0 })).toMatchObject({ revenue: 0, margin: null, profit: -20000, payback: null });
    expect(calculateEconomics({ ...sample, investment: 0 })?.payback).toBe(0);
  });
  it("rejects invalid API assumptions", () => {
    for (const invalid of [{ price: -1 }, { price: Infinity }, { monthlyUnits: 1.5 }, { investment: "100" }, { fixedCost: 1e20 }]) {
      expect(economicsInput.safeParse({ ...sample, ...invalid }).success).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { investmentRisks } from "./investment-risks";

const soundCase = {
  funding: 100_000,
  contribution: 600,
  scenarios: [{ name: "Low", profit: 2_000 }],
};

describe("investment risk flags", () => {
  it("keeps missing economics explicit", () => {
    expect(investmentRisks(null, 150_000, "INR")).toEqual(["Costs and sales volume unknown"]);
  });

  it("flags unknown budget fit without inferring an overrun", () => {
    expect(investmentRisks(soundCase, null, "INR")).toEqual(["Budget fit unknown"]);
  });

  it("reports only explicit budget, contribution, and low-case risks", () => {
    expect(investmentRisks({
      ...soundCase,
      funding: 180_000,
      contribution: 0,
      scenarios: [{ name: "Low", profit: -5_000 }],
    }, 150_000, "INR")).toEqual([
      "Funding exceeds budget by ₹30,000",
      "Variable cost meets or exceeds price",
      "Low-sales scenario loses ₹5,000 / month",
    ]);
  });

  it("does not emit flags for a fitting budget and positive low-case profit", () => {
    expect(investmentRisks(soundCase, 100_000, "INR")).toEqual([]);
  });

  it("does not treat break-even low-case profit as a loss", () => {
    expect(investmentRisks({ ...soundCase, scenarios: [{ name: "Low", profit: 0 }] }, 100_000, "INR")).toEqual([]);
  });
});

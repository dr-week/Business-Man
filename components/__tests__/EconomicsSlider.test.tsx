import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EconomicsSlider from "../EconomicsSlider";
import { calculateEconomics } from "../../lib/economics";

describe("EconomicsSlider", () => {
  it("renders its empty state", () => {
    const html = renderToStaticMarkup(<EconomicsSlider />);
    expect(html).toContain("Economic Scenario Builder");
    expect(html).toContain("Enter all values to see calculations.");
  });

  it("calculates revenue and profit from entered unit economics", () => {
    const result = calculateEconomics({
      price: 5000,
      variableCost: 2000,
      monthlyUnits: 100,
      fixedCost: 20000,
      investment: 100000,
      basis: "User estimate",
    });
    expect(result?.revenue).toBe(500000);
    expect(result?.profit).toBe(280000);
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EconomicsSlider from "./EconomicsSlider";
import { calculateEconomics } from "../lib/economics";

describe("EconomicsSlider", () => {
  it("renders its empty state with scoped controls", () => {
    const html = renderToStaticMarkup(createElement(EconomicsSlider));
    expect(html).toContain("Economic Scenario Builder");
    expect(html).toContain("Enter all values to see calculations.");
    expect(html.match(/type="range"/g)).toHaveLength(3);
    expect(html).toMatch(/class="[^"]*_slider_[^"]*"/);
  });

  it("calculates revenue and profit from unit economics", () => {
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

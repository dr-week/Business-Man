import { describe, expect, it } from "vitest";
import { prepareResearchQuery } from "./research-query";

describe("search sentence preparation", () => {
  it.each([
    ["protein powder manufacturing business", "manufacturing", "protein powder"],
    ["car manufacturing business", "manufacturing", "car"],
    ["car related business", "explore", "car"],
    ["metal sheet business", "explore", "metal sheet"],
    ["fabrication business", "manufacturing", "fabrication"],
    ["trekking business", "service", "trekking"],
    ["I have a lot of coconut shells what can I do with it", "asset", "coconut shells"],
    ["I have a lot of banana leaves what can I do with it business", "asset", "banana leaves"],
    ["I have a 3D printer how can I solve this problem start a manufacturing", "asset", "3d printer"],
  ])("prepares %s", (question, intent, term) => {
    const result = prepareResearchQuery(question);
    expect(result.intent).toBe(intent);
    expect(result.searchTerms.toLowerCase()).toContain(term);
    expect(result.original).toBe(question);
    expect(result.brief).toContain(question);
  });
  it("retains quantities, location, budget, and exclusions", () => {
    const question = "I have 500 kg coconut shells in Goa under INR 20000 without burning";
    const result = prepareResearchQuery(question);
    for (const detail of ["500 kg", "Goa", "INR 20000", "without burning"]) expect(result.searchTerms).toContain(detail);
  });
  it("keeps unfamiliar input without guessing an industry", () => {
    expect(prepareResearchQuery("custom xyz process").searchTerms).toBe("custom xyz process");
  });
});

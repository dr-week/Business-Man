import { expect, test } from "vitest";
import { evaluateSystem1Heuristics, type System1OpportunityInput } from "./system1-decision-engine";

const opportunity: System1OpportunityInput = {
  id: "local-buyer-workflow",
  buyer: "Independent pharmacies in Goa",
  gap: "Manual replenishment tracking across local distributors",
  financials: { contribution: 280, paybackMonth: 10, scenarios: [{ margin: 18 }, { margin: 24 }, { margin: 31 }] },
  claims: [{ direction: "supports", factor: "Problem frequency", sourceIds: ["source-1"] }],
  sources: [{ id: "source-1" }],
};

test("System 1 opportunity-detail render path", async ({ bench }) => {
  const results = await bench.compare(
    bench("before: badge + panel + nested badge", () => {
      let verdict = "";
      for (let index = 0; index < 3; index += 1) verdict = evaluateSystem1Heuristics(opportunity).quickVerdict;
      return verdict;
    }),
    bench("after: shared evaluation", () => {
      return evaluateSystem1Heuristics(opportunity).quickVerdict;
    }),
  );
  const previous = results.get("before: badge + panel + nested badge");
  const shared = results.get("after: shared evaluation");
  expect(previous).toBeDefined();
  expect(shared).toBeFasterThan(previous!, { delta: 0.1 });
});

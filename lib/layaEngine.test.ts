import { describe, expect, it } from "vitest";
import { blankFinancials, researchInput, type ResearchOpportunity } from "./research-engine";
import { runDecisionEngine } from "./layaEngine";

function opportunity(buyer: string): ResearchOpportunity {
  const input = researchInput.parse({ topic: "Local delivery", geography: "Pune, India", currency: "INR", budget: null });
  return {
    id: "cache-refresh-test", name: "Local delivery", category: "Services", geography: input.geography,
    buyer, problem: "Late delivery", offering: null, alternatives: [], gap: null, risks: [],
    claims: [], sources: [], assumptions: blankFinancials(input), factors: [], strength: null,
    confidence: "Low", financials: null, missing: [],
  };
}

describe("decision evaluation cache", () => {
  it("re-evaluates when evidence inputs change for the same opportunity id", async () => {
    const first = await runDecisionEngine(opportunity("Everyone"));
    const updated = await runDecisionEngine(opportunity("Independent pharmacies in Pune"));

    expect(first.fatalFlaws).toContain("Vague or missing target buyer persona.");
    expect(updated.fatalFlaws).not.toContain("Vague or missing target buyer persona.");
  });
});

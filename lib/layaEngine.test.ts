import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { blankFinancials, researchInput, type ResearchOpportunity } from "./research-engine";
import { runDecisionEngine } from "./layaEngine";

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

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
  it("keeps the core decision path free of the multi-gigabyte local Laya runtime", async () => {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    expect(dependencies).not.toHaveProperty("@receptron/laya");
    expect(dependencies).not.toHaveProperty("onnxruntime-node");

    const result = await runDecisionEngine(opportunity("Independent pharmacies in Pune"));
    expect(result.quickVerdict).toBe("pause_investigate");
    expect(result.missingEvidence).toContain("Traceable sources");
  });

  it("re-evaluates when evidence inputs change for the same opportunity id", async () => {
    const first = await runDecisionEngine(opportunity("Everyone"));
    const updated = await runDecisionEngine(opportunity("Independent pharmacies in Pune"));

    expect(first.fatalFlaws).toContain("Vague or missing target buyer persona.");
    expect(updated.fatalFlaws).not.toContain("Vague or missing target buyer persona.");
  });
});

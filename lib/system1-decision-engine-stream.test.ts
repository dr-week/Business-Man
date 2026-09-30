import { describe, expect, it } from "vitest";
import { blankFinancials, researchInput, type ResearchOpportunity } from "./research-engine";
import { evaluateSystem1Heuristics } from "./system1-decision-engine";
import { evaluateSystem1HeuristicsStreaming } from "./system1-decision-engine-stream";

function opportunity(): ResearchOpportunity {
  const input = researchInput.parse({ topic: "local inventory", geography: "India", budget: null });
  return {
    id: "stream-adapter-test",
    name: input.topic,
    category: "Retail",
    geography: input.geography,
    buyer: "Independent retailers",
    problem: "Stockouts are hard to track",
    offering: null,
    alternatives: [],
    gap: null,
    risks: [],
    sources: [],
    claims: [],
    assumptions: blankFinancials(input),
    factors: [],
    strength: null,
    confidence: "Low",
    financials: null,
    missing: [],
  };
}

describe("System-1 compatibility adapter", () => {
  it("uses the full research evaluator and preserves its evidence-aware result", async () => {
    const input = opportunity();

    const streamingResult = await evaluateSystem1HeuristicsStreaming(input);
    const directResult = evaluateSystem1Heuristics(input);
    expect(streamingResult).toMatchObject({
      ...directResult,
      speedToDecisionSeconds: expect.any(Number),
    });
  });
});

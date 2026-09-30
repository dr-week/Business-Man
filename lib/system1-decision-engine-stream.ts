import type { ResearchOpportunity } from "./research-engine";
import { evaluateSystem1Heuristics } from "./system1-decision-engine";
import type { System1Evaluation } from "./system1-decision-engine";

/** Compatibility adapter for callers of the former placeholder stream evaluator. */
export async function evaluateSystem1HeuristicsStreaming(
  opportunity: ResearchOpportunity,
): Promise<System1Evaluation> {
  return evaluateSystem1Heuristics(opportunity);
}

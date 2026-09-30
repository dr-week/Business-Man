import type { ResearchOpportunity } from "./research-engine";
import { evaluateSystem1Heuristics } from "./system1-decision-engine";
import type { System1Evaluation } from "./system1-decision-engine";

/**
 * Evaluate an opportunity with the System-1 rules engine.
 *
 * The current rules operate on opportunity-wide evidence and do not process
 * signal batches. Keep this adapter for worker callers while preserving the
 * complete evidence context needed for a valid result.
 */
export async function processOpportunityInBatches(
  opportunity: ResearchOpportunity,
  _batchSize = 1000,
): Promise<System1Evaluation> {
  return evaluateSystem1Heuristics(opportunity);
}

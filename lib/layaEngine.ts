// Lazy-load wrapper for System-1 triage with a bounded LRU cache.

import { DecisionCache } from "./decisionCache";
import type { ResearchOpportunity } from "./research-engine";
import type { System1Evaluation } from "./system1-decision-engine";

// Create a module‑level cache (max 200 recent evaluations)
const cache = new DecisionCache<System1Evaluation>(200);

function evaluationCacheKey(opportunity: ResearchOpportunity): string {
  const financials = opportunity.financials && {
    contribution: opportunity.financials.contribution,
    paybackMonth: opportunity.financials.paybackMonth,
    baseMargin: opportunity.financials.scenarios[1]?.margin ?? null,
  };
  const claims = opportunity.claims.map(({ direction, factor, sourceIds }) => [direction, factor, sourceIds]);
  const sourceIds = opportunity.sources.map(({ id }) => id);
  return JSON.stringify([opportunity.id, opportunity.buyer, opportunity.gap, financials, claims, sourceIds]);
}

/**
 * Cache identical evaluator inputs, not just opportunity IDs, so edits to
 * buyer, economics, or evidence cannot reuse an out-of-date triage.
 */
export async function runDecisionEngine(opportunity: ResearchOpportunity): Promise<System1Evaluation> {
  const key = evaluationCacheKey(opportunity);
  const cached = cache.get(key);
  if (cached) return cached;

  // Dynamically import the heavy engine only once per call
  const { evaluateSystem1Heuristics } = await import("./system1-decision-engine");
  const result = evaluateSystem1Heuristics(opportunity);
  cache.set(key, result);
  return result;
}

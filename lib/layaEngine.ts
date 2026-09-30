// Lazy‑load wrapper for the System‑1 decision engine with LRU caching

import { DecisionCache } from "./decisionCache";
import type { ResearchOpportunity } from "./research-engine";
import type { System1Evaluation } from "./system1-decision-engine";

// Create a module‑level cache (max 200 recent evaluations)
const cache = new DecisionCache<System1Evaluation>(200);

/**
 * Runs the heavy System‑1 heuristics lazily. Results are cached per
 * `opportunity.id` so repeated evaluations of the same opportunity avoid
 * re‑importing and re‑computing the heavy logic – this reduces RAM churn.
 */
export async function runDecisionEngine(opportunity: ResearchOpportunity): Promise<System1Evaluation> {
  // Return cached result if available
  const cached = cache.get(opportunity.id);
  if (cached) return cached;

  // Dynamically import the heavy engine only once per call
  const { evaluateSystem1Heuristics } = await import("./system1-decision-engine");
  const result = evaluateSystem1Heuristics(opportunity);
  cache.set(opportunity.id, result);
  return result;
}

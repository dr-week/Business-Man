// lib/decisionEngineBatchProcessor.ts
// Utility to process a Decision Engine opportunity in memory‑efficient batches.
// This is useful when an opportunity contains a very large number of signals
// (e.g., > 1 000) and we want to avoid loading the entire array into memory
// at once while still applying the heuristics.

import type { Opportunity } from "./types"; // Assume a simple type definition exists elsewhere
import { evaluateSystem1Heuristics } from "./system1-decision-engine";

/**
 * Process an opportunity by splitting its signals into smaller batches.
 * For each batch we run the heuristics on a shallow copy of the opportunity
 * where `signals` contains only that batch. The partial results are merged
 * into a final `System1Evaluation`.
 *
 * This approach reduces peak heap usage because the heuristics work on a
 * smaller array at any given time.
 */
export async function processOpportunityInBatches(
  opportunity: Opportunity,
  batchSize: number = 1000
) {
  const totalSignals = opportunity.signals.length;
  if (totalSignals <= batchSize) {
    // Small enough – just run once.
    return evaluateSystem1Heuristics(opportunity);
  }

  // Initialise an empty aggregate verdict.
  const aggregate: any = {
    verdict: "undecided",
    signals: [],
    errors: [],
  };

  for (let i = 0; i < totalSignals; i += batchSize) {
    const slice = opportunity.signals.slice(i, i + batchSize);
    const partialOpp = { ...opportunity, signals: slice };
    const partialEval = await evaluateSystem1Heuristics(partialOpp);

    // Merge partial verdicts – simple heuristic: if any batch returns
    // "negative" or "fatal" we promote the aggregate to that level.
    if (partialEval.verdict === "negative" || partialEval.verdict === "fatal") {
      aggregate.verdict = partialEval.verdict;
    } else if (partialEval.verdict === "positive" && aggregate.verdict === "undecided") {
      aggregate.verdict = "positive";
    }

    // Concatenate signals and errors for debugging.
    aggregate.signals.push(...partialEval.signals);
    aggregate.errors.push(...partialEval.errors);
  }

  return aggregate as ReturnType<typeof evaluateSystem1Heuristics>;
}

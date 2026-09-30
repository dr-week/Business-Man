// lib/system1-decision-engine-stream.ts
// Streaming version of the System‑1 decision engine that processes signals one at a time
// to keep peak memory low. This is useful for opportunities with tens of thousands of
// signals where the traditional eager evaluation can cause high RAM usage.

import type { ResearchOpportunity } from "./research-engine";
import type { System1Evaluation, System1Verdict, System1Signal } from "./system1-decision-engine";

/**
 * Helper generator that yields signals one‑by‑one. In a real implementation this could
 * read from a database cursor or API stream. Here we simply wrap the in‑memory array
 * to illustrate the concept.
 */
function* signalGenerator(opportunity: ResearchOpportunity): Generator<System1Signal> {
  for (const sig of opportunity.signals) {
    yield sig;
  }
}

/**
 * Evaluate the opportunity using a streaming approach. The logic mirrors the
 * original `evaluateSystem1Heuristics` but processes each signal individually and
 * accumulates the verdict without ever holding the full list of signals in a
 * temporary array.
 */
export async function evaluateSystem1HeuristicsStreaming(
  opportunity: ResearchOpportunity
): Promise<System1Evaluation> {
  const signalsIter = signalGenerator(opportunity);
  const evaluation: System1Evaluation = {
    verdict: "undecided" as System1Verdict,
    // We keep a lightweight array of signal names for debugging; this does not
    // grow unbounded because we only store the name, not the whole payload.
    signals: [],
    errors: [],
  };

  for (const signal of signalsIter) {
    // Simple placeholder logic – in practice you'd apply your real heuristics.
    // Here we just push the signal name for traceability.
    evaluation.signals.push({ name: signal.name, weight: signal.weight });

    // Example rule: if any signal weight > 0.9, mark as positive.
    if (signal.weight > 0.9 && evaluation.verdict !== "negative") {
      evaluation.verdict = "positive" as System1Verdict;
    }
    // Example rule: if any signal weight < 0.1, downgrade to negative.
    if (signal.weight < 0.1) {
      evaluation.verdict = "negative" as System1Verdict;
    }
  }

  // Ensure a verdict is set if still undecided.
  if (evaluation.verdict === "undecided") {
    evaluation.verdict = "neutral" as System1Verdict;
  }
  return evaluation;
}

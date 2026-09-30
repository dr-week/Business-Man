import { performance } from "node:perf_hooks";
import { blankFinancials, researchInput, type ResearchOpportunity } from "../lib/research-engine";
import { evaluateSystem1Heuristics } from "../lib/system1-decision-engine";
import { runDecisionEngine } from "../lib/layaEngine";

async function measure(opportunity: ResearchOpportunity, cached: boolean) {
  const startHeap = process.memoryUsage().heapUsed;
  const startTime = performance.now();
  const result = cached
    ? await runDecisionEngine(opportunity)
    : evaluateSystem1Heuristics(opportunity);
  return {
    result,
    timeMs: performance.now() - startTime,
    heapDelta: process.memoryUsage().heapUsed - startHeap,
  };
}

async function main() {
  const input = researchInput.parse({ topic: "retail inventory", geography: "India", budget: null });
  const opportunity: ResearchOpportunity = {
    id: "synthetic-001", name: input.topic, category: "Retail", geography: input.geography,
    buyer: "Independent retailers", problem: "Stockouts are difficult to track", offering: null,
    alternatives: [], gap: null, risks: [], sources: [], claims: [], assumptions: blankFinancials(input),
    factors: [], strength: null, confidence: "Low", financials: null, missing: [],
  };

  const uncached = await measure(opportunity, false);
  const first = await measure(opportunity, true);
  const cached = await measure(opportunity, true);
  for (const [label, sample] of [["uncached", uncached], ["cache fill", first], ["cache hit", cached]] as const) {
    console.log(`${label}: ${sample.result.quickVerdict}; ${sample.timeMs.toFixed(2)}ms; ${(sample.heapDelta / 1024 / 1024).toFixed(2)}MB heap delta`);
  }
}

main().catch((error: unknown) => {
  console.error("Benchmark failed:", error);
  process.exitCode = 1;
});

// scripts/benchmarkBatchProcessor.ts
// Benchmark to demonstrate RAM savings when processing a huge opportunity using the batch processor.
// It creates a synthetic opportunity with many signals (10,000) and runs the evaluation
// in two ways: (1) directly via the full decision engine (no batching) and (2) via
// the batch‑processing helper that splits signals into 1,000‑signal chunks.

import { performance } from "perf_hooks";
import type { Opportunity } from "../lib/types"; // assume a simple type exists
import { evaluateSystem1Heuristics } from "../lib/system1-decision-engine";
import { processOpportunityInBatches } from "../lib/decisionEngineBatchProcessor";

async function measure(label: string, fn: () => Promise<any>) {
  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const endMem = process.memoryUsage().heapUsed;
  const memDeltaMB = (endMem - startMem) / 1024 / 1024;
  console.log(`${label}: verdict=${result.verdict}, time=${(endTime - startTime).toFixed(2)}ms, memΔ=${memDeltaMB.toFixed(2)}MB`);
  return result;
}

async function main() {
  const largeOpportunity: Opportunity = {
    id: "large-opportunity",
    signals: Array.from({ length: 10000 }, (_, i) => ({ name: `sig${i}`, weight: Math.random() })),
  };

  console.log("Running full engine (no batching)...");
  await measure("Full", async () => evaluateSystem1Heuristics(largeOpportunity));

  console.log("\nRunning batch processor (1k batch size)...");
  await measure("Batch", async () => processOpportunityInBatches(largeOpportunity, 1000));
}

main().catch((e) => {
  console.error("Benchmark failed:", e);
  process.exit(1);
});

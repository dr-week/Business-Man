// Benchmark script for Decision Engine RAM usage
// This script runs the decision engine twice: once with the default (no cache) and once with the LRU cache enabled.
// It measures memory consumption and execution time, then prints a simple report.

import { performance } from "perf_hooks";
import { runDecisionEngine as runWithoutCache } from "../lib/layaEngine"; // This will use cache internally; we will bypass by clearing it
import DecisionCache from "../lib/decisionCache";

async function measure(opportunity: any, useCache: boolean) {
  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  // If we want to bypass cache, clear it before run
  if (!useCache) {
    // Directly import the original engine without cache (dynamic import)
    const { evaluateSystem1Heuristics } = await import("../lib/system1-decision-engine");
    const result = await evaluateSystem1Heuristics(opportunity);
    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    return { result, timeMs: endTime - startTime, memDelta: endMem - startMem };
  } else {
    const result = await runWithoutCache(opportunity);
    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    return { result, timeMs: endTime - startTime, memDelta: endMem - startMem };
  }
}

async function main() {
  // Generate a synthetic opportunity with many signals to stress memory
  const opportunity = {
    id: "synthetic-001",
    signals: Array.from({ length: 5000 }, (_, i) => ({
      name: `signal_${i}`,
      weight: Math.random(),
    })),
  };

  console.log("Running benchmark without cache...");
  const without = await measure(opportunity, false);
  console.log("Result (no cache):", without.result.verdict);
  console.log(`Time: ${without.timeMs.toFixed(2)} ms, Memory Δ: ${(without.memDelta / 1024 / 1024).toFixed(2)} MB`);

  console.log("\nRunning benchmark with LRU cache...");
  // First run populates cache; second run should hit cache
  const withFirst = await measure(opportunity, true);
  const withSecond = await measure(opportunity, true);

  console.log("Result (first cache run):", withFirst.result.verdict);
  console.log(`Time: ${withFirst.timeMs.toFixed(2)} ms, Memory Δ: ${(withFirst.memDelta / 1024 / 1024).toFixed(2)} MB`);

  console.log("Result (second cache hit):", withSecond.result.verdict);
  console.log(`Time: ${withSecond.timeMs.toFixed(2)} ms, Memory Δ: ${(withSecond.memDelta / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((e) => {
  console.error("Benchmark failed:", e);
  process.exit(1);
});

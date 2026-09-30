// workers/decisionEngineDatasetWorker.ts
// Automation worker that streams a public CSV dataset of business opportunities,
// processes each record through the streaming decision engine, and aggregates
// verdict counts. This demonstrates low‑RAM processing of large open datasets.

import fetch from "node-fetch";
import * as csv from "csv-parser"; // npm package for streaming CSV parsing
import { createReadStream, writeFile } from "fs";
import { pipeline } from "stream/promises";
import { evaluateSystem1HeuristicsStreaming } from "../lib/system1-decision-engine-stream";

// ---------------------------------------------------------------------------
// Configuration (set via environment variables in production)
// ---------------------------------------------------------------------------
const DATASET_URL = process.env.DATASET_URL || "https://raw.githubusercontent.com/datasets/fortune-500/master/data/fortune500.csv"; // Example public CSV (company, rank, revenue, etc.)
const OUTPUT_PATH = process.env.OUTPUT_PATH || "./scripts/decisionEngineDatasetResults.json";

/**
 * Transforms a CSV row into the minimal Opportunity shape expected by the
 * streaming decision engine. For demo purposes we map a numeric field to a
 * weight between 0‑1.
 */
function rowToOpportunity(row: Record<string, string>) {
  const revenue = Number(row["Revenue"]?.replace(/[^0-9.]/g, "")) || 0;
  // Normalise revenue to a weight (assume max 100B for scaling)
  const weight = Math.min(revenue / 1e11, 1);
  return {
    id: row["Company"] || "unknown",
    signals: [{ name: "revenue", weight }],
  } as any;
}

async function processDataset() {
  console.log("Downloading dataset…", DATASET_URL);
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to download dataset: ${response.status}`);
  }

  // Write the response to a temporary file to allow streaming CSV parser.
  const tmpPath = "./scripts/tmp_dataset.csv";
  await writeFile(tmpPath, await response.text());

  const verdictCounts: Record<string, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    undecided: 0,
  };

  const csvStream = createReadStream(tmpPath).pipe(csv());

  for await (const row of csvStream) {
    const opp = rowToOpportunity(row);
    try {
      const result = await evaluateSystem1HeuristicsStreaming(opp);
      verdictCounts[result.verdict] = (verdictCounts[result.verdict] ?? 0) + 1;
    } catch (e) {
      console.error(`Error processing ${opp.id}:`, e);
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(verdictCounts, null, 2));
  console.log("Processing complete. Verdict distribution written to", OUTPUT_PATH);
  console.log(verdictCounts);
}

// When executed directly, run the worker.
if (import.meta.url.endsWith(process.argv[1])) {
  processDataset().catch((e) => {
    console.error("Worker failed:", e);
    process.exit(1);
  });
}

export { processDataset };

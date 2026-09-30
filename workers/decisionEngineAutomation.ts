// workers/decisionEngineAutomation.ts
// This automation worker fetches a list of opportunities from a public API and runs the decision engine on each.
// It demonstrates an end‑to‑end workflow: data ingestion → decision processing → result logging.
// The worker uses the LRU cache (layaEngine) to avoid recomputing decisions for duplicate opportunities.

import fetch from "node-fetch";
import { runDecisionEngine } from "../lib/layaEngine";
import type { Opportunity } from "../lib/types"; // Assume a simple type definition exists elsewhere

// Example API endpoint – replace with a real data source for production.
const DATA_SOURCE_URL = process.env.OPPORTUNITY_API_URL || "https://jsonplaceholder.typicode.com/todos";

async function fetchOpportunities(): Promise<Opportunity[]> {
  const res = await fetch(DATA_SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch opportunities: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as any[];
  // Map placeholder data to our Opportunity shape
  return data.map((item) => ({
    id: `todo-${item.id}`,
    signals: [
      { name: "completed", weight: item.completed ? 1 : 0 },
      { name: "userId", weight: item.userId / 10 },
    ],
  }));
}

async function processAll() {
  const opportunities = await fetchOpportunities();
  console.log(`Fetched ${opportunities.length} opportunities. Processing...`);

  const results: Record<string, string> = {};
  for (const opp of opportunities) {
    const decision = await runDecisionEngine(opp);
    results[opp.id] = decision.verdict;
    console.log(`Opportunity ${opp.id}: ${decision.verdict}`);
  }

  // Persist results to a JSON file for later analysis (optional)
  const fs = await import("fs/promises");
  await fs.writeFile(
    "./scripts/decisionEngineResults.json",
    JSON.stringify(results, null, 2)
  );
  console.log("Results written to scripts/decisionEngineResults.json");
}

process.argv[1] && process.argv[1].endsWith("decisionEngineAutomation.ts")
  ? process.exit(0)
  : main?.();

async function main() {
  try {
    await processAll();
  } catch (e) {
    console.error("Automation failed:", e);
    process.exit(1);
  }
}

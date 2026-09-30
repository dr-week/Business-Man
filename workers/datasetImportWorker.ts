// workers/datasetImportWorker.ts
// Worker that imports an external CSV dataset (e.g., Indian startup data) and stores it locally.
// This fills the "missing feature" of loading user‑provided data for analysis.

import { promises as fs } from "fs";
import { dirname } from "node:path";
import fetch from "node-fetch";
import csv from "csv-parser";

/**
 * Download a CSV file from a public URL, parse it, and write the records to a JSON file.
 *
 * @param sourceUrl URL of the CSV dataset (must be publicly accessible).
 * @param outputPath Path where the parsed JSON will be saved (e.g., "data/datasets/startups.json").
 */
export async function importCsvDataset(sourceUrl: string, outputPath: string): Promise<void> {
  // Simple validation of the URL.
  if (!sourceUrl.startsWith("http")) {
    throw new Error("sourceUrl must be an http(s) URL");
  }

  // Stream the response body through csv‑parser.
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const records: Record<string, string>[] = [];
  const csvStream = response.body?.pipe(csv());
  if (!csvStream) {
    throw new Error("Unable to pipe CSV stream");
  }

  csvStream.on("data", (row: unknown) => records.push(row as Record<string, string>));
  await new Promise((resolve, reject) => {
    csvStream.on("end", resolve);
    csvStream.on("error", reject);
  });

  // Ensure the directory exists.
  await fs.mkdir(dirname(outputPath), { recursive: true });
  // Write pretty‑printed JSON.
  await fs.writeFile(outputPath, JSON.stringify(records, null, 2), "utf-8");

  console.log(`✅ Imported ${records.length} rows to ${outputPath}`);
}

// Demo mode – run directly for quick verification.
if (import.meta.url.endsWith(process.argv[1])) {
  const demoUrl = process.env.DEMO_DATASET_URL || "https://raw.githubusercontent.com/datasets/startup-companies/master/data/startup_companies.csv";
  const out = "./data/datasets/demo_startups.json";
  importCsvDataset(demoUrl, out)
    .then(() => console.log("Demo import completed"))
    .catch((e) => console.error(e));
}

// lib/marketResearchSummary.ts
// Helper module that reads a JSON dataset of companies/startups and produces simple market insights.
// This addresses the **missing feature** for the *market‑research* module.

import { promises as fs } from "fs";
import path from "path";

/**
 * Structure of a single record in the dataset (simplified).
 * Adjust fields to match the actual CSV columns you import.
 */
export interface CompanyRecord {
  name: string;
  sector?: string; // e.g., "FinTech", "HealthTech"
  country?: string; // should be "India" for our primary market
  funding?: string; // raw string like "10M USD" – we will parse numbers
  foundedYear?: string; // e.g., "2018"
}

/**
 * Load the JSON dataset from disk.
 * @param jsonPath absolute or relative path to the JSON file.
 */
export async function loadDataset(jsonPath: string): Promise<CompanyRecord[]> {
  const absolute = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);
  const data = await fs.readFile(absolute, "utf-8");
  return JSON.parse(data) as CompanyRecord[];
}

/**
 * Parse a funding string into a numeric value in USD.
 * Very tolerant – extracts the first number and assumes USD.
 */
function parseFunding(value?: string): number {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/([0-9.]+)\s*(M|B)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  if (unit === "B") return num * 1_000; // billions → thousands of millions
  return num; // millions (default)
}

/**
 * Generate simple market insights from a list of company records.
 * Returns an object that can be JSON‑serialized and sent to the client.
 */
export function computeInsights(records: CompanyRecord[]) {
  const total = records.length;
  const bySector: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  let totalFunding = 0;
  let fundedCount = 0;

  for (const rec of records) {
    // Sector aggregation (fallback to "Unknown")
    const sector = rec.sector?.trim() || "Unknown";
    bySector[sector] = (bySector[sector] || 0) + 1;

    // Year aggregation (fallback to "Unknown")
    const year = rec.foundedYear?.trim() || "Unknown";
    byYear[year] = (byYear[year] || 0) + 1;

    // Funding aggregation
    const fund = parseFunding(rec.funding);
    if (fund > 0) {
      totalFunding += fund;
      fundedCount++;
    }
  }

  const avgFunding = fundedCount > 0 ? totalFunding / fundedCount : 0;

  // Convert objects to sorted arrays for easier UI consumption.
  const sectorBreakdown = Object.entries(bySector)
    .map(([name, count]) => ({ sector: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // top 10 sectors

  const yearBreakdown = Object.entries(byYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year))
    .slice(0, 10);

  return {
    totalCompanies: total,
    fundedCompanies: fundedCount,
    averageFundingMUSD: Math.round(avgFunding),
    topSectors: sectorBreakdown,
    recentFoundings: yearBreakdown,
  };
}

export default {
  loadDataset,
  computeInsights,
};

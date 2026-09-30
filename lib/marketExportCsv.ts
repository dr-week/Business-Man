import { ResearchBounty } from "../db/schema";
import { stringify } from "csv-stringify/sync";

/**
 * Generate a CSV string from an array of ResearchBounty records.
 * Only a subset of fields that are meaningful for market analysis are exported.
 */
export function generateBountyCsv(bounties: ResearchBounty[]): string {
  const columns = [
    "id",
    "title",
    "description",
    "createdAt",
    "status",
    "sector",
    "estimatedRevenue",
  ];

  const data = bounties.map((b) => [
    b.id,
    b.title,
    b.description,
    b.createdAt?.toISOString() ?? "",
    b.status,
    b.sector ?? "",
    b.estimatedRevenue?.toString() ?? "",
  ]);

  return stringify(data, { header: true, columns });
}

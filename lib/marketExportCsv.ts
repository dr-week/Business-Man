import { researchBounties } from "../db/schema";

type ResearchBounty = typeof researchBounties.$inferSelect;
const columns = ["id", "opportunityId", "opportunityName", "falsificationTarget", "rewardAmount", "currency", "status", "createdAt", "expiresAt"] as const;
const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** Export only fields in the current bounty schema. */
export function generateBountyCsv(bounties: ResearchBounty[]): string {
  const rows = bounties.map((bounty) => columns.map((column) => bounty[column]));
  return [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

import { Readable } from "node:stream";
import { researchBounties } from "../db/schema";

type ResearchBounty = typeof researchBounties.$inferSelect;
const columns = ["id", "opportunityId", "opportunityName", "falsificationTarget", "rewardAmount", "currency", "status", "createdAt", "expiresAt"] as const;
const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** Yield CSV rows lazily so export formatting adds constant buffering. */
export function createBountyCsvStream(bounties: Iterable<ResearchBounty>): Readable {
  function* rows() {
    yield `${columns.map(cell).join(",")}\r\n`;
    for (const bounty of bounties) {
      yield `${columns.map((column) => cell(bounty[column])).join(",")}\r\n`;
    }
  }
  return Readable.from(rows());
}

import { and, desc, eq, notInArray } from "drizzle-orm";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";

const MAX_RETAINED_RUNS = 20;
const MAX_RUN_BYTES = 1_900_000;

/** Return the latest snapshot used to restore the research workspace at startup. */
export function listResearchRuns(db: ReturnType<typeof getDb>, ownerId: string) {
  return db.select().from(researchRuns)
    .where(eq(researchRuns.ownerId, ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id))
    .limit(1);
}

/** Return a small owner-scoped index so archive navigation does not load every result payload. */
export function listResearchRunSummaries(db: ReturnType<typeof getDb>, ownerId: string) {
  return db.select({ id: researchRuns.id, topic: researchRuns.topic, geography: researchRuns.geography, createdAt: researchRuns.createdAt })
    .from(researchRuns)
    .where(eq(researchRuns.ownerId, ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id))
    .limit(MAX_RETAINED_RUNS);
}

/** Load one archived result without allowing access across owners. */
export function getResearchRun(db: ReturnType<typeof getDb>, ownerId: string, id: string) {
  return db.select().from(researchRuns)
    .where(and(eq(researchRuns.ownerId, ownerId), eq(researchRuns.id, id)))
    .limit(1);
}

/** Save and retain the newest owner-scoped runs in one D1 transaction. */
export async function saveResearchRun(db: ReturnType<typeof getDb>, run: typeof researchRuns.$inferInsert) {
  const runBytes = new TextEncoder().encode(JSON.stringify(run)).byteLength;
  if (runBytes > MAX_RUN_BYTES) throw new Error("Research snapshot exceeds the D1 row budget");
  const retained = db.select({ id: researchRuns.id }).from(researchRuns)
    .where(eq(researchRuns.ownerId, run.ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id)).limit(MAX_RETAINED_RUNS);
  await db.batch([
    db.insert(researchRuns).values(run),
    db.delete(researchRuns).where(and(eq(researchRuns.ownerId, run.ownerId), notInArray(researchRuns.id, retained))),
  ]);
}

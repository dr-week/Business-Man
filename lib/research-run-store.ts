import { and, desc, eq, notInArray } from "drizzle-orm";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";

const MAX_RETAINED_RUNS = 20;

/** Return only the snapshot restored at startup; avoid hydrating retained history. */
export function getLatestResearchRun(db: ReturnType<typeof getDb>, ownerId: string) {
  return db.select().from(researchRuns)
    .where(eq(researchRuns.ownerId, ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id))
    .limit(1);
}

/** Save and retain the newest owner-scoped runs in one D1 transaction. */
export async function saveResearchRun(db: ReturnType<typeof getDb>, run: typeof researchRuns.$inferInsert) {
  const retained = db.select({ id: researchRuns.id }).from(researchRuns)
    .where(eq(researchRuns.ownerId, run.ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id)).limit(MAX_RETAINED_RUNS);
  await db.batch([
    db.insert(researchRuns).values(run),
    db.delete(researchRuns).where(and(eq(researchRuns.ownerId, run.ownerId), notInArray(researchRuns.id, retained))),
  ]);
}

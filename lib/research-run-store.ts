import { and, desc, eq, notInArray } from "drizzle-orm";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";

/** Save and retain the newest 20 owner-scoped runs in one D1 transaction. */
export async function saveResearchRun(db: ReturnType<typeof getDb>, run: typeof researchRuns.$inferInsert) {
  const retained = db.select({ id: researchRuns.id }).from(researchRuns)
    .where(eq(researchRuns.ownerId, run.ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id)).limit(20);
  await db.batch([
    db.insert(researchRuns).values(run),
    db.delete(researchRuns).where(and(eq(researchRuns.ownerId, run.ownerId), notInArray(researchRuns.id, retained))),
  ]);
}

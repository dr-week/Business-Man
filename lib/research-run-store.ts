import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";

const MAX_RETAINED_RUNS = 20;
const MAX_RUN_BYTES = 1_900_000;
export const RESEARCH_RUN_SCHEMA_VERSION = 1;

/** Return a small owner-scoped history index without loading saved result payloads. */
export function listResearchRuns(db: ReturnType<typeof getDb>, ownerId: string) {
  return db.select({ id: researchRuns.id, schemaVersion: researchRuns.schemaVersion, topic: researchRuns.topic, geography: researchRuns.geography, currency: researchRuns.currency, createdAt: researchRuns.createdAt }).from(researchRuns)
    .where(eq(researchRuns.ownerId, ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id))
    .limit(MAX_RETAINED_RUNS);
}

/** Load one saved snapshot only when the owner selects it. */
export function getResearchRun(db: ReturnType<typeof getDb>, ownerId: string, id: string) {
  return db.select().from(researchRuns)
    .where(and(eq(researchRuns.ownerId, ownerId), eq(researchRuns.id, id)))
    .limit(1);
}

/** Preserve the existing startup restore behavior. */
export function getLatestResearchRun(db: ReturnType<typeof getDb>, ownerId: string) {
  return db.select().from(researchRuns)
    .where(eq(researchRuns.ownerId, ownerId))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id))
    .limit(1);
}

/** Insert first, then retain the new run plus the 19 newest older runs. */
export async function saveResearchRun(db: ReturnType<typeof getDb>, run: typeof researchRuns.$inferInsert) {
  if ((run.schemaVersion ?? RESEARCH_RUN_SCHEMA_VERSION) !== RESEARCH_RUN_SCHEMA_VERSION) {
    throw new Error("Unsupported research snapshot schema version");
  }
  const snapshot = { ...run, createdAt: run.createdAt ?? new Date().toISOString() };
  const runBytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
  if (runBytes > MAX_RUN_BYTES) throw new Error("Research snapshot exceeds the D1 row budget");
  const retained = db.select({ id: researchRuns.id }).from(researchRuns)
    .where(and(eq(researchRuns.ownerId, run.ownerId), ne(researchRuns.id, run.id)))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id)).limit(MAX_RETAINED_RUNS - 1);
  await db.batch([
    db.insert(researchRuns).values(snapshot),
    db.delete(researchRuns).where(and(eq(researchRuns.ownerId, run.ownerId), ne(researchRuns.id, run.id), notInArray(researchRuns.id, retained))),
  ]);
}

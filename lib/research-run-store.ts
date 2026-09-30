import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";
import { researchInput } from "@/lib/research-engine";

const MAX_RETAINED_RUNS = 20;
const MAX_RUN_BYTES = 1_900_000;
export const RESEARCH_RUN_SCHEMA_VERSION = 1;
const importedOpportunity = z.object({
  id: z.string().min(1).max(200), name: z.string().min(1).max(300), category: z.string().max(200),
  geography: z.string().max(200), buyer: z.string().max(500).nullable(), problem: z.string().max(5000),
  offering: z.string().max(5000).nullable(), alternatives: z.array(z.string().max(500)).max(100),
  gap: z.string().max(5000).nullable(), risks: z.array(z.string().max(2000)).max(100),
  sources: z.array(z.record(z.string(), z.unknown())).max(200), claims: z.array(z.record(z.string(), z.unknown())).max(500),
  assumptions: z.record(z.string(), z.unknown()), factors: z.array(z.record(z.string(), z.unknown())).max(50),
  strength: z.number().finite().nullable(), confidence: z.enum(["Low", "Medium", "High"]),
  financials: z.record(z.string(), z.unknown()).nullable(), missing: z.array(z.string().max(500)).max(100),
}).passthrough();
const researchBackup = z.object({
  format: z.literal("businessman-research-run"), formatVersion: z.literal(1),
  run: z.object({
    schemaVersion: z.literal(RESEARCH_RUN_SCHEMA_VERSION), topic: z.string().min(2).max(1000),
    geography: z.string().min(2).max(100), currency: z.string().regex(/^[A-Z]{3}$/),
    createdAt: z.string().datetime(), input: researchInput,
    result: z.object({ opportunities: z.array(importedOpportunity).max(200), query: z.record(z.string(), z.unknown()).optional(), providerErrors: z.array(z.string().max(300)).optional() }).passthrough(),
  }).passthrough(),
}).strict();

/** Validate an app backup and prepare a fresh owner-scoped archive row. */
export function parseResearchBackup(value: unknown, ownerId: string) {
  const parsed = researchBackup.safeParse(value);
  if (!parsed.success) throw new Error("Backup format is invalid or unsupported.");
  const { run } = parsed.data;
  if (run.input.topic !== run.topic || run.input.geography !== run.geography || run.input.currency !== run.currency) {
    throw new Error("Backup metadata does not match its research input.");
  }
  return {
    id: crypto.randomUUID(), ownerId, schemaVersion: RESEARCH_RUN_SCHEMA_VERSION,
    topic: run.topic, geography: run.geography, currency: run.currency,
    createdAt: run.createdAt, input: run.input as Record<string, unknown>, result: run.result as Record<string, unknown>,
  };
}

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
  const serialized = JSON.stringify(snapshot);
  // UTF-8 uses at most three bytes per UTF-16 code unit. Most snapshots fit
  // this safe range, so avoid allocating an encoded copy for them.
  if (serialized.length > MAX_RUN_BYTES || (serialized.length * 3 > MAX_RUN_BYTES && new TextEncoder().encode(serialized).byteLength > MAX_RUN_BYTES)) {
    throw new Error("Research snapshot exceeds the D1 row budget");
  }
  const retained = db.select({ id: researchRuns.id }).from(researchRuns)
    .where(and(eq(researchRuns.ownerId, run.ownerId), ne(researchRuns.id, run.id)))
    .orderBy(desc(researchRuns.createdAt), desc(researchRuns.id)).limit(MAX_RETAINED_RUNS - 1);
  await db.batch([
    db.insert(researchRuns).values(snapshot),
    db.delete(researchRuns).where(and(eq(researchRuns.ownerId, run.ownerId), ne(researchRuns.id, run.id), notInArray(researchRuns.id, retained))),
  ]);
}

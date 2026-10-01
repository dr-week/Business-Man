import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db";
import { researchRuns } from "@/db/schema";
import { researchInput } from "@/lib/research-engine";
import { RESEARCH_RUN_SCHEMA_VERSION } from "@/lib/research-run-version";

export { RESEARCH_RUN_SCHEMA_VERSION } from "@/lib/research-run-version";

const MAX_RETAINED_RUNS = 20;
const MAX_RUN_BYTES = 1_900_000;
const evidenceId = z.string().min(1).max(200);
const externalWebUrl = z.string().url().max(2000).refine((value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}, "Evidence URL must use HTTP or HTTPS");
const sourceSignal = z.object({
  id: evidenceId, provider: z.string().min(1).max(200), title: z.string().min(1).max(1000),
  url: externalWebUrl, publishedAt: z.string(), retrievedAt: z.string(),
}).passthrough();
const claim = z.object({
  id: evidenceId, text: z.string().min(1).max(5000), direction: z.enum(["supports", "contradicts", "context"]), sourceIds: z.array(evidenceId).min(1).max(200),
}).passthrough();
const factor = z.object({
  name: z.string().min(1).max(100), weight: z.number().finite().min(0).max(100),
  score: z.number().finite().min(0).max(10).nullable(), evidenceIds: z.array(evidenceId).max(500), rule: z.string().min(1).max(2000),
}).passthrough();
const importedOpportunity = z.object({
  id: z.string().min(1).max(200), name: z.string().min(1).max(300), category: z.string().max(200),
  geography: z.string().max(200), buyer: z.string().max(500).nullable(), problem: z.string().max(5000),
  offering: z.string().max(5000).nullable(), alternatives: z.array(z.string().max(500)).max(100),
  gap: z.string().max(5000).nullable(), risks: z.array(z.string().max(2000)).max(100),
  sources: z.array(sourceSignal).max(200), claims: z.array(claim).max(500),
  assumptions: z.record(z.string(), z.unknown()), factors: z.array(factor).max(50),
  strength: z.number().finite().nullable(), confidence: z.enum(["Low", "Medium", "High"]),
  financials: z.record(z.string(), z.unknown()).nullable(), missing: z.array(z.string().max(500)).max(100),
}).passthrough().superRefine((opportunity, context) => {
  const sourceIds = new Set(opportunity.sources.map((source) => source.id));
  const claimIds = new Set(opportunity.claims.map((item) => item.id));
  if (sourceIds.size !== opportunity.sources.length) context.addIssue({ code: "custom", path: ["sources"], message: "Duplicate source ids" });
  if (claimIds.size !== opportunity.claims.length) context.addIssue({ code: "custom", path: ["claims"], message: "Duplicate claim ids" });
  opportunity.claims.forEach((item, index) => item.sourceIds.forEach((id) => {
    if (!sourceIds.has(id)) context.addIssue({ code: "custom", path: ["claims", index, "sourceIds"], message: "Claim references a source outside this opportunity" });
  }));
  opportunity.factors.forEach((factor, index) => factor.evidenceIds.forEach((id) => {
    if (!claimIds.has(id)) context.addIssue({ code: "custom", path: ["factors", index, "evidenceIds"], message: "Factor references a claim outside this opportunity" });
  }));
});
const researchBackup = z.object({
  format: z.literal("businessman-research-run"), formatVersion: z.literal(1), exportedAt: z.string().datetime().optional(),
  run: z.object({
    schemaVersion: z.literal(RESEARCH_RUN_SCHEMA_VERSION), topic: z.string().min(2).max(1000),
    geography: z.string().min(2).max(100), currency: z.string().regex(/^[A-Z]{3}$/),
    createdAt: z.string().datetime(), input: researchInput,
    result: z.object({
      opportunities: z.array(importedOpportunity).max(200), query: z.record(z.string(), z.unknown()).optional(),
      providerErrors: z.array(z.string().max(300)).optional(),
      webResearch: z.array(z.object({ title: z.string().max(240), url: externalWebUrl, snippet: z.string().max(600) })).max(8).optional(),
      webSearchConfigured: z.boolean().optional(),
    }).passthrough(),
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

/** Match an exact imported snapshot without conflating separate runs of one query. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export async function findDuplicateResearchRun(db: ReturnType<typeof getDb>, run: Pick<typeof researchRuns.$inferSelect, "ownerId" | "schemaVersion" | "topic" | "geography" | "currency" | "createdAt" | "input" | "result">) {
  const candidates = await db.select({ id: researchRuns.id, result: researchRuns.result }).from(researchRuns)
    .where(and(
      eq(researchRuns.ownerId, run.ownerId), eq(researchRuns.schemaVersion, run.schemaVersion),
      eq(researchRuns.topic, run.topic), eq(researchRuns.geography, run.geography),
      eq(researchRuns.currency, run.currency), eq(researchRuns.createdAt, run.createdAt),
      eq(researchRuns.input, run.input),
    ))
    .limit(MAX_RETAINED_RUNS);
  const duplicate = candidates.find((candidate) => canonicalJson(candidate.result) === canonicalJson(run.result));
  return duplicate ? [{ id: duplicate.id }] : [];
}

/** Delete one snapshot only when it belongs to the requesting owner. */
export function deleteResearchRun(db: ReturnType<typeof getDb>, ownerId: string, id: string) {
  return db.delete(researchRuns).where(and(eq(researchRuns.ownerId, ownerId), eq(researchRuns.id, id)));
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

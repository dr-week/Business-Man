import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Economics } from "../lib/economics";

/** Lean schema: factual evidence is separate from AI-derived scoring. */
export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  stage: text("stage").notNull(),
  summary: text("summary").notNull(),
  demandScore: integer("demand_score").notNull(),
  competitionScore: integer("competition_score").notNull(),
  entryScore: integer("entry_score").notNull(),
  overallScore: integer("overall_score").notNull(),
  confidence: text("confidence").notNull(),
  status: text("status").notNull().default("candidate"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const evidence = sqliteTable("evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id),
  claim: text("claim").notNull(),
  direction: text("direction").notNull(), // supporting | contradicting | neutral
  sourceUrl: text("source_url").notNull(),
  sourceTitle: text("source_title").notNull(),
  publishedAt: text("published_at"),
  accessedAt: text("accessed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  confidence: text("confidence").notNull(),
});

export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Research dossiers are user-scoped; a signal is not a validated opportunity. */
export const huntLeads = sqliteTable("hunt_leads", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  lane: text("lane").notNull(),
  failure: text("failure").notNull(),
  buyer: text("buyer").notNull().default(""),
  trigger: text("trigger").notNull().default(""),
  source: text("source").notNull().default(""),
  alternatives: text("alternatives").notNull().default(""),
  payment: text("payment").notNull().default(""),
  nextTest: text("next_test").notNull().default(""),
  economics: text("economics", { mode: "json" }).$type<Economics>(),
  decision: text("decision").notNull().default("Investigate"),
  validationStatus: text("validation_status").notNull().default("unverified"),
  validationNote: text("validation_note").notNull().default(""),
  validationSourceUrl: text("validation_source_url").notNull().default(""),
  validationObservedAt: text("validation_observed_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("hunt_leads_owner_updated_idx").on(table.ownerId, table.updatedAt),
  index("hunt_leads_owner_lane_idx").on(table.ownerId, table.lane),
]);

export const huntEvidence = sqliteTable("hunt_evidence", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => huntLeads.id),
  ownerId: text("owner_id").notNull(),
  claim: text("claim").notNull(),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull().default(""),
  kind: text("kind").notNull(), // official | buyer | field | supplier | other
  direction: text("direction").notNull(), // supports | contradicts | context
  observedAt: text("observed_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("hunt_evidence_lead_idx").on(table.leadId, table.createdAt),
  index("hunt_evidence_owner_idx").on(table.ownerId),
]);

/** Durable, owner-scoped snapshots of completed research runs. */
export const researchRuns = sqliteTable("research_runs", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  topic: text("topic").notNull(),
  geography: text("geography").notNull(),
  currency: text("currency").notNull(),
  input: text("input", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  result: text("result", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("research_runs_owner_created_idx").on(table.ownerId, table.createdAt),
]);

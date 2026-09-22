import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
  validationPaymentAmount: real("validation_payment_amount"),
  validationPaymentCurrency: text("validation_payment_currency").notNull().default("INR"),
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

/** User-authored falsification checks attached to an archived opportunity. */
export const researchChecks = sqliteTable("research_checks", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  runId: text("run_id").notNull().references(() => researchRuns.id, { onDelete: "cascade" }),
  opportunityId: text("opportunity_id").notNull(),
  question: text("question").notNull(),
  outcome: text("outcome").notNull().default("open"), // open | supports | disconfirms | inconclusive
  evidenceKind: text("evidence_kind"), // sourced_fact | user_report | estimate | hypothesis
  note: text("note").notNull().default(""),
  sourceTitle: text("source_title").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  observedAt: text("observed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("research_checks_run_opportunity_idx").on(table.runId, table.opportunityId, table.createdAt),
  index("research_checks_owner_idx").on(table.ownerId),
]);

/** Captured sales for BUSINESSman offers; never mix with payments for researched opportunities. */
export const productRevenue = sqliteTable("product_revenue", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  offerId: text("offer_id").notNull(),
  paymentLinkId: text("payment_link_id").notNull().unique(),
  referenceId: text("reference_id").notNull().unique(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("creating"),
  paidAmountMinor: integer("paid_amount_minor").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  paidAt: text("paid_at"),
}, (table) => [index("product_revenue_owner_status_idx").on(table.ownerId, table.status)]);

/**
 * Community / peer research bounties & verification contributions.
 * Monetization & Collaboration engine: allows decentralized analysts/operators to submit
 * counter-evidence or on-the-ground pricing/supplier verification to earn reputation or revenue bounty shares.
 */
export const researchBounties = sqliteTable("research_bounties", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull(),
  opportunityName: text("opportunity_name").notNull(),
  falsificationTarget: text("falsification_target").notNull(), // Question to disprove/verify
  rewardAmount: integer("reward_amount").notNull().default(0), // in INR or credits
  currency: text("currency").notNull().default("INR"),
  sponsorId: text("sponsor_id").notNull(),
  status: text("status").notNull().default("open"), // open | in_review | verified | expired
  verifiedBy: text("verified_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
}, (table) => [
  index("research_bounties_status_idx").on(table.status),
  index("research_bounties_opportunity_idx").on(table.opportunityId),
]);

export const researchContributions = sqliteTable("research_contributions", {
  id: text("id").primaryKey(),
  bountyId: text("bounty_id").references(() => researchBounties.id, { onDelete: "set null" }),
  opportunityId: text("opportunity_id").notNull(),
  contributorHandle: text("contributor_handle").notNull(),
  contributorRole: text("contributor_role").notNull(), // local_operator | field_researcher | angel_analyst | customer
  evidenceType: text("evidence_type").notNull(), // counter_pricing | local_supplier | regulation | pilot_refusal | customer_quote
  claimSummary: text("claim_summary").notNull(),
  verdict: text("verdict").notNull(), // disconfirms | confirms | warns
  sourceUrl: text("source_url"),
  verificationData: text("verification_data", { mode: "json" }),
  status: text("status").notNull().default("submitted"), // submitted | peer_verified | rejected | bounty_awarded
  bountyAwarded: integer("bounty_awarded").default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("research_contributions_opp_idx").on(table.opportunityId, table.status),
  index("research_contributions_handle_idx").on(table.contributorHandle),
]);

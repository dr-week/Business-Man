import { z } from "zod";
import { RESEARCH_RUN_SCHEMA_VERSION } from "./research-run-version";
import type { ResearchOpportunity } from "./research-engine";
import type { DossierReportMetadata } from "./dossier-report";

const httpUrl = z.string().url().max(2000).refine((value) => ["http:", "https:"].includes(new URL(value).protocol));
const scenario = z.object({
  name: z.enum(["Low", "Base", "High"]), profit: z.number().finite(), units: z.number().finite(),
  margin: z.number().finite().nullable(), revenue: z.number().finite(),
  variableCosts: z.number().finite(), fixedCosts: z.number().finite(),
}).passthrough();
const opportunity = z.object({
  id: z.string().min(1).max(200), name: z.string().min(1).max(300), category: z.string().max(200),
  geography: z.string().max(200), buyer: z.string().max(500).nullable(), problem: z.string().max(5000),
  offering: z.string().max(5000).nullable(), alternatives: z.array(z.string().max(500)).max(100),
  gap: z.string().max(5000).nullable(), risks: z.array(z.string().max(2000)).max(100),
  confidence: z.enum(["Low", "Medium", "High"]), strength: z.number().finite().nullable(),
  financials: z.object({ funding: z.number().finite(), scenarios: z.array(scenario).length(3) }).passthrough().nullable(),
  sources: z.array(z.object({ id: z.string().min(1).max(200), provider: z.string().max(200), title: z.string().max(1000), excerpt: z.string().max(5000), url: httpUrl, publishedAt: z.string(), retrievedAt: z.string() }).passthrough()).max(200),
  claims: z.array(z.object({ direction: z.enum(["supports", "contradicts", "context"]), text: z.string().max(5000), sourceIds: z.array(z.string().max(200)).max(200) }).passthrough()).max(500),
  missing: z.array(z.string().max(500)).max(100),
}).passthrough();

const savedResearchExport = z.object({
  format: z.literal("businessman-research-run"), formatVersion: z.literal(1),
  run: z.object({
    schemaVersion: z.literal(RESEARCH_RUN_SCHEMA_VERSION), topic: z.string().min(2).max(1000),
    geography: z.string().min(2).max(100), currency: z.string().regex(/^[A-Z]{3}$/),
    createdAt: z.string().datetime(),
    result: z.object({ opportunities: z.array(opportunity).max(200) }).passthrough(),
  }).passthrough(),
}).passthrough();

export function parseSavedResearchBrief(value: unknown): { opportunities: ResearchOpportunity[]; metadata: DossierReportMetadata } {
  const parsed = savedResearchExport.safeParse(value);
  if (!parsed.success) throw new Error("Saved research is missing fields required for a readable brief.");
  const { run } = parsed.data;
  return {
    opportunities: run.result.opportunities as ResearchOpportunity[],
    metadata: {
      title: `${run.topic} — ${run.geography}`,
      topic: run.topic,
      geography: run.geography,
      generatedDate: run.createdAt.slice(0, 10),
      currency: run.currency,
      opportunitiesCount: run.result.opportunities.length,
    },
  };
}

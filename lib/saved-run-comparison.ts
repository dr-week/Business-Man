import { z } from "zod";

const comparableSnapshot = z.object({
  topic: z.string().min(2).max(1000),
  geography: z.string().min(2).max(100),
  currency: z.string().regex(/^[A-Z]{3}$/),
  createdAt: z.string().datetime(),
  result: z.object({
    opportunities: z.array(z.object({
      id: z.string().min(1).max(200), name: z.string().min(1).max(300),
      strength: z.number().finite().nullable(), confidence: z.enum(["Low", "Medium", "High"]),
      sources: z.array(z.object({ id: z.string().min(1).max(200) })).max(200),
    }).passthrough()).max(200),
  }).passthrough(),
}).passthrough();

export type ComparableOpportunity = {
  id: string;
  name: string;
  strength: number | null;
  confidence: string;
  sources: { id: string }[];
};

export type ComparableRun = {
  topic: string;
  geography: string;
  currency: string;
  createdAt: string;
  opportunities: ComparableOpportunity[];
};

export function parseComparableRun(value: unknown): ComparableRun {
  const parsed = comparableSnapshot.safeParse(value);
  if (!parsed.success) throw new Error("A saved run has an unsupported format.");
  return {
    topic: parsed.data.topic,
    geography: parsed.data.geography,
    currency: parsed.data.currency,
    createdAt: parsed.data.createdAt,
    opportunities: parsed.data.result.opportunities,
  };
}

export function compareSavedRuns(older: ComparableRun, newer: ComparableRun) {
  const sameScope = older.topic === newer.topic && older.geography === newer.geography && older.currency === newer.currency;
  if (!sameScope) throw new Error("Saved runs must have the same topic, location, and currency.");

  const olderById = new Map(older.opportunities.map((item) => [item.id, item]));
  const newerById = new Map(newer.opportunities.map((item) => [item.id, item]));
  const matched = older.opportunities.flatMap((previous) => {
    const current = newerById.get(previous.id);
    return current ? [{
      id: previous.id,
      name: current.name,
      previousStrength: previous.strength,
      currentStrength: current.strength,
      strengthChange: previous.strength == null || current.strength == null ? null : current.strength - previous.strength,
      previousConfidence: previous.confidence,
      currentConfidence: current.confidence,
      previousSources: previous.sources.length,
      currentSources: current.sources.length,
    }] : [];
  });

  return {
    matched,
    added: newer.opportunities.filter((item) => !olderById.has(item.id)).map((item) => item.name),
    removed: older.opportunities.filter((item) => !newerById.has(item.id)).map((item) => item.name),
  };
}

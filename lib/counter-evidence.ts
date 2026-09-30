import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
});

export const counterCheckInput = z.object({
  opportunityId: z.string().trim().min(1).max(200),
  question: z.string().trim().min(10).max(500),
}).strict();

export function normalizeCounterQuestion(question: string) {
  return question.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export const counterCheckOutcome = z.object({
  outcome: z.enum(["supports", "disconfirms", "inconclusive"]),
  evidenceKind: z.enum(["sourced_fact", "user_report", "estimate", "hypothesis"]),
  note: z.string().trim().min(5).max(1000),
  sourceTitle: z.string().trim().min(2).max(240),
  sourceUrl: z.string().url().max(2000).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }),
  observedAt: isoDate,
}).strict();

export type CounterCheckInput = z.infer<typeof counterCheckInput>;
export type CounterCheckOutcome = z.infer<typeof counterCheckOutcome>;
export const MAX_COUNTER_CHECKS_PER_OPPORTUNITY = 20;

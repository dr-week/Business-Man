import { z } from "zod";
import { LANES } from "@/lib/opportunity-hunt";
import { economicsInput } from "@/lib/economics";

const short = z.string().trim().max(240);
const detail = z.string().trim().max(1500);

export const leadInput = z.object({
  title: short.min(3),
  lane: z.enum(LANES),
  failure: detail.min(8),
  buyer: short.default(""),
  trigger: short.default(""),
  source: detail.default(""),
  alternatives: detail.default(""),
  payment: detail.default(""),
  nextTest: detail.default(""),
  economics: economicsInput.nullable().optional(),
});

export const leadPatch = leadInput.partial().extend({
  decision: z.enum(["Investigate", "Watch", "Reject"]).optional(),
}).refine((value) => Object.keys(value).length > 0);

export const evidenceInput = z.object({
  claim: detail.min(5),
  sourceTitle: short.min(2),
  sourceUrl: z.union([z.literal(""), z.string().url().refine((value) => /^https?:\/\//i.test(value))]),
  kind: z.enum(["official", "buyer", "field", "supplier", "other"]),
  direction: z.enum(["supports", "contradicts", "context"]),
  observedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

import { z } from "zod";
import { LANES } from "@/lib/opportunity-hunt";
import { economicsInput } from "@/lib/economics";

const short = z.string().trim().max(240);
const detail = z.string().trim().max(1500);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

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
  validationStatus: z.enum(["unverified", "need_confirmed", "pilot_offered", "paid_pilot", "repeat_purchase", "stopped"]).optional(),
  validationNote: detail.optional(),
  validationSourceUrl: z.union([z.literal(""), z.string().url().max(2000).refine((value) => /^https:\/\//i.test(value))]).optional(),
  validationObservedAt: z.union([z.literal(""), isoDate]).optional(),
}).refine((value) => Object.keys(value).length > 0)
  .refine((value) => value.validationStatus === undefined || value.validationStatus === "unverified" || Boolean(value.validationObservedAt && (value.validationNote?.trim() || value.validationSourceUrl?.trim())), {
    message: "Add an observation date and a note or proof link.", path: ["validationStatus"],
  });

export const evidenceInput = z.object({
  claim: detail.min(5),
  sourceTitle: short.min(2),
  sourceUrl: z.union([z.literal(""), z.string().url().refine((value) => /^https?:\/\//i.test(value))]),
  kind: z.enum(["official", "buyer", "field", "supplier", "other"]),
  direction: z.enum(["supports", "contradicts", "context"]),
  observedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

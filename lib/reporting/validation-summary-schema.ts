import { z } from "zod";

const count = z.number().int().nonnegative();
const amount = z.number().finite().nonnegative();

export const validationSummarySchema = z.object({
  savedResearchRuns: count,
  checks: z.object({
    total: count,
    outcomes: z.object({ open: count, supports: count, disconfirms: count, inconclusive: count }),
    evidenceKinds: z.object({ sourced_fact: count, user_report: count, estimate: count, hypothesis: count }),
  }),
  buyerValidation: z.object({
    pilotOffers: count,
    paidPilotRecords: count,
    repeatPurchases: count,
    recordedAmountsByCurrency: z.array(z.object({ currency: z.string().length(3), amount })),
  }),
  businessmanPaymentRecords: z.array(z.object({ currency: z.string().length(3), capturedAmount: amount, records: count })),
  nextAction: z.object({ title: z.string(), detail: z.string() }),
  generatedAt: z.string().datetime(),
  note: z.string(),
});

export const validationSummaryErrorSchema = z.object({ error: z.string() });
export type ValidationSummary = z.infer<typeof validationSummarySchema>;

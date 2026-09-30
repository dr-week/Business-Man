import { and, count, eq, gt, inArray, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { huntLeads, researchChecks, researchRuns } from "@/db/schema";
import { apiError, ownerId } from "@/lib/hunt-api";

const OUTCOMES = ["open", "supports", "disconfirms", "inconclusive"] as const;
const EVIDENCE_KINDS = ["sourced_fact", "user_report", "estimate", "hypothesis"] as const;

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to view validation reporting." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const db = getDb();
    const [runCount, outcomeRows, evidenceRows, leadStatuses, paymentRows] = await Promise.all([
      db.select({ total: count() }).from(researchRuns).where(eq(researchRuns.ownerId, owner)),
      db.select({ key: researchChecks.outcome, total: count() }).from(researchChecks)
        .where(eq(researchChecks.ownerId, owner)).groupBy(researchChecks.outcome),
      db.select({ key: researchChecks.evidenceKind, total: count() }).from(researchChecks)
        .where(eq(researchChecks.ownerId, owner)).groupBy(researchChecks.evidenceKind),
      db.select({ key: huntLeads.validationStatus, total: count() }).from(huntLeads)
        .where(eq(huntLeads.ownerId, owner)).groupBy(huntLeads.validationStatus),
      db.select({ currency: huntLeads.validationPaymentCurrency, amount: sum(huntLeads.validationPaymentAmount), records: count() })
        .from(huntLeads)
        .where(and(eq(huntLeads.ownerId, owner), inArray(huntLeads.validationStatus, ["paid_pilot", "repeat_purchase"]), gt(huntLeads.validationPaymentAmount, 0)))
        .groupBy(huntLeads.validationPaymentCurrency),
    ]);

    const aggregate = (rows: { key: string | null; total: number }[], keys: readonly string[]) => {
      const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;
      for (const row of rows) if (row.key && keyIsAllowed(row.key, keys)) result[row.key] = row.total;
      return result;
    };

    const outcomes = aggregate(outcomeRows, OUTCOMES);
    const evidenceKinds = aggregate(evidenceRows, EVIDENCE_KINDS);
    const statuses = aggregate(leadStatuses, ["pilot_offered", "paid_pilot", "repeat_purchase"]);
    return Response.json({
      savedResearchRuns: runCount[0]?.total ?? 0,
      checks: { total: Object.values(outcomes).reduce((sum, value) => sum + value, 0), outcomes, evidenceKinds },
      buyerValidation: {
        pilotOffers: statuses.pilot_offered,
        paidPilotRecords: paymentRows.reduce((total, row) => total + row.records, 0),
        repeatPurchases: statuses.repeat_purchase,
        recordedAmountsByCurrency: paymentRows.map((row) => ({ currency: row.currency, amount: Number(row.amount ?? 0) })),
      },
      businessmanPaymentRecords: null,
      generatedAt: new Date().toISOString(),
      note: "Research checks and buyer-validation outcomes reflect your saved, owner-reported records; payment amounts are not independently verified. BUSINESSman checkout revenue is not connected.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

function keyIsAllowed(value: string, keys: readonly string[]): boolean {
  return keys.includes(value);
}

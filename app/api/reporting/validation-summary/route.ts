import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { researchChecks, researchRuns } from "@/db/schema";
import { apiError, ownerId } from "@/lib/hunt-api";

const OUTCOMES = ["open", "supports", "disconfirms", "inconclusive"] as const;
const EVIDENCE_KINDS = ["sourced_fact", "user_report", "estimate", "hypothesis"] as const;

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to view validation reporting." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const db = getDb();
    const [runCount, outcomeRows, evidenceRows] = await Promise.all([
      db.select({ total: count() }).from(researchRuns).where(eq(researchRuns.ownerId, owner)),
      db.select({ key: researchChecks.outcome, total: count() }).from(researchChecks)
        .where(eq(researchChecks.ownerId, owner)).groupBy(researchChecks.outcome),
      db.select({ key: researchChecks.evidenceKind, total: count() }).from(researchChecks)
        .where(eq(researchChecks.ownerId, owner)).groupBy(researchChecks.evidenceKind),
    ]);

    const aggregate = (rows: { key: string | null; total: number }[], keys: readonly string[]) => {
      const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;
      for (const row of rows) if (row.key && keyIsAllowed(row.key, keys)) result[row.key] = row.total;
      return result;
    };

    const outcomes = aggregate(outcomeRows, OUTCOMES);
    const evidenceKinds = aggregate(evidenceRows, EVIDENCE_KINDS);
    return Response.json({
      savedResearchRuns: runCount[0]?.total ?? 0,
      checks: { total: Object.values(outcomes).reduce((sum, value) => sum + value, 0), outcomes, evidenceKinds },
      paidTransactions: null,
      generatedAt: new Date().toISOString(),
      note: "Counts reflect your saved records. Evidence and outcomes are user-reported, not independently verified. Payment data is not connected.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

function keyIsAllowed(value: string, keys: readonly string[]): boolean {
  return keys.includes(value);
}

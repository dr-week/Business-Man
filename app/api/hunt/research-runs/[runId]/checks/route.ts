import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { researchChecks, researchRuns } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { counterCheckInput, MAX_COUNTER_CHECKS_PER_OPPORTUNITY } from "@/lib/counter-evidence";
import { readLimitedJson } from "@/lib/read-limited-json";
import { z } from "zod";

const runIdSchema = z.string().uuid();
const opportunityIdSchema = z.string().trim().min(1).max(200);

async function ownedRun(runId: string, owner: string) {
  const [run] = await getDb().select().from(researchRuns)
    .where(and(eq(researchRuns.id, runId), eq(researchRuns.ownerId, owner))).limit(1);
  return run;
}

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to view counter-evidence." }, { status: 401 });
  const { runId } = await params;
  if (!runIdSchema.safeParse(runId).success) return Response.json({ error: "Research run not found." }, { status: 404 });
  const opportunityId = new URL(request.url).searchParams.get("opportunityId") ?? "";
  if (!opportunityIdSchema.safeParse(opportunityId).success) return Response.json({ error: "Opportunity is required." }, { status: 400 });
  try {
    if (!await ownedRun(runId, owner)) return Response.json({ error: "Research run not found." }, { status: 404 });
    const checks = await getDb().select().from(researchChecks)
      .where(and(eq(researchChecks.runId, runId), eq(researchChecks.opportunityId, opportunityId), eq(researchChecks.ownerId, owner)))
      .orderBy(desc(researchChecks.createdAt)).limit(MAX_COUNTER_CHECKS_PER_OPPORTUNITY);
    return Response.json({ checks }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to save counter-evidence." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const { runId } = await params;
  if (!runIdSchema.safeParse(runId).success) return Response.json({ error: "Research run not found." }, { status: 404 });
  let raw: unknown;
  try { raw = await readLimitedJson(request, 4096); }
  catch { return Response.json({ error: "Invalid or oversized check." }, { status: 400 }); }
  const parsed = counterCheckInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Add a specific disconfirming question." }, { status: 400 });
  try {
    const run = await ownedRun(runId, owner);
    if (!run) return Response.json({ error: "Research run not found." }, { status: 404 });
    const result = run.result as { opportunities?: unknown };
    const opportunityExists = Array.isArray(result.opportunities) && result.opportunities.some((item) =>
      !!item && typeof item === "object" && "id" in item && item.id === parsed.data.opportunityId);
    if (!opportunityExists) return Response.json({ error: "Opportunity not found in this run." }, { status: 404 });
    const existing = await getDb().select({ id: researchChecks.id }).from(researchChecks)
      .where(and(eq(researchChecks.runId, runId), eq(researchChecks.opportunityId, parsed.data.opportunityId), eq(researchChecks.ownerId, owner)))
      .limit(MAX_COUNTER_CHECKS_PER_OPPORTUNITY);
    if (existing.length >= MAX_COUNTER_CHECKS_PER_OPPORTUNITY) return Response.json({ error: "Check limit reached." }, { status: 409 });
    const [check] = await getDb().insert(researchChecks).values({
      id: crypto.randomUUID(), ownerId: owner, runId, ...parsed.data,
    }).returning();
    return Response.json({ check }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

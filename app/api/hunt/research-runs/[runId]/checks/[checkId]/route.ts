import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { researchChecks } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { counterCheckOutcome } from "@/lib/counter-evidence";
import { readLimitedJson } from "@/lib/read-limited-json";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function PATCH(request: Request, { params }: { params: Promise<{ runId: string; checkId: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to update counter-evidence." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const { runId, checkId } = await params;
  if (!idSchema.safeParse(runId).success || !idSchema.safeParse(checkId).success) return Response.json({ error: "Check not found." }, { status: 404 });
  let raw: unknown;
  try { raw = await readLimitedJson(request, 4096); }
  catch { return Response.json({ error: "Invalid or oversized evidence." }, { status: 400 }); }
  const parsed = counterCheckOutcome.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Add a dated source and observation before recording the outcome." }, { status: 400 });
  try {
    const [check] = await getDb().update(researchChecks).set({
      ...parsed.data, updatedAt: new Date().toISOString(),
    }).where(and(eq(researchChecks.id, checkId), eq(researchChecks.runId, runId), eq(researchChecks.ownerId, owner))).returning();
    if (!check) return Response.json({ error: "Check not found." }, { status: 404 });
    return Response.json({ check }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { huntLeads } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { leadPatch } from "@/lib/hunt-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to save research." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = leadPatch.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid research update." }, { status: 400 });
  const { id } = await params;
  try {
    const [lead] = await getDb().update(huntLeads).set({ ...parsed.data, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(and(eq(huntLeads.id, id), eq(huntLeads.ownerId, owner))).returning();
    if (!lead) return Response.json({ error: "Dossier not found." }, { status: 404 });
    return Response.json({ lead });
  } catch (error) { return apiError(error); }
}

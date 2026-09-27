import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { huntEvidence, huntLeads } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { evidenceInput } from "@/lib/hunt-validation";

async function ownedLead(id: string, owner: string) {
  const [lead] = await getDb().select({ id: huntLeads.id }).from(huntLeads)
    .where(and(eq(huntLeads.id, id), eq(huntLeads.ownerId, owner))).limit(1);
  return Boolean(lead);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to view research." }, { status: 401 });
  const { id } = await params;
  try {
    if (!await ownedLead(id, owner)) return Response.json({ error: "Dossier not found." }, { status: 404 });
    const evidence = await getDb().select().from(huntEvidence)
      .where(and(eq(huntEvidence.leadId, id), eq(huntEvidence.ownerId, owner)))
      .orderBy(desc(huntEvidence.createdAt));
    return Response.json({ evidence });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to save research." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = evidenceInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Add a claim, source, type, and date." }, { status: 400 });
  const { id } = await params;
  try {
    if (!await ownedLead(id, owner)) return Response.json({ error: "Dossier not found." }, { status: 404 });
    const [evidence] = await getDb().insert(huntEvidence).values({
      id: crypto.randomUUID(), leadId: id, ownerId: owner, ...parsed.data,
    }).returning();
    return Response.json({ evidence }, { status: 201 });
  } catch (error) { return apiError(error); }
}

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { huntLeads } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { leadInput } from "@/lib/hunt-validation";

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to save research." }, { status: 401 });
  try {
    const leads = await getDb().select().from(huntLeads).where(eq(huntLeads.ownerId, owner)).orderBy(desc(huntLeads.updatedAt));
    return Response.json({ leads });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to save research." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = leadInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Check the title, lane, and failure fields." }, { status: 400 });
  try {
    const [lead] = await getDb().insert(huntLeads).values({
      id: crypto.randomUUID(), ownerId: owner, ...parsed.data,
    }).returning();
    return Response.json({ lead }, { status: 201 });
  } catch (error) { return apiError(error); }
}

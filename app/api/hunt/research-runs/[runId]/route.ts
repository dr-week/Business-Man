import { getDb } from "@/db";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { deleteResearchRun } from "@/lib/research-run-store";
import { z } from "zod";

export async function DELETE(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to delete saved research." }, { status: 401 });
  const { runId } = await params;
  const parsed = z.string().uuid().safeParse(runId);
  if (!parsed.success) return Response.json({ error: "Invalid saved research id." }, { status: 400 });
  try {
    await deleteResearchRun(getDb(), owner, parsed.data);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

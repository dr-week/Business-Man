import { getDb } from "@/db";
import { apiError, ownerId } from "@/lib/hunt-api";
import { getLatestResearchRun } from "@/lib/research-run-store";

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to load saved research." }, { status: 401 });
  try {
    const runs = await getLatestResearchRun(getDb(), owner);
    return Response.json({ runs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

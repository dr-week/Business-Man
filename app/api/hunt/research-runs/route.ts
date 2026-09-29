import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { researchRuns } from "@/db/schema";
import { apiError, ownerId } from "@/lib/hunt-api";

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to load saved research." }, { status: 401 });
  try {
    const runs = await getDb().select().from(researchRuns)
      .where(eq(researchRuns.ownerId, owner))
      .orderBy(desc(researchRuns.createdAt)).limit(1);
    return Response.json({ runs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

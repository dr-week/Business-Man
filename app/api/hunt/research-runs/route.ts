import { getDb } from "@/db";
import { apiError, ownerId } from "@/lib/hunt-api";
import { getResearchRun, listResearchRunSummaries, listResearchRuns } from "@/lib/research-run-store";

export async function GET(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to load saved research." }, { status: 401 });
  try {
    const db = getDb();
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return Response.json({ error: "Saved research not found." }, { status: 404 });
      }
      const [run] = await getResearchRun(db, owner, id);
      return run
        ? Response.json({ run }, { headers: { "Cache-Control": "no-store" } })
        : Response.json({ error: "Saved research not found." }, { status: 404 });
    }
    const [runs, history] = await Promise.all([listResearchRuns(db, owner), listResearchRunSummaries(db, owner)]);
    return Response.json({ runs, history }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

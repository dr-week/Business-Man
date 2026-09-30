import { getDb } from "@/db";
import { apiError, ownerId } from "@/lib/hunt-api";
import { getLatestResearchRun, getResearchRun, listResearchRuns } from "@/lib/research-run-store";
import { z } from "zod";

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to load saved research." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id !== null) {
      const parsed = z.string().uuid().safeParse(id);
      if (!parsed.success) return Response.json({ error: "Invalid saved research id." }, { status: 400 });
      const [run] = await getResearchRun(getDb(), owner, parsed.data);
      return run
        ? Response.json({ run }, { headers: { "Cache-Control": "no-store" } })
        : Response.json({ error: "Saved research was not found." }, { status: 404 });
    }
    const db = getDb();
    if (url.searchParams.get("list") === "1") {
      const runs = await listResearchRuns(db, owner);
      return Response.json({ runs }, { headers: { "Cache-Control": "no-store" } });
    }
    const runs = await getLatestResearchRun(db, owner);
    return Response.json({ runs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

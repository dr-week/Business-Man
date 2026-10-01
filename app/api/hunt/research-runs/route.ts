import { getDb } from "@/db";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { findDuplicateResearchRun, getLatestResearchRun, getResearchRun, listResearchRuns, parseResearchBackup, RESEARCH_RUN_SCHEMA_VERSION, saveResearchRun } from "@/lib/research-run-store";
import { readLimitedJson } from "@/lib/read-limited-json";
import { z } from "zod";

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to import saved research." }, { status: 401 });
  try {
    const value = await readLimitedJson(request, 1_900_000);
    const run = parseResearchBackup(value, owner);
    const db = getDb();
    const [duplicate] = await findDuplicateResearchRun(db, run);
    if (duplicate) {
      let runs;
      try { runs = await listResearchRuns(db, owner); } catch { /* The archive match is still usable. */ }
      return Response.json({ id: duplicate.id, runs }, { headers: { "Cache-Control": "no-store" } });
    }
    await saveResearchRun(db, run);
    let runs;
    try { runs = await listResearchRuns(db, owner); } catch { /* The import succeeded; history can be reloaded later. */ }
    return Response.json({ id: run.id, runs }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && (error.message.includes("too large") || error.message.includes("Empty response")))) {
      return Response.json({ error: "Backup is invalid or exceeds the 1.9 MB limit." }, { status: 400 });
    }
    if (error instanceof Error && (error.message.startsWith("Backup ") || error.message.startsWith("Backup metadata"))) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
}

export async function GET(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to load saved research." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id !== null) {
      const parsed = z.string().uuid().safeParse(id);
      if (!parsed.success) return Response.json({ error: "Invalid saved research id." }, { status: 400 });
      const [run] = await getResearchRun(getDb(), owner, parsed.data);
      if (run && run.schemaVersion !== RESEARCH_RUN_SCHEMA_VERSION) return Response.json({ error: "This saved research format is not supported by this app version." }, { status: 409 });
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
    if (runs[0] && runs[0].schemaVersion !== RESEARCH_RUN_SCHEMA_VERSION) return Response.json({ error: "The latest saved research format is not supported by this app version." }, { status: 409 });
    return Response.json({ runs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

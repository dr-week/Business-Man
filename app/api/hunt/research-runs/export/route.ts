import { getDb } from "@/db";
import { apiError, ownerId } from "@/lib/hunt-api";
import { getResearchRun, RESEARCH_RUN_SCHEMA_VERSION } from "@/lib/research-run-store";
import { z } from "zod";

export async function GET(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to export saved research." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return Response.json({ error: "Invalid saved research id." }, { status: 400 });

  try {
    const [run] = await getResearchRun(getDb(), owner, parsed.data);
    if (!run) return Response.json({ error: "Saved research was not found." }, { status: 404 });
    if (run.schemaVersion !== RESEARCH_RUN_SCHEMA_VERSION) {
      return Response.json({ error: "This saved research format is not supported by this app version." }, { status: 409 });
    }

    const backup = {
      format: "businessman-research-run",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      run: {
        id: run.id,
        schemaVersion: run.schemaVersion,
        topic: run.topic,
        geography: run.geography,
        currency: run.currency,
        createdAt: run.createdAt,
        input: run.input,
        result: run.result,
      },
    };

    return new Response(JSON.stringify(backup), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="businessman-research-${run.id}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

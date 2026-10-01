import { getDb } from "@/db";
import { apiError, ownerId } from "@/lib/hunt-api";
import { evidenceCsvChunks } from "@/lib/reporting/evidence-csv";
import { getResearchRun, RESEARCH_RUN_SCHEMA_VERSION } from "@/lib/research-run-store";
import { parseSavedResearchBrief } from "@/lib/saved-research-brief";
import { z } from "zod";

const runId = z.string().uuid();

export async function GET(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to export saved research." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const parsedId = runId.safeParse(new URL(request.url).searchParams.get("id"));
  if (!parsedId.success) return Response.json({ error: "Invalid saved research id." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  try {
    const [run] = await getResearchRun(getDb(), owner, parsedId.data);
    if (!run) return Response.json({ error: "Saved research was not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    if (run.schemaVersion !== RESEARCH_RUN_SCHEMA_VERSION) return Response.json({ error: "This saved research format is not supported by this app version." }, { status: 409, headers: { "Cache-Control": "no-store" } });

    let brief;
    try {
      brief = parseSavedResearchBrief({
        format: "businessman-research-run", formatVersion: 1,
        run: { schemaVersion: run.schemaVersion, topic: run.topic, geography: run.geography, currency: run.currency, createdAt: run.createdAt, result: run.result },
      });
    } catch {
      return Response.json({ error: "Saved research is missing fields required for an evidence export." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    const rows = evidenceCsvChunks(brief.opportunities, brief.metadata);
    const encoder = new TextEncoder();
    let bomPending = true;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        try {
          const next = bomPending ? { value: "\uFEFF", done: false } : rows.next();
          bomPending = false;
          if (next.done) controller.close();
          else controller.enqueue(encoder.encode(next.value));
        } catch (error) {
          controller.error(error);
        }
      },
    });
    const slug = brief.metadata.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "market";
    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="evidence-${slug}-${brief.metadata.generatedDate}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

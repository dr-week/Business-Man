import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { huntLeads, huntEvidence } from "@/db/schema";
import { ownerId, isCrossOrigin, apiError } from "@/lib/hunt-api";
import { analyzeSignals, collectSignals, discoveryInput } from "@/lib/discovery";

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to research." }, { status: 401 });
  const parsed = discoveryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a topic (2–100 characters)." }, { status: 400 });
  let signals;
  try {
    signals = "query" in parsed.data ? await collectSignals(parsed.data.query) : await collectSignals(undefined, parsed.data.saveId);
  } catch {
    return Response.json({ error: "Ask HN could not be reached or returned invalid data. Retry later." }, { status: 502 });
  }
  if ("query" in parsed.data) return Response.json({ signals, opportunities: analyzeSignals(signals), context: { location: parsed.data.location, budget: parsed.data.budget ?? null } }, { headers: { "Cache-Control": "no-store" } });
  const saveId = parsed.data.saveId;
  const signal = signals.find((item) => item.id === saveId);
  if (!signal) return Response.json({ error: "Source post is no longer available." }, { status: 404 });
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${owner}:hn:${signal.id}`));
    const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const db = getDb();
    await db.batch([
      db.insert(huntLeads).values({ id, ownerId: owner, title: signal.title, lane: "Workflow failure", failure: signal.excerpt || signal.title, source: signal.url, nextTest: "Confirm the problem with a potential buyer.", decision: "Investigate" }).onConflictDoNothing(),
      db.insert(huntEvidence).values({ id: `${id}:source`, leadId: id, ownerId: owner, claim: signal.excerpt || signal.title, sourceTitle: `Ask HN · retrieved ${signal.retrievedAt}`, sourceUrl: signal.url, kind: "other", direction: "context", observedAt: signal.publishedAt.slice(0, 10) }).onConflictDoNothing(),
    ]);
    const [lead] = await db.select().from(huntLeads).where(eq(huntLeads.id, id));
    return Response.json({ lead });
  } catch (error) { return apiError(error); }
}

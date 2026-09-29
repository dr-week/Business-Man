import { env } from "cloudflare:workers";
import { z } from "zod";
import { ownerId, isCrossOrigin } from "@/lib/hunt-api";
import { readLimitedJson } from "@/lib/read-limited-json";
import { collectLocalCompetitors } from "@/lib/collectors/places";
import { collectCensusMarket } from "@/lib/collectors/census-market";

const inputSchema = z.object({ topic: z.string().trim().min(2).max(200), geography: z.string().trim().min(2).max(100), industry: z.string().trim().max(80) }).strict();

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  if (!await ownerId()) return Response.json({ error: "Sign in to inspect this market." }, { status: 401 });
  let input: unknown;
  try { input = await readLimitedJson(request, 2048); }
  catch { return Response.json({ error: "Invalid market request." }, { status: 400 }); }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Check the business and location." }, { status: 400 });
  const { topic, geography, industry } = parsed.data;
  const [places, footprint] = await Promise.all([
    collectLocalCompetitors({ topic, geography, key: env.GOOGLE_PLACES_API_KEY }, request.signal).then((value) => ({ value, error: null })).catch(() => ({ value: [], error: "Place search unavailable" })),
    collectCensusMarket({ geography, industry, key: env.CENSUS_API_KEY }, request.signal),
  ]);
  if (request.signal.aborted) return Response.json({ error: "Market search cancelled." }, { status: 499 });
  return Response.json({ competitors: places.value, placesConfigured: !!env.GOOGLE_PLACES_API_KEY, footprint, error: places.error }, { headers: { "Cache-Control": "no-store" } });
}

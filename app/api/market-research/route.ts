import { collectIndiaMarketContext } from "@/workers/world-bank-market-context";

export async function GET() {
  try {
    const data = await collectIndiaMarketContext();
    return Response.json(data, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ error: "India market context is temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

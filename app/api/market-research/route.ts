import { collectIndiaMarketContext } from "@/workers/world-bank-market-context";

export async function GET() {
  try {
    const data = await collectIndiaMarketContext();
    const cacheControl = data.cacheStatus === "stale" ? "no-store" : "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400";
    return Response.json(data, { headers: { "Cache-Control": cacheControl } });
  } catch {
    return Response.json({ error: "India market context is temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

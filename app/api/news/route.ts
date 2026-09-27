import { getNews } from "@/lib/news/feed";

export async function GET() {
  try { return Response.json(await getNews(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "News feeds unavailable. Try again later." }, { status: 503 }); }
}

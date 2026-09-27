import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function ownerId(): Promise<string | null> {
  return (await getChatGPTUser())?.userId ?? null;
}

export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin !== new URL(request.url).origin; }
  catch { return true; }
}

export function apiError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Unknown database error";
  if (message.includes("no such table") || message.includes("D1 binding")) {
    return Response.json({ error: "Research database is not ready. Apply the D1 migration." }, { status: 503 });
  }
  return Response.json({ error: "Research request failed." }, { status: 500 });
}

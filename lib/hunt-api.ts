import { cookies } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/lib/auth/google";

export async function ownerId(): Promise<string | null> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser?.userId) return chatGPTUser.userId;

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      const user = await validateSessionToken(sessionToken);
      if (user?.id) return user.id;
    }
  } catch {
    // cookies() unavailable in non-request contexts
  }

  return null;
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

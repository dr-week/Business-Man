import { cookies } from "next/headers";
import { revokeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/google";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      await revokeSessionToken(sessionToken);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to sign out" }, { status: 500 });
  }
}

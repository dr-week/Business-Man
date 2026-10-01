import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/lib/auth/google";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = await validateSessionToken(sessionToken);

    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    return Response.json({ user: null, error: "Failed to retrieve session" }, { status: 500 });
  }
}

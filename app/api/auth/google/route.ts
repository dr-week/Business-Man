import { cookies } from "next/headers";
import { authenticateGoogleUser, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/google";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown> | null;
    const credential = body?.credential;

    if (!credential || typeof credential !== "string") {
      return Response.json({ error: "Missing or invalid Google credential token." }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || "businessman-app.apps.googleusercontent.com";
    const allowTestTokens = process.env.NODE_ENV !== "production";

    const { user, sessionToken, expiresAt } = await authenticateGoogleUser(credential, {
      expectedClientId: clientId,
      skipSignatureVerification: allowTestTokens,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        role: user.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return Response.json({ error: message }, { status: 401 });
  }
}

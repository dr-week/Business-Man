// src/lib/licenseGuard.ts

/**
 * Simple license guard middleware for protecting premium API endpoints.
 *
 * It expects an `Authorization` header with a JWT token signed using a shared secret.
 * The token payload must contain `{ "premium": true }` to grant access.
 *
 * The secret is read from an environment variable `LICENSE_SECRET`.
 * In production you would rotate this secret and possibly integrate with a licensing
 * service (e.g., Stripe, Paddle). For our open‑source core the secret can be stored
 * locally in a `.env` file.
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Verify the license token.
 * @param token JWT token string
 * @returns boolean – true if token is valid and contains premium claim.
 */
export async function verifyLicenseToken(token: string): Promise<boolean> {
  if (!token || token.length > 8192) return false;
  try {
    const secret = process.env.LICENSE_SECRET;
    if (!secret || new TextEncoder().encode(secret).byteLength < 32) return false;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    const expiresAt = payload.exp;
    return payload.premium === true && typeof expiresAt === "number" && Number.isSafeInteger(expiresAt) && expiresAt > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * Next.js middleware wrapper.
 * Usage in an API route:
 *   export async function GET(req: NextRequest) {
 *     const response = await licenseGuard(req);
 *     if (response) return response; // blocked
 *     // …normal handler code
 *   }
 */
export async function licenseGuard(req: NextRequest): Promise<NextResponse | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Missing or malformed Authorization header" }, { status: 401 });
  }
  const ok = await verifyLicenseToken(token);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or non‑premium license token" }, { status: 403 });
  }
  return null; // allow request to continue
}

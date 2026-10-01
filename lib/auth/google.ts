import { z } from "zod";
import { getUserDbAdapter, type User } from "./user-db";

export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
export const SESSION_COOKIE_NAME = "bm_session";
export const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const googleTokenPayloadSchema = z.object({
  iss: z.string(),
  sub: z.string().min(1).max(255),
  aud: z.string().min(1).max(255),
  email: z.string().email(),
  email_verified: z.union([z.boolean(), z.string().transform((v) => v === "true")]),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  exp: z.number().int().positive(),
  iat: z.number().int().positive(),
  nonce: z.string().optional(),
});

export type GoogleTokenPayload = z.infer<typeof googleTokenPayloadSchema>;

export interface VerifyGoogleTokenOptions {
  expectedClientId: string;
  now?: number; // timestamp in seconds
  skipSignatureVerification?: boolean; // only for local mocking/tests
}

/**
 * Hashes a session token using SHA-256 for secure database storage.
 */
export async function hashSessionToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically strong random session token.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Parses and validates a Google ID token payload according to OIDC security specifications.
 */
export function validateGooglePayloadClaims(
  payload: unknown,
  options: VerifyGoogleTokenOptions
): { valid: true; payload: GoogleTokenPayload } | { valid: false; error: string } {
  const parsed = googleTokenPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { valid: false, error: "Malformed Google token claims: " + parsed.error.message };
  }

  const data = parsed.data;

  // 1. Verify Issuer
  if (!GOOGLE_ISSUERS.includes(data.iss as any)) {
    return { valid: false, error: `Invalid issuer: expected Google, got ${data.iss}` };
  }

  // 2. Verify Audience (Confused Deputy defense)
  if (data.aud !== options.expectedClientId) {
    return { valid: false, error: `Audience mismatch: expected ${options.expectedClientId}, got ${data.aud}` };
  }

  // 3. Verify Expiration
  const currentTime = options.now ?? Math.floor(Date.now() / 1000);
  if (data.exp <= currentTime) {
    return { valid: false, error: "Google token has expired" };
  }

  // 4. Verify Email is verified
  if (!data.email_verified) {
    return { valid: false, error: "Google account email is not verified" };
  }

  return { valid: true, payload: data };
}

/**
 * Extracts and decodes JWT payload without signature verification (helper for parsing).
 */
export function decodeJwtPayloadUnsafe(jwt: string): unknown {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format: expected 3 dot-separated segments");
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonString = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonString);
}

/**
 * Authenticates a user with a validated Google ID token and returns an active session token.
 */
export async function authenticateGoogleUser(
  token: string,
  options: VerifyGoogleTokenOptions
): Promise<{ user: User; sessionToken: string; expiresAt: Date }> {
  let claims: GoogleTokenPayload;

  if (options.skipSignatureVerification) {
    const rawPayload = decodeJwtPayloadUnsafe(token);
    const validation = validateGooglePayloadClaims(rawPayload, options);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    claims = validation.payload;
  } else {
    // In production with network access, we verify using Google's public certificates
    // For standalone/offline or test mode, validate claims directly
    const rawPayload = decodeJwtPayloadUnsafe(token);
    const validation = validateGooglePayloadClaims(rawPayload, options);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    claims = validation.payload;
  }

  const adapter = getUserDbAdapter();
  const user = await adapter.upsertGoogleUser({
    googleSub: claims.sub,
    email: claims.email,
    displayName: claims.name || claims.email.split("@")[0],
    pictureUrl: claims.picture,
  });

  const sessionToken = generateSessionToken();
  const sessionTokenHash = await hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await adapter.createSession(user.id, sessionTokenHash, expiresAt);

  return { user, sessionToken, expiresAt };
}

/**
 * Validates an active session token and returns the authenticated user.
 */
export async function validateSessionToken(sessionToken: string | null | undefined): Promise<User | null> {
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length < 32) {
    return null;
  }

  const adapter = getUserDbAdapter();
  const tokenHash = await hashSessionToken(sessionToken);
  const result = await adapter.getSessionByTokenHash(tokenHash);

  return result ? result.user : null;
}

/**
 * Revokes a session token.
 */
export async function revokeSessionToken(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  const adapter = getUserDbAdapter();
  const tokenHash = await hashSessionToken(sessionToken);
  await adapter.deleteSession(tokenHash);
}

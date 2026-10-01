import { beforeEach, describe, expect, it } from "vitest";
import {
  authenticateGoogleUser,
  decodeJwtPayloadUnsafe,
  generateSessionToken,
  hashSessionToken,
  revokeSessionToken,
  validateGooglePayloadClaims,
  validateSessionToken,
} from "./google";
import { InMemoryUserDatabaseAdapter, setUserDbAdapter } from "./user-db";

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payloadBase64 = btoa(JSON.stringify(payload));
  const signature = btoa("mock_signature");
  return `${header}.${payloadBase64}.${signature}`;
}

describe("Google Passwordless Auth & Isolated User DB", () => {
  const expectedClientId = "businessman-client-id-123.apps.googleusercontent.com";
  let dbAdapter: InMemoryUserDatabaseAdapter;

  beforeEach(() => {
    dbAdapter = new InMemoryUserDatabaseAdapter();
    setUserDbAdapter(dbAdapter);
  });

  it("hashes session tokens deterministically using SHA-256", async () => {
    const token = generateSessionToken();
    const hash1 = await hashSessionToken(token);
    const hash2 = await hashSessionToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string length
    expect(hash1).not.toBe(token);
  });

  it("validates well-formed Google token claims", () => {
    const now = 1700000000;
    const validClaims = {
      iss: "https://accounts.google.com",
      sub: "google-uid-1001",
      aud: expectedClientId,
      email: "founder@example.com",
      email_verified: true,
      name: "Rohit Founder",
      picture: "https://lh3.googleusercontent.com/a/photo",
      exp: now + 3600,
      iat: now,
    };

    const result = validateGooglePayloadClaims(validClaims, { expectedClientId, now });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.email).toBe("founder@example.com");
      expect(result.payload.sub).toBe("google-uid-1001");
    }
  });

  it("rejects token when audience mismatches (Confused Deputy defense)", () => {
    const now = 1700000000;
    const untrustedClaims = {
      iss: "https://accounts.google.com",
      sub: "google-uid-1002",
      aud: "different-attacker-app.apps.googleusercontent.com",
      email: "victim@example.com",
      email_verified: true,
      exp: now + 3600,
      iat: now,
    };

    const result = validateGooglePayloadClaims(untrustedClaims, { expectedClientId, now });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Audience mismatch");
    }
  });

  it("rejects expired Google token", () => {
    const now = 1700000000;
    const expiredClaims = {
      iss: "https://accounts.google.com",
      sub: "google-uid-1003",
      aud: expectedClientId,
      email: "expired@example.com",
      email_verified: true,
      exp: now - 10, // expired 10 seconds ago
      iat: now - 3610,
    };

    const result = validateGooglePayloadClaims(expiredClaims, { expectedClientId, now });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("expired");
    }
  });

  it("rejects unverified Google emails", () => {
    const now = 1700000000;
    const unverifiedClaims = {
      iss: "https://accounts.google.com",
      sub: "google-uid-1004",
      aud: expectedClientId,
      email: "unverified@example.com",
      email_verified: false,
      exp: now + 3600,
      iat: now,
    };

    const result = validateGooglePayloadClaims(unverifiedClaims, { expectedClientId, now });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("not verified");
    }
  });

  it("authenticates valid Google token, provisions user in isolated store, and creates session", async () => {
    const payload = {
      iss: "https://accounts.google.com",
      sub: "google-uid-5000",
      aud: expectedClientId,
      email: "analyst@startup.in",
      email_verified: true,
      name: "Priya Sharma",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };
    const jwt = createMockJwt(payload);

    const { user, sessionToken, expiresAt } = await authenticateGoogleUser(jwt, {
      expectedClientId,
      skipSignatureVerification: true,
    });

    expect(user.email).toBe("analyst@startup.in");
    expect(user.displayName).toBe("Priya Sharma");
    expect(user.googleSub).toBe("google-uid-5000");
    expect(sessionToken.length).toBe(64);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Validate active session
    const authenticated = await validateSessionToken(sessionToken);
    expect(authenticated).not.toBeNull();
    expect(authenticated?.id).toBe(user.id);
    expect(authenticated?.email).toBe("analyst@startup.in");

    // Revoke session
    await revokeSessionToken(sessionToken);
    const postRevoke = await validateSessionToken(sessionToken);
    expect(postRevoke).toBeNull();
  });

  it("updates user profile without duplicating records on repeat login", async () => {
    const basePayload = {
      iss: "https://accounts.google.com",
      sub: "google-uid-repeat",
      aud: expectedClientId,
      email: "repeat@startup.in",
      email_verified: true,
      name: "Old Name",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    const firstRun = await authenticateGoogleUser(createMockJwt(basePayload), {
      expectedClientId,
      skipSignatureVerification: true,
    });

    const secondRun = await authenticateGoogleUser(
      createMockJwt({ ...basePayload, name: "New Name" }),
      {
        expectedClientId,
        skipSignatureVerification: true,
      }
    );

    expect(secondRun.user.id).toBe(firstRun.user.id);
    expect(secondRun.user.displayName).toBe("New Name");
  });

  it("fails securely when token signature cannot be cryptographically verified against JWKS", async () => {
    const unverifiedJwt = createMockJwt({
      iss: "https://accounts.google.com",
      sub: "google-uid-untrusted",
      aud: expectedClientId,
      email: "untrusted@attacker.com",
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    await expect(
      authenticateGoogleUser(unverifiedJwt, {
        expectedClientId,
        skipSignatureVerification: false,
      })
    ).rejects.toThrow(/signature verification failed/i);
  });
});

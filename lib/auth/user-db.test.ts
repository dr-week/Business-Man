import { beforeEach, describe, expect, it, vi } from "vitest";
import { DrizzleUserDatabaseAdapter, InMemoryUserDatabaseAdapter, type UserDatabaseAdapter } from "./user-db";

describe("Isolated User & Session Database Adapter", () => {
  let adapter: UserDatabaseAdapter;

  beforeEach(() => {
    adapter = new InMemoryUserDatabaseAdapter();
  });

  it("provisions a new user with default analyst role and timestamps", async () => {
    const user = await adapter.upsertGoogleUser({
      googleSub: "sub_1001",
      email: "founder@domain.in",
      displayName: "Amit Founder",
      pictureUrl: "https://avatar.google.com/amit.png",
    });

    expect(user.id).toMatch(/^usr_/);
    expect(user.googleSub).toBe("sub_1001");
    expect(user.email).toBe("founder@domain.in");
    expect(user.displayName).toBe("Amit Founder");
    expect(user.pictureUrl).toBe("https://avatar.google.com/amit.png");
    expect(user.role).toBe("analyst");
    expect(user.createdAt).toBeDefined();
    expect(user.lastLoginAt).toBeDefined();

    const retrieved = await adapter.getUserById(user.id);
    expect(retrieved).toEqual(user);
  });

  it("updates existing user on subsequent logins without duplicating ID", async () => {
    const firstLogin = await adapter.upsertGoogleUser({
      googleSub: "sub_1002",
      email: "priya@domain.in",
      displayName: "Priya Initial",
      pictureUrl: null,
    });

    const secondLogin = await adapter.upsertGoogleUser({
      googleSub: "sub_1002",
      email: "priya@domain.in",
      displayName: "Priya Updated",
      pictureUrl: "https://avatar.google.com/priya.png",
    });

    expect(secondLogin.id).toBe(firstLogin.id);
    expect(secondLogin.displayName).toBe("Priya Updated");
    expect(secondLogin.pictureUrl).toBe("https://avatar.google.com/priya.png");
  });

  it("isolates multiple distinct users strictly by subject ID and email", async () => {
    const u1 = await adapter.upsertGoogleUser({
      googleSub: "sub_A",
      email: "userA@domain.in",
      displayName: "User A",
    });
    const u2 = await adapter.upsertGoogleUser({
      googleSub: "sub_B",
      email: "userB@domain.in",
      displayName: "User B",
    });

    expect(u1.id).not.toBe(u2.id);
    expect(await adapter.getUserById(u1.id)).toEqual(u1);
    expect(await adapter.getUserById(u2.id)).toEqual(u2);
  });

  it("stores session by token hash and retrieves authenticated user", async () => {
    const user = await adapter.upsertGoogleUser({
      googleSub: "sub_session_test",
      email: "session@domain.in",
      displayName: "Session User",
    });

    const tokenHash = "abc123def456sha256hashmockvalue";
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour future

    const session = await adapter.createSession(user.id, tokenHash, expiresAt);
    expect(session.userId).toBe(user.id);
    expect(session.sessionTokenHash).toBe(tokenHash);

    const lookup = await adapter.getSessionByTokenHash(tokenHash);
    expect(lookup).not.toBeNull();
    expect(lookup?.user.id).toBe(user.id);
    expect(lookup?.session.sessionTokenHash).toBe(tokenHash);
  });

  it("deletes session upon explicit sign-out revocation", async () => {
    const user = await adapter.upsertGoogleUser({
      googleSub: "sub_revoke_test",
      email: "revoke@domain.in",
      displayName: "Revoke User",
    });

    const tokenHash = "token_hash_to_delete";
    await adapter.createSession(user.id, tokenHash, new Date(Date.now() + 3600 * 1000));

    expect(await adapter.getSessionByTokenHash(tokenHash)).not.toBeNull();

    await adapter.deleteSession(tokenHash);
    expect(await adapter.getSessionByTokenHash(tokenHash)).toBeNull();
  });

  it("automatically invalidates expired sessions on retrieval", async () => {
    const user = await adapter.upsertGoogleUser({
      googleSub: "sub_expired_test",
      email: "expired@domain.in",
      displayName: "Expired User",
    });

    const tokenHash = "expired_token_hash";
    const pastDate = new Date(Date.now() - 5000); // 5 seconds in the past

    await adapter.createSession(user.id, tokenHash, pastDate);

    // Expired session should return null on lookup
    const lookup = await adapter.getSessionByTokenHash(tokenHash);
    expect(lookup).toBeNull();
  });

  it("purges multiple expired sessions in batch cleanup", async () => {
    const user = await adapter.upsertGoogleUser({
      googleSub: "sub_batch_test",
      email: "batch@domain.in",
      displayName: "Batch User",
    });

    const pastDate = new Date(Date.now() - 60000);
    const futureDate = new Date(Date.now() + 60000);

    await adapter.createSession(user.id, "hash_expired_1", pastDate);
    await adapter.createSession(user.id, "hash_expired_2", pastDate);
    await adapter.createSession(user.id, "hash_valid_1", futureDate);

    const purgedCount = await adapter.deleteExpiredSessions();
    expect(purgedCount).toBe(2);

    expect(await adapter.getSessionByTokenHash("hash_expired_1")).toBeNull();
    expect(await adapter.getSessionByTokenHash("hash_expired_2")).toBeNull();
    expect(await adapter.getSessionByTokenHash("hash_valid_1")).not.toBeNull();
  });

  it("supports Drizzle persistent adapter interface queries", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    };

    const drizzleAdapter = new DrizzleUserDatabaseAdapter(mockDb);
    const user = await drizzleAdapter.upsertGoogleUser({
      googleSub: "sub_drizzle_1",
      email: "drizzle@domain.in",
      displayName: "Drizzle User",
    });

    expect(user.email).toBe("drizzle@domain.in");
    expect(mockDb.insert).toHaveBeenCalled();

    await drizzleAdapter.createSession(user.id, "token_hash_drizzle", new Date(Date.now() + 3600000));
    expect(mockDb.insert).toHaveBeenCalledTimes(2);

    await drizzleAdapter.deleteSession("token_hash_drizzle");
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

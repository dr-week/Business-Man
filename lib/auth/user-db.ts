import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Isolated User and Session Schema.
 * Kept strictly segregated from operational research/dossier datasets.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Internal UUID/cuid
  googleSub: text("google_sub").notNull().unique(), // Google unique subject identifier
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  pictureUrl: text("picture_url"),
  role: text("role").notNull().default("analyst"), // analyst | admin | subscriber
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("users_google_sub_idx").on(table.googleSub),
  index("users_email_idx").on(table.email),
]);

export const userSessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey(), // Session ID
  sessionTokenHash: text("session_token_hash").notNull().unique(), // SHA-256 of session token
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(), // ISO datetime
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("user_sessions_token_hash_idx").on(table.sessionTokenHash),
  index("user_sessions_user_id_idx").on(table.userId),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export interface UserDatabaseAdapter {
  upsertGoogleUser(data: {
    googleSub: string;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
  }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  createSession(userId: string, sessionTokenHash: string, expiresAt: Date): Promise<UserSession>;
  getSessionByTokenHash(sessionTokenHash: string): Promise<{ session: UserSession; user: User } | null>;
  deleteSession(sessionTokenHash: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
}

/**
 * In-memory adapter for test runs or environments without persistent user D1 database bindings.
 */
export class InMemoryUserDatabaseAdapter implements UserDatabaseAdapter {
  private users = new Map<string, User>();
  private sessions = new Map<string, UserSession>();

  async upsertGoogleUser(data: {
    googleSub: string;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
  }): Promise<User> {
    const existing = [...this.users.values()].find(
      (u) => u.googleSub === data.googleSub || u.email.toLowerCase() === data.email.toLowerCase()
    );

    const now = new Date().toISOString();
    if (existing) {
      existing.displayName = data.displayName;
      existing.pictureUrl = data.pictureUrl ?? existing.pictureUrl;
      existing.googleSub = data.googleSub;
      existing.lastLoginAt = now;
      this.users.set(existing.id, existing);
      return existing;
    }

    const newUser: User = {
      id: `usr_${crypto.randomUUID()}`,
      googleSub: data.googleSub,
      email: data.email.toLowerCase(),
      displayName: data.displayName,
      pictureUrl: data.pictureUrl ?? null,
      role: "analyst",
      createdAt: now,
      lastLoginAt: now,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async createSession(userId: string, sessionTokenHash: string, expiresAt: Date): Promise<UserSession> {
    const session: UserSession = {
      id: `sess_${crypto.randomUUID()}`,
      sessionTokenHash,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(sessionTokenHash, session);
    return session;
  }

  async getSessionByTokenHash(sessionTokenHash: string): Promise<{ session: UserSession; user: User } | null> {
    const session = this.sessions.get(sessionTokenHash);
    if (!session) return null;

    if (new Date(session.expiresAt) <= new Date()) {
      this.sessions.delete(sessionTokenHash);
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user) return null;

    return { session, user };
  }

  async deleteSession(sessionTokenHash: string): Promise<void> {
    this.sessions.delete(sessionTokenHash);
  }

  async deleteExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [hash, sess] of this.sessions.entries()) {
      if (new Date(sess.expiresAt) <= now) {
        this.sessions.delete(hash);
        count++;
      }
    }
    return count;
  }
}

let activeAdapter: UserDatabaseAdapter = new InMemoryUserDatabaseAdapter();

export function getUserDbAdapter(): UserDatabaseAdapter {
  return activeAdapter;
}

export function setUserDbAdapter(adapter: UserDatabaseAdapter) {
  activeAdapter = adapter;
}

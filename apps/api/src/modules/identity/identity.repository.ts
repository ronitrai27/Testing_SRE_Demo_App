import type { Registration, User } from "@saltmarket/contracts";
import { User as UserSchema } from "@saltmarket/contracts";
import type { Database } from "../../platform/database/index.ts";

export type UserRecord = User & { passwordHash: string };

export function createIdentityRepository(db: Database) {
  const byEmail = db.prepare(
    "SELECT id, email, name, role, password_hash FROM users WHERE email = ?",
  );
  const insertUser = db.prepare(
    `INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)
     ON CONFLICT (email) DO NOTHING RETURNING id, email, name, role`,
  );
  const insertSession = db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  );
  const userBySession = db.prepare(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at <> ?`,
  );
  const removeSession = db.prepare("DELETE FROM sessions WHERE token_hash = ?");

  return {
    findByEmail(email: string): UserRecord | undefined {
      const row = byEmail.get(email);
      return row && { ...UserSchema.parse(row), passwordHash: String(row.password_hash) };
    },
    /** Returns undefined when the email is already taken. */
    create(input: Omit<Registration, "password">, passwordHash: string): User | undefined {
      const row = insertUser.get(input.email, input.name, passwordHash);
      return row && UserSchema.parse(row);
    },
    createSession(tokenHash: string, userId: number, expiresAt: Date): void {
      insertSession.run(tokenHash, userId, expiresAt.toISOString());
    },
    findUserBySession(tokenHash: string, now: Date): User | undefined {
      const row = userBySession.get(tokenHash, now.toISOString());
      return row && UserSchema.parse(row);
    },
    deleteSession(tokenHash: string): void {
      removeSession.run(tokenHash);
    },
  };
}

export type IdentityRepository = ReturnType<typeof createIdentityRepository>;

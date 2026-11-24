import { createHash, randomBytes } from "node:crypto";
import type { Credentials, Registration, User } from "@saltmarket/contracts";
import { conflict, unauthenticated } from "../../platform/http/index.ts";
import { hashPassword, verifyPassword } from "../../platform/security/password.ts";
import type { IdentityRepository } from "./identity.repository.ts";

export type Session = { token: string; expiresAt: Date; user: User };

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

export function createIdentityService(repository: IdentityRepository, sessionTtlHours: number) {
  // Verified against when the email is unknown, so both paths take the same time.
  const decoyHash = hashPassword(randomBytes(16).toString("hex"));

  function openSession(user: User): Session {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionTtlHours * 3_600_000);
    repository.createSession(hashToken(token), user.id, expiresAt);
    return { token, expiresAt, user };
  }

  return {
    async register({ password, ...profile }: Registration): Promise<Session> {
      const user = repository.create(profile, await hashPassword(password));
      if (!user) throw conflict("That email already has an account");
      return openSession(user);
    },
    async signIn({ email, password }: Credentials): Promise<Session> {
      const record = repository.findByEmail(email);
      const matches = await verifyPassword(password, record?.passwordHash ?? (await decoyHash));
      if (!record || !matches) throw unauthenticated("Email or password is incorrect");
      const { passwordHash: _, ...user } = record;
      return openSession(user);
    },
    signOut(token: string): void {
      repository.deleteSession(hashToken(token));
    },
    authenticate(token: string): User | undefined {
      return repository.findUserBySession(hashToken(token), new Date());
    },
  };
}

export type IdentityService = ReturnType<typeof createIdentityService>;

import { randomBytes, type ScryptOptions, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;
const COST: ScryptOptions = { N: 2 ** 14, r: 8, p: 5 };

const derive = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, COST, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${salt.toString("base64url")}.${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt = "", key = ""] = stored.split(".");
  const expected = Buffer.from(key, "base64url");
  const actual = await derive(password, Buffer.from(salt, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

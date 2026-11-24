import { z } from "zod";

export const Role = z.enum(["customer", "admin"]);
export type Role = z.infer<typeof Role>;

export const User = z.object({
  id: z.int().positive(),
  email: z.email(),
  name: z.string(),
  role: Role,
});
export type User = z.infer<typeof User>;

export const Credentials = z.strictObject({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(200),
});
export type Credentials = z.infer<typeof Credentials>;

export const Registration = z.strictObject({
  email: z.email().toLowerCase(),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(10).max(200),
});
export type Registration = z.infer<typeof Registration>;

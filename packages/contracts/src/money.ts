import { z } from "zod";

/** Integer minor units. Money is never a float anywhere in the system. */
export const Cents = z.int().nonnegative();

export const CURRENCY = "USD";

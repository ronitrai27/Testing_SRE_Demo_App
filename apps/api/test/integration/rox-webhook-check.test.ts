import { expect, it } from "vitest";

// Fails on purpose, so CI fails and Rox's webhook listener has a failed run to hear about.
it("fails on purpose for the Rox webhook check", () => {
  expect(2 + 2).toBe(5);
});

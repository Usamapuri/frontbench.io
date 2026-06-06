import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  generateTemporaryPassword,
} from "../server/passwordUtils";

describe("passwordUtils", () => {
  it("hashes a password to a bcrypt hash (not plaintext)", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
  });

  it("comparePassword returns true for the correct password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await comparePassword("correct-horse", hash)).toBe(true);
  });

  it("comparePassword returns false for the wrong password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await comparePassword("wrong", hash)).toBe(false);
  });

  it("generates distinct, non-trivial temporary passwords", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).toHaveLength(a.length);
    expect(a.length).toBeGreaterThanOrEqual(6);
    expect(a).not.toBe(b);
  });
});

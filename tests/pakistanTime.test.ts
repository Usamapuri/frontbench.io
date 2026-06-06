import { describe, it, expect } from "vitest";
import { isOverdue, getPakistanDateString } from "@/utils/pakistanTime";

describe("pakistanTime.isOverdue", () => {
  it("is true for a clearly past due date", () => {
    expect(isOverdue("2000-01-01")).toBe(true);
  });

  it("is false for a far-future due date", () => {
    expect(isOverdue("2999-12-31")).toBe(false);
  });

  it("is not overdue on the due date itself (grace until end of day)", () => {
    const today = getPakistanDateString();
    expect(isOverdue(today)).toBe(false);
  });
});

describe("pakistanTime.getPakistanDateString", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(getPakistanDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

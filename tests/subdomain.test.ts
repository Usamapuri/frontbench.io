import { describe, it, expect } from "vitest";
import {
  isValidSubdomain,
  isReservedSubdomain,
  getTenantUrl,
} from "../server/subdomainMiddleware";

describe("subdomain validation", () => {
  it("accepts valid subdomains", () => {
    expect(isValidSubdomain("primax")).toBe(true);
    expect(isValidSubdomain("siddeeq")).toBe(true);
    expect(isValidSubdomain("greenfield-academy")).toBe(true);
  });

  it("rejects invalid subdomains", () => {
    expect(isValidSubdomain("ab")).toBe(false); // too short
    expect(isValidSubdomain("UPPER")).toBe(false); // uppercase
    expect(isValidSubdomain("has space")).toBe(false);
    expect(isValidSubdomain("-leadinghyphen")).toBe(false);
    expect(isValidSubdomain("under_score")).toBe(false);
  });

  it("flags reserved subdomains", () => {
    expect(isReservedSubdomain("www")).toBe(true);
    expect(isReservedSubdomain("app")).toBe(true);
    expect(isReservedSubdomain("api")).toBe(true);
    expect(isReservedSubdomain("admin")).toBe(true);
    expect(isReservedSubdomain("primax")).toBe(false);
  });

  it("builds tenant URLs", () => {
    expect(getTenantUrl("primax", "/login")).toBe("https://primax.frontbench.io/login");
    expect(getTenantUrl("siddeeq")).toBe("https://siddeeq.frontbench.io");
  });
});

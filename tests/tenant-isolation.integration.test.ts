import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pkg from "pg";
const { Pool } = pkg;

// DB integration test — proves Postgres RLS blocks cross-tenant reads.
// Gated: only runs with RUN_DB_TESTS=1 and a real DATABASE_URL (needs the RLS migration applied).
const ENABLED = process.env.RUN_DB_TESTS === "1" && !!process.env.DATABASE_URL;

describe.skipIf(!ENABLED)("tenant isolation (RLS)", () => {
  let pool: InstanceType<typeof Pool>;
  let primax: string;
  let siddeeq: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
    const t = await pool.query("SELECT id, subdomain FROM tenants ORDER BY subdomain");
    primax = t.rows.find((r: any) => r.subdomain === "primax")?.id;
    siddeeq = t.rows.find((r: any) => r.subdomain === "siddeeq")?.id;
  });

  afterAll(async () => { await pool?.end(); });

  // Run a query on a connection pinned to a tenant (mirrors server/db.ts runWithTenant)
  async function asTenant<T>(tenantId: string, sql: string): Promise<T[]> {
    const c = await pool.connect();
    try {
      await c.query("SELECT set_config('app.tenant_id', $1, false)", [tenantId]);
      await c.query("SET ROLE frontbench_app");
      return (await c.query(sql)).rows as T[];
    } finally {
      try { await c.query("RESET ROLE"); await c.query("SELECT set_config('app.tenant_id','',false)"); } catch {}
      c.release();
    }
  }

  it("each tenant sees only its own subjects", async () => {
    const p = await asTenant<any>(primax, "SELECT tenant_id FROM subjects");
    const s = await asTenant<any>(siddeeq, "SELECT tenant_id FROM subjects");
    expect(p.length).toBeGreaterThan(0);
    expect(s.length).toBeGreaterThan(0);
    expect(p.every((r) => r.tenant_id === primax)).toBe(true);
    expect(s.every((r) => r.tenant_id === siddeeq)).toBe(true);
  });

  it("a tenant cannot read another tenant's rows by filter", async () => {
    const crossRead = await asTenant<any>(primax, `SELECT count(*)::int AS n FROM subjects WHERE tenant_id = '${siddeeq}'`);
    expect(crossRead[0].n).toBe(0);
  });

  it("fail-closed: no app.tenant_id yields zero rows", async () => {
    const c = await pool.connect();
    try {
      await c.query("SET ROLE frontbench_app");
      const r = await c.query("SELECT id FROM subjects");
      expect(r.rowCount).toBe(0);
    } finally {
      try { await c.query("RESET ROLE"); } catch {}
      c.release();
    }
  });
});

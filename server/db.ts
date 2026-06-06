import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard PostgreSQL driver for Railway compatibility
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
});

type DB = NodePgDatabase<typeof schema>;

// Drizzle bound to the shared pool. Runs as the connection's default role (Railway
// `postgres`, a superuser that BYPASSES RLS). Used for system / auth / super-admin
// paths that legitimately need cross-tenant access.
export const poolDb: DB = drizzle(pool, { schema });

// Per-request, tenant-scoped Drizzle bound to a pinned connection that has switched to
// the non-superuser `frontbench_app` role and set `app.tenant_id`, so Postgres RLS
// enforces tenant isolation on every query — see runWithTenant().
const requestDb = new AsyncLocalStorage<DB>();

export function getActiveDb(): DB {
  return requestDb.getStore() ?? poolDb;
}

/**
 * Transparent handle: resolves to the request's tenant-scoped connection when one is
 * active (set by tenantDbMiddleware), otherwise the shared pool. Existing
 * `import { db } from "./db"` call sites need no changes — that's the whole point:
 * isolation is enforced at the connection layer, not by editing ~100 query sites.
 */
export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    const active = getActiveDb() as any;
    const value = active[prop];
    return typeof value === 'function' ? value.bind(active) : value;
  },
}) as DB;

/**
 * Pin a dedicated connection for the duration of `fn`, running as the non-superuser
 * `frontbench_app` role with `app.tenant_id` set. Postgres RLS policies then filter
 * every query to this tenant, and the `tenant_id` column default stamps inserts.
 * Fail-closed: if `app.tenant_id` is ever unset, RLS predicates match no rows.
 */
export async function runWithTenant<T>(
  tenantId: string,
  branchId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    // set_config(name, value, is_local=false) → session scoped on this pinned client.
    // app.tenant_id drives RLS; app.branch_id is the default for branch_id on inserts.
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [tenantId]);
    await client.query("SELECT set_config('app.branch_id', $1, false)", [branchId ?? '']);
    await client.query('SET ROLE frontbench_app');
    const scoped = drizzle(client, { schema });
    return await requestDb.run(scoped, fn);
  } finally {
    try {
      await client.query('RESET ROLE');
      await client.query("SELECT set_config('app.tenant_id', '', false)");
      await client.query("SELECT set_config('app.branch_id', '', false)");
    } catch {
      // If reset fails the client is in an unknown state; the pool will recycle it.
    }
    client.release();
  }
}

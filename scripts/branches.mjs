/**
 * Branch/campus layer migration (idempotent). Connect as superuser (Railway `postgres`).
 *   node scripts/branches.mjs apply    # create branches table + branch_id cols + Main Branch per tenant + backfill + RLS
 *   node scripts/branches.mjs status   # report
 *
 * Model: tenant (school) stays the RLS isolation boundary; branch is an org dimension.
 * branch_id columns are NULLABLE and NOT separately RLS'd (tenant RLS already covers them).
 */
import pkg from 'pg';
const { Client } = pkg;

const APP_ROLE = 'frontbench_app';
// Tables that gain a branch_id (operational/people/money + location-bound close)
const BRANCHED = ['users', 'students', 'classes', 'invoices', 'payments', 'expenses', 'daily_close', 'cash_draw_requests'];

const phase = process.argv[2] || 'apply';
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await c.connect();
const run = async (sql, p) => { try { await c.query(sql, p); console.log('  ok:', sql.replace(/\s+/g, ' ').slice(0, 95)); } catch (e) { console.error('  ERR:', sql.replace(/\s+/g, ' ').slice(0, 95), '->', e.message); throw e; } };

if (phase === 'apply') {
  console.log('\n== 1. branches table ==');
  await run(`CREATE TABLE IF NOT EXISTS branches (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id varchar NOT NULL REFERENCES tenants(id),
    name varchar NOT NULL,
    code varchar,
    address text,
    phone varchar,
    is_main boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    CONSTRAINT branches_code_tenant_unique UNIQUE (code, tenant_id)
  )`);

  console.log('\n== 2. branch_id columns (+ GUC default so inserts auto-stamp the active branch) ==');
  for (const t of BRANCHED) {
    await run(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS branch_id varchar REFERENCES branches(id)`);
    await run(`ALTER TABLE "${t}" ALTER COLUMN branch_id SET DEFAULT NULLIF(current_setting('app.branch_id', true), '')`);
  }

  console.log('\n== 3. Main Branch per tenant ==');
  await run(`INSERT INTO branches (tenant_id, name, code, is_main, is_active)
    SELECT t.id, 'Main Branch', 'MAIN', true, true FROM tenants t
    WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.tenant_id = t.id AND b.is_main = true)`);

  console.log('\n== 4. Backfill existing rows to each tenant Main Branch ==');
  for (const t of BRANCHED) {
    await run(`UPDATE "${t}" x SET branch_id = (
      SELECT b.id FROM branches b WHERE b.tenant_id = x.tenant_id AND b.is_main = true LIMIT 1
    ) WHERE x.branch_id IS NULL`);
  }

  console.log('\n== 5. RLS on branches (tenant-scoped, same as other tables) ==');
  await run(`GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO ${APP_ROLE}`);
  await run(`ALTER TABLE branches ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)`);
  await run(`ALTER TABLE branches ENABLE ROW LEVEL SECURITY`);
  await run(`ALTER TABLE branches FORCE ROW LEVEL SECURITY`);
  await run(`DROP POLICY IF EXISTS tenant_isolation ON branches`);
  await run(`CREATE POLICY tenant_isolation ON branches USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true))`);

  console.log('\n== 6. Daily close is per branch: unique on (tenant, branch, date) ==');
  await run(`ALTER TABLE daily_close DROP CONSTRAINT IF EXISTS daily_close_close_date_tenant_unique`);
  await run(`ALTER TABLE daily_close DROP CONSTRAINT IF EXISTS daily_close_branch_date_unique`);
  await run(`ALTER TABLE daily_close ADD CONSTRAINT daily_close_branch_date_unique UNIQUE (tenant_id, branch_id, close_date)`);

  console.log('\n== 7. Per-tenant roll-number prefix ==');
  await run(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS roll_number_prefix varchar`);
  // Preserve Primax's historical "PMX"; derive others from subdomain.
  await run(`UPDATE tenants SET roll_number_prefix = 'PMX' WHERE subdomain = 'primax' AND roll_number_prefix IS NULL`);
  await run(`UPDATE tenants SET roll_number_prefix = upper(left(regexp_replace(subdomain, '[^a-zA-Z0-9]', '', 'g'), 3)) WHERE roll_number_prefix IS NULL`);

  console.log('\nDone. Branch layer applied.');
}

if (phase === 'status') {
  console.log('\nBranches per tenant:');
  console.table((await c.query(
    `SELECT t.name AS tenant, b.name AS branch, b.code, b.is_main,
       (SELECT count(*) FROM students s WHERE s.branch_id=b.id) AS students
     FROM branches b JOIN tenants t ON t.id=b.tenant_id ORDER BY t.name, b.is_main DESC`
  )).rows);
  console.log('\nbranch_id columns present:');
  console.table((await c.query(
    `SELECT table_name, count(*) FILTER (WHERE column_name='branch_id') AS has_branch_id
     FROM information_schema.columns WHERE table_name = ANY($1) GROUP BY table_name ORDER BY table_name`,
    [BRANCHED]
  )).rows);
  const nulls = await c.query(
    `SELECT count(*)::int n FROM students WHERE branch_id IS NULL`
  );
  console.log('students with NULL branch_id (should be 0 after backfill):', nulls.rows[0].n);
}

await c.end();

/**
 * Tenant Row-Level Security manager for Front Bench.
 *
 * Usage (DATABASE_URL must be set; connect as a superuser e.g. Railway `postgres`):
 *   node scripts/rls.mjs grants    # create app role, grants, tenant_id column defaults  (safe, no filtering yet)
 *   node scripts/rls.mjs enable    # enable RLS + tenant_isolation policies              (turns on filtering)
 *   node scripts/rls.mjs disable   # drop policies + disable RLS (rollback)
 *   node scripts/rls.mjs status    # report role, rowsecurity, policies
 *
 * Idempotent: safe to re-run any phase.
 */
import pkg from 'pg';
const { Client } = pkg;

const APP_ROLE = 'frontbench_app';

// Tables with NOT NULL tenant_id — strict isolation.
const STRICT = [
  'users', 'students', 'subjects', 'subject_combos', 'combo_subjects', 'enrollments',
  'invoices', 'add_ons', 'invoice_items', 'payments', 'payment_allocations',
  'invoice_adjustments', 'billing_schedules', 'classes', 'attendance', 'assessments',
  'grades', 'payout_rules', 'cash_draw_requests', 'daily_close', 'expenses',
  'announcements', 'announcement_recipients', 'class_schedules', 'schedule_changes',
  'student_notifications', 'tenant_analytics', 'subscriptions', 'billing_history',
];
// Tables with NULLABLE tenant_id — system-wide rows (NULL) allowed for all tenants.
const NULLABLE = ['audit_logs', 'system_notifications'];
const ALL = [...STRICT, ...NULLABLE];

const phase = process.argv[2];
if (!['grants', 'enable', 'disable', 'status'].includes(phase || '')) {
  console.error('Usage: node scripts/rls.mjs <grants|enable|disable|status>');
  process.exit(1);
}

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await c.connect();
const run = async (sql, params) => {
  try { await c.query(sql, params); console.log('  ok:', sql.replace(/\s+/g, ' ').slice(0, 90)); }
  catch (e) { console.error('  ERR:', sql.replace(/\s+/g, ' ').slice(0, 90), '->', e.message); throw e; }
};

if (phase === 'grants') {
  console.log(`\n== Creating role ${APP_ROLE} + grants + tenant_id defaults ==`);
  await run(`DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${APP_ROLE}') THEN CREATE ROLE ${APP_ROLE} NOLOGIN; END IF; END $$;`);
  await run(`GRANT ${APP_ROLE} TO CURRENT_USER`); // so we can SET ROLE later
  await run(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);
  await run(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE}`);
  await run(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE}`);
  await run(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_ROLE}`);
  await run(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${APP_ROLE}`);
  for (const t of ALL) {
    await run(`ALTER TABLE "${t}" ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)`);
  }
  console.log('\nGrants + defaults applied. RLS NOT yet enabled (no filtering). Run "enable" next.');
}

if (phase === 'enable') {
  console.log('\n== Enabling RLS + tenant_isolation policies ==');
  for (const t of STRICT) {
    await run(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
    await run(`ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY`);
    await run(`DROP POLICY IF EXISTS tenant_isolation ON "${t}"`);
    await run(`CREATE POLICY tenant_isolation ON "${t}" USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true))`);
  }
  for (const t of NULLABLE) {
    await run(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
    await run(`ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY`);
    await run(`DROP POLICY IF EXISTS tenant_isolation ON "${t}"`);
    await run(`CREATE POLICY tenant_isolation ON "${t}" USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true))`);
  }
  // tenants table keys on `id` (not tenant_id): a tenant can only see/modify its own row.
  await run(`ALTER TABLE tenants ENABLE ROW LEVEL SECURITY`);
  await run(`ALTER TABLE tenants FORCE ROW LEVEL SECURITY`);
  await run(`DROP POLICY IF EXISTS tenant_isolation ON tenants`);
  await run(`CREATE POLICY tenant_isolation ON tenants USING (id = current_setting('app.tenant_id', true)) WITH CHECK (id = current_setting('app.tenant_id', true))`);
  console.log('\nRLS enabled on', STRICT.length + NULLABLE.length + 1, 'tables (incl. tenants). Isolation enforced for the app role.');
}

if (phase === 'disable') {
  console.log('\n== Disabling RLS (rollback) ==');
  for (const t of [...ALL, 'tenants']) {
    await run(`DROP POLICY IF EXISTS tenant_isolation ON "${t}"`);
    await run(`ALTER TABLE "${t}" NO FORCE ROW LEVEL SECURITY`);
    await run(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY`);
  }
  console.log('\nRLS disabled on all tables.');
}

if (phase === 'status') {
  const role = await c.query(`SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=$1`, [APP_ROLE]);
  console.log('\nApp role:', role.rows[0] || '(missing)');
  const rls = await c.query(
    `SELECT c.relname AS table, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS forced,
       (SELECT count(*) FROM pg_policies p WHERE p.tablename=c.relname) AS policies
     FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r' AND c.relname = ANY($1) ORDER BY c.relname`,
    [ALL]
  );
  console.table(rls.rows);
}

await c.end();

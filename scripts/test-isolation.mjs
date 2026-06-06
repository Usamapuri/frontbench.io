/**
 * Proves tenant isolation end-to-end at the DB layer, exercising the exact mechanism
 * the app uses per request: SET app.tenant_id + SET ROLE frontbench_app (RLS enforced).
 * Run: DATABASE_URL=... node scripts/test-isolation.mjs
 */
import pkg from 'pg';
const { Client, Pool } = pkg;

const admin = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await admin.connect();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { (ok ? pass++ : fail++); console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); };

// Tenants
const tRows = (await admin.query("SELECT id, name, subdomain FROM tenants ORDER BY subdomain")).rows;
const primax = tRows.find(t => t.subdomain === 'primax');
const siddeeq = tRows.find(t => t.subdomain === 'siddeeq');
console.log(`Tenants: primax=${primax.id.slice(0,8)}…  siddeeq=${siddeeq.id.slice(0,8)}…\n`);

// Required (NOT NULL, no default) columns for students, so we can insert valid rows.
const reqCols = (await admin.query(
  `SELECT column_name, data_type, udt_name FROM information_schema.columns
   WHERE table_name='students' AND is_nullable='NO' AND column_default IS NULL`
)).rows;
// Preload first valid value for any enum (USER-DEFINED) columns.
const enumFirst = {};
for (const r of reqCols.filter(r => r.data_type === 'USER-DEFINED')) {
  const e = await admin.query(
    `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname=$1 ORDER BY e.enumsortorder LIMIT 1`,
    [r.udt_name]
  );
  enumFirst[r.column_name] = e.rows[0]?.enumlabel;
}
const valFor = (r, tag, i) => r.data_type === 'USER-DEFINED' ? enumFirst[r.column_name]
  : r.data_type === 'ARRAY' ? []
  : r.data_type === 'jsonb' || r.data_type === 'json' ? '{}'
  : r.data_type === 'integer' || r.data_type === 'numeric' ? 0
  : r.data_type === 'boolean' ? true
  : r.data_type === 'date' ? '2010-01-01'
  : r.data_type.includes('timestamp') ? new Date().toISOString()
  : `ZZTEST-${tag}-${i}`; // varchar/text

// Run fn on a pinned connection scoped to tenantId (mirrors server/db.ts runWithTenant)
async function asTenant(tenantId, fn) {
  const c = await pool.connect();
  try {
    await c.query("SELECT set_config('app.tenant_id', $1, false)", [tenantId]);
    await c.query('SET ROLE frontbench_app');
    return await fn(c);
  } finally {
    try { await c.query('RESET ROLE'); await c.query("SELECT set_config('app.tenant_id','',false)"); } catch {}
    c.release();
  }
}
async function insertStudent(c, tag, i) {
  const cols = reqCols.map(r => `"${r.column_name}"`);
  const vals = reqCols.map((r, k) => valFor(r, tag, `${i}-${k}`));
  const ph = vals.map((_, k) => `$${k + 1}`);
  const r = await c.query(`INSERT INTO students (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING id, tenant_id`, vals);
  return r.rows[0];
}

const created = [];
try {
  console.log('— Inserts (tenant_id auto-stamped from GUC) —');
  const pStu = await asTenant(primax.id, c => insertStudent(c, 'PMX', 1));
  const sStu = await asTenant(siddeeq.id, c => insertStudent(c, 'SID', 1));
  created.push(pStu.id, sStu.id);
  check('primax insert stamped tenant_id=primax', pStu.tenant_id === primax.id, pStu.tenant_id?.slice(0,8));
  check('siddeeq insert stamped tenant_id=siddeeq', sStu.tenant_id === siddeeq.id, sStu.tenant_id?.slice(0,8));

  console.log('\n— Read isolation —');
  const pSeesS = await asTenant(primax.id, async c => (await c.query('SELECT id FROM students WHERE id=$1', [sStu.id])).rowCount);
  check('primax CANNOT read siddeeq student by id', pSeesS === 0, `rows=${pSeesS}`);
  const sSeesP = await asTenant(siddeeq.id, async c => (await c.query('SELECT id FROM students WHERE id=$1', [pStu.id])).rowCount);
  check('siddeeq CANNOT read primax student by id', sSeesP === 0, `rows=${sSeesP}`);
  const pAll = await asTenant(primax.id, async c => (await c.query('SELECT tenant_id FROM students')).rows);
  check('primax list = only primax rows', pAll.every(r => r.tenant_id === primax.id) && pAll.length > 0, `${pAll.length} rows`);
  const sAll = await asTenant(siddeeq.id, async c => (await c.query('SELECT tenant_id FROM students')).rows);
  check('siddeeq list = only siddeeq rows', sAll.every(r => r.tenant_id === siddeeq.id) && sAll.length > 0, `${sAll.length} rows`);

  console.log('\n— Write isolation —');
  const upd = await asTenant(primax.id, async c => (await c.query("UPDATE students SET first_name='HACKED' WHERE id=$1", [sStu.id])).rowCount);
  check('primax CANNOT update siddeeq student', upd === 0, `rows affected=${upd}`);
  const del = await asTenant(primax.id, async c => (await c.query('DELETE FROM students WHERE id=$1', [sStu.id])).rowCount);
  check('primax CANNOT delete siddeeq student', del === 0, `rows affected=${del}`);

  console.log('\n— Tenant-id forgery —');
  let forged = false;
  try {
    await asTenant(primax.id, c => c.query(
      `INSERT INTO students (tenant_id, ${reqCols.map(r=>`"${r.column_name}"`).join(',')}) VALUES ($1, ${reqCols.map((_,k)=>`$${k+2}`).join(',')})`,
      [siddeeq.id, ...reqCols.map((r,k)=>valFor(r,'FORGE',k))]
    ));
  } catch (e) { forged = true; }
  check('primax CANNOT insert a row tagged as siddeeq (WITH CHECK)', forged);

  console.log('\n— Fail-closed (no tenant set) —');
  const noCtx = await (async () => {
    const c = await pool.connect();
    try { await c.query('SET ROLE frontbench_app'); return (await c.query('SELECT id FROM students')).rowCount; }
    finally { try { await c.query('RESET ROLE'); } catch {} c.release(); }
  })();
  check('no app.tenant_id → zero rows (fail-closed)', noCtx === 0, `rows=${noCtx}`);
} finally {
  // Cleanup as superuser (bypasses RLS)
  for (const id of created) { try { await admin.query('DELETE FROM students WHERE id=$1', [id]); } catch {} }
  await admin.query("DELETE FROM students WHERE first_name LIKE 'ZZTEST-%' OR first_name='HACKED'").catch(()=>{});
  await pool.end(); await admin.end();
}

console.log(`\n${fail === 0 ? '🔒 ALL ISOLATION CHECKS PASSED' : '⚠️  SOME CHECKS FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

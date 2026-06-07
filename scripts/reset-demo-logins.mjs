/**
 * Reset demo logins to a known password (admin123). Idempotent.
 *  - If demo admin accounts already exist, just resets their password + clears must-change flag.
 *  - If the DB has no demo accounts (fresh DB), seeds a "Frontbench Demo" school + admin.
 * Run: DATABASE_URL=... node scripts/reset-demo-logins.mjs
 */
import pkg from "pg";
import bcrypt from "bcryptjs";
const { Client } = pkg;

const PW = "admin123";
const DEMO_EMAILS = [
  "admin@primax.edu.pk",
  "admin@siddeeq.edu.pk",
  "superadmin@frontbench.io",
  "demo@frontbench.io",
];

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await c.connect();
const hash = await bcrypt.hash(PW, 10);

const r = await c.query(
  `UPDATE users SET password=$1, must_change_password=false, temporary_password=null
   WHERE email = ANY($2) RETURNING email`,
  [hash, DEMO_EMAILS]
);

if (r.rowCount > 0) {
  console.log(`Reset password to "${PW}" for: ${r.rows.map((x) => x.email).join(", ")}`);
} else {
  console.log('No demo accounts found — seeding a "Frontbench Demo" school...');
  const t = await c.query(
    `INSERT INTO tenants (name, slug, subdomain, is_active, is_verified, primary_color, secondary_color, timezone, currency, roll_number_prefix)
     VALUES ('Frontbench Demo','demo','demo',true,true,'#3B82F6','#1E40AF','Asia/Karachi','PKR','DEMO') RETURNING id`
  );
  const tid = t.rows[0].id;
  const b = await c.query(
    `INSERT INTO branches (tenant_id, name, code, is_main, is_active) VALUES ($1,'Main Branch','MAIN',true,true) RETURNING id`,
    [tid]
  );
  const bid = b.rows[0].id;
  await c.query(
    `INSERT INTO users (tenant_id, branch_id, email, password, first_name, last_name, role, is_super_admin, is_teacher, is_active, must_change_password)
     VALUES ($1,$2,'demo@frontbench.io',$3,'Demo','Admin','management',true,false,true,false)`,
    [tid, bid, hash]
  );
  for (const [name, code] of [["Mathematics","MATH"],["English","ENG"],["Science","SCI"],["Social Studies","SS"],["Computer Science","CS"],["Physical Education","PE"]]) {
    await c.query(
      `INSERT INTO subjects (tenant_id, name, code, class_levels, base_fee) VALUES ($1,$2,$3,ARRAY['o-level'],'5000')`,
      [tid, name, code]
    );
  }
  console.log(`Created "Frontbench Demo" — login: demo@frontbench.io / ${PW}`);
}
await c.end();

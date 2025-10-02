import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection and schema...');
    
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if tenants table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('❌ Tenants table does not exist');
      console.log('📋 You need to run the database migration:');
      console.log('   1. Run: npx drizzle-kit push');
      console.log('   2. Run: npx tsx scripts/simple-seed.ts');
      return;
    }
    
    console.log('✅ Tenants table exists');
    
    // Check if tenants exist
    const tenantCount = await sql`SELECT COUNT(*) as count FROM tenants`;
    const count = parseInt(tenantCount[0].count);
    
    if (count === 0) {
      console.log('❌ No tenants found in database');
      console.log('📋 You need to run the seeding script:');
      console.log('   npx tsx scripts/simple-seed.ts');
      return;
    }
    
    console.log(`✅ Found ${count} tenant(s) in database`);
    
    // List tenants
    const tenants = await sql`SELECT name, subdomain, is_active FROM tenants`;
    console.log('📋 Existing tenants:');
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.subdomain}.frontbench.io) - ${tenant.is_active ? 'Active' : 'Inactive'}`);
    });
    
    console.log('🎉 Database is properly set up!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.log('📋 Troubleshooting steps:');
    console.log('   1. Verify DATABASE_URL is correct');
    console.log('   2. Check if database server is running');
    console.log('   3. Verify network connectivity');
    console.log('   4. Check database credentials');
  } finally {
    await sql.end();
  }
}

checkDatabase();

#!/usr/bin/env tsx

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Database connection
const connectionString = 'postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway';

console.log('🚀 Connecting to Railway database...');
console.log('Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

const sql = postgres(connectionString);

async function runMigration() {
  try {
    console.log('📁 Reading migration file...');
    
    const migrationPath = path.join(process.cwd(), 'migrations', '0001_add_multi_tenant_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('⚡ Running migration...');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} completed`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the tenants table was created
    console.log('🔍 Verifying migration...');
    const result = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `;
    
    if (result.length > 0) {
      console.log('✅ Tenants table created successfully!');
      console.log('Columns:', result.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    } else {
      console.log('❌ Tenants table not found!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

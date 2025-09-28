#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import fs from 'fs';
import path from 'path';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database connection
const connectionString = 'postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway';

console.log('🚀 Connecting to Railway database...');
console.log('Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

const pool = new Pool({ connectionString });

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📁 Reading migration file...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '0001_add_multi_tenant_support.sql');
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
        
        await client.query(statement);
        console.log(`✅ Statement ${i + 1} completed`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the tenants table was created
    console.log('🔍 Verifying migration...');
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Tenants table created successfully!');
      console.log('Columns:', result.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    } else {
      console.log('❌ Tenants table not found!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

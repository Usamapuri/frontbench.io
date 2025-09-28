#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = 'postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway';

console.log('Testing database connection...');

try {
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  console.log('Connected successfully!');
  
  // Test a simple query
  const result = await client`SELECT version()`;
  console.log('PostgreSQL version:', result[0].version);
  
  await client.end();
  console.log('Connection closed successfully!');
  
} catch (error) {
  console.error('Connection failed:', error);
}

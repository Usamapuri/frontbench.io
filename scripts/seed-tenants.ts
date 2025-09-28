#!/usr/bin/env tsx
/**
 * Tenant Seeding Script for Frontbench.io Multi-Tenant Setup
 * 
 * This script seeds the database with initial tenant data and sample users
 * for testing the multi-tenant functionality.
 */

import { db } from '../server/db';
import { tenants, users } from '../shared/schema';
import { generateUserCredentials } from '../server/passwordUtils';

async function seedTenants() {
  console.log('🌱 Starting tenant seeding process...');

  try {
    // Create default tenant (Primax Academy)
    console.log('📝 Creating default tenant: Primax Academy...');
    const defaultTenant = await db.insert(tenants).values({
      id: 'default-tenant-primax',
      name: 'Primax Academy',
      slug: 'primax-academy',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      address: 'Karachi, Pakistan',
      phone: '+92-21-XXXXXXX',
      email: 'info@primaxacademy.edu.pk',
      website: 'https://primaxacademy.edu.pk',
      isActive: true,
    }).onConflictDoNothing().returning();

    // Create test tenant (Siddeeq Public School)
    console.log('📝 Creating test tenant: Siddeeq Public School...');
    const testTenant = await db.insert(tenants).values({
      id: 'siddeeq-public-school',
      name: 'Siddeeq Public School',
      slug: 'siddeeq-public-school',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      address: 'Karachi, Pakistan',
      phone: '+92-21-YYYYYYY',
      email: 'info@siddeeqpublic.edu.pk',
      website: 'https://siddeeqpublic.edu.pk',
      isActive: true,
    }).onConflictDoNothing().returning();

    // Create admin users for each tenant
    console.log('👤 Creating admin users for tenants...');

    // Admin for Primax Academy
    const primaxCredentials = await generateUserCredentials();
    await db.insert(users).values({
      tenantId: 'default-tenant-primax',
      email: 'admin@primaxacademy.edu.pk',
      firstName: 'Primax',
      lastName: 'Administrator',
      role: 'management',
      isSuperAdmin: true,
      isTeacher: false,
      password: primaxCredentials.password,
      temporaryPassword: primaxCredentials.temporaryPassword,
      mustChangePassword: true,
      isActive: true,
      position: 'System Administrator',
    }).onConflictDoNothing();

    // Admin for Siddeeq Public School
    const siddeeqCredentials = await generateUserCredentials();
    await db.insert(users).values({
      tenantId: 'siddeeq-public-school',
      email: 'admin@siddeeqpublic.edu.pk',
      firstName: 'Siddeeq',
      lastName: 'Administrator',
      role: 'management',
      isSuperAdmin: true,
      isTeacher: false,
      password: siddeeqCredentials.password,
      temporaryPassword: siddeeqCredentials.temporaryPassword,
      mustChangePassword: true,
      isActive: true,
      position: 'System Administrator',
    }).onConflictDoNothing();

    console.log('✅ Tenant seeding completed successfully!');
    console.log('\n📋 Tenant Summary:');
    console.log('1. Primax Academy (default-tenant-primax)');
    console.log('   - Admin: admin@primaxacademy.edu.pk');
    console.log('   - Temp Password: ' + primaxCredentials.temporaryPassword);
    console.log('   - Colors: Blue theme (#3B82F6, #1E40AF)');
    console.log('\n2. Siddeeq Public School (siddeeq-public-school)');
    console.log('   - Admin: admin@siddeeqpublic.edu.pk');
    console.log('   - Temp Password: ' + siddeeqCredentials.temporaryPassword);
    console.log('   - Colors: Green theme (#10B981, #059669)');
    console.log('\n🔐 Both admins must change their passwords on first login.');
    console.log('🎯 Use these credentials to test multi-tenant functionality.');

  } catch (error) {
    console.error('❌ Error seeding tenants:', error);
    process.exit(1);
  }
}

// Run the seeding script
seedTenants()
  .then(() => {
    console.log('🏁 Seeding script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding script failed:', error);
    process.exit(1);
  });

export { seedTenants };

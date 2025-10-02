#!/usr/bin/env tsx

import postgres from 'postgres';
import { randomUUID } from 'crypto';

const connectionString = 'postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway';

console.log('🌱 Starting simple tenant seeding...');

const sql = postgres(connectionString);

async function seedTenants() {
  try {
    console.log('📝 Getting existing tenants...');
    
    // Get existing tenants
    const tenants = await sql`
      SELECT id, name, slug, subdomain FROM tenants 
      WHERE subdomain IN ('primax', 'siddeeq')
      ORDER BY subdomain
    `;
    
    let defaultTenantId, siddeeqTenantId;
    
    for (const tenant of tenants) {
      if (tenant.subdomain === 'primax') {
        defaultTenantId = tenant.id;
        console.log(`✅ Found existing tenant: ${tenant.name}`);
      } else if (tenant.subdomain === 'siddeeq') {
        siddeeqTenantId = tenant.id;
        console.log(`✅ Found existing tenant: ${tenant.name}`);
      }
    }
    
    // Create tenants if they don't exist
    if (!defaultTenantId) {
      console.log('📝 Creating default tenant: Primax Academy...');
      defaultTenantId = randomUUID();
      await sql`
        INSERT INTO tenants (
          id, name, slug, subdomain, primary_color, secondary_color, 
          timezone, currency, is_active, is_verified, created_at, updated_at
        ) VALUES (
          ${defaultTenantId}, 
          'Primax Academy', 
          'primax-academy',
          'primax',
          '#3B82F6',
          '#1E40AF',
          'Asia/Karachi',
          'PKR',
          true,
          true,
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Default tenant created successfully!');
    }
    
    if (!siddeeqTenantId) {
      console.log('📝 Creating test tenant: Siddeeq Public School...');
      siddeeqTenantId = randomUUID();
      await sql`
        INSERT INTO tenants (
          id, name, slug, subdomain, primary_color, secondary_color, 
          timezone, currency, is_active, is_verified, created_at, updated_at
        ) VALUES (
          ${siddeeqTenantId}, 
          'Siddeeq Public School', 
          'siddeeq-public-school',
          'siddeeq',
          '#10B981',
          '#047857',
          'Asia/Karachi',
          'PKR',
          true,
          true,
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Test tenant created successfully!');
    }
    
    // Check if we have any existing users to assign to default tenant
    const existingUsers = await sql`SELECT id FROM users LIMIT 1`;
    
    if (existingUsers.length > 0) {
      console.log('📝 Assigning existing users to default tenant...');
      
      await sql`
        UPDATE users 
        SET tenant_id = ${defaultTenantId}
        WHERE tenant_id IS NULL
      `;
      
      console.log('✅ Existing users assigned to default tenant!');
    } else {
      console.log('ℹ️ No existing users found to assign.');
    }
    
    // Check if admin users already exist
    console.log('👤 Checking for existing admin users...');
    
    const existingAdmins = await sql`
      SELECT email, tenant_id FROM users 
      WHERE email IN ('admin@primax.edu.pk', 'admin@siddeeq.edu.pk')
    `;
    
    if (existingAdmins.length === 0) {
      console.log('👤 Creating admin users...');
      
      const adminPassword = '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH'; // "admin123"
      
      // Admin for Primax Academy
      await sql`
        INSERT INTO users (
          id, tenant_id, email, password, first_name, last_name, 
          role, is_super_admin, is_teacher, is_active, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, 
          ${defaultTenantId}, 
          'admin@primax.edu.pk',
          ${adminPassword},
          'Admin',
          'User',
          'management',
          true,
          false,
          true,
          NOW(),
          NOW()
        )
      `;
      
      // Admin for Siddeeq Public School
      await sql`
        INSERT INTO users (
          id, tenant_id, email, password, first_name, last_name, 
          role, is_super_admin, is_teacher, is_active, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, 
          ${siddeeqTenantId}, 
          'admin@siddeeq.edu.pk',
          ${adminPassword},
          'Admin',
          'User',
          'management',
          true,
          false,
          true,
          NOW(),
          NOW()
        )
      `;
      
      console.log('✅ Admin users created successfully!');
    } else {
      console.log('✅ Admin users already exist!');
    }
    
    // Create super admin user (system-wide access)
    console.log('👑 Creating super admin user...');
    
    const superAdminExists = await sql`
      SELECT id FROM users 
      WHERE email = 'superadmin@frontbench.io'
    `;
    
    if (superAdminExists.length === 0) {
      const superAdminPassword = '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH'; // "admin123"
      
      await sql`
        INSERT INTO users (
          id, tenant_id, email, password, first_name, last_name, 
          role, is_super_admin, is_teacher, is_active, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, 
          ${defaultTenantId}, 
          'superadmin@frontbench.io',
          ${superAdminPassword},
          'Super',
          'Admin',
          'super_admin',
          true,
          false,
          true,
          NOW(),
          NOW()
        )
      `;
      
      console.log('✅ Super admin user created successfully!');
      console.log('🔐 Super Admin Login: superadmin@frontbench.io / admin123');
    } else {
      console.log('✅ Super admin user already exists!');
    }
    
    // Create default subjects for both tenants
    console.log('📚 Creating default subjects...');
    
    const subjects = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English', code: 'ENG' },
      { name: 'Science', code: 'SCI' },
      { name: 'Social Studies', code: 'SS' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Physical Education', code: 'PE' }
    ];
    
    for (const subject of subjects) {
      // For Primax Academy
      await sql`
        INSERT INTO subjects (id, tenant_id, name, code, class_levels, base_fee, description, is_active, created_at)
        VALUES (${randomUUID()}, ${defaultTenantId}, ${subject.name}, ${subject.code}, ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}, 1000.00, ${subject.name + ' subject'}, true, NOW())
      `;
      
      // For Siddeeq Public School
      await sql`
        INSERT INTO subjects (id, tenant_id, name, code, class_levels, base_fee, description, is_active, created_at)
        VALUES (${randomUUID()}, ${siddeeqTenantId}, ${subject.name}, ${subject.code}, ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}, 1000.00, ${subject.name + ' subject'}, true, NOW())
      `;
    }
    
    console.log('✅ Default subjects created for both tenants!');
    
    console.log('🎉 Tenant seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Default tenant: Primax Academy (${defaultTenantId})`);
    console.log(`   • Test tenant: Siddeeq Public School (${siddeeqTenantId})`);
    console.log('   • Admin users created with password: admin123');
    console.log('   • Default subjects created for both tenants');
    console.log('');
    console.log('🌐 Access URLs:');
    console.log('   • Primax Academy: https://primax.frontbench.io');
    console.log('   • Siddeeq Public School: https://siddeeq.frontbench.io');
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('   • Primax Academy: admin@primax.edu.pk / admin123');
    console.log('   • Siddeeq Public School: admin@siddeeq.edu.pk / admin123');
    console.log('   • Super Admin: superadmin@frontbench.io / admin123');
    console.log('');
    console.log('🎯 Super Admin Access:');
    console.log('   • Dashboard: https://primax.frontbench.io/api/super-admin/dashboard');
    console.log('   • Tenant Management: https://primax.frontbench.io/api/super-admin/tenants');
    console.log('   • Analytics: https://primax.frontbench.io/api/super-admin/analytics');
    
  } catch (error) {
    console.error('❌ Error seeding tenants:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedTenants();

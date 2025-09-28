# Railway Database Configuration for Frontbench.io

This guide explains how to configure the Railway PostgreSQL database for the multi-tenant Frontbench.io application.

## Railway Database Setup

### 1. Environment Variable Configuration

Add the following environment variable to your Railway deployment:

```bash
DATABASE_URL=postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway
```

### 2. Database Migration

After setting up the environment variable, run the multi-tenant migration:

```bash
# Connect to your Railway database and execute the migration
psql $DATABASE_URL -f migrations/0001_add_multi_tenant_support.sql
```

Or if you prefer to run it through the application:

```bash
# Using drizzle-kit (if configured)
npx drizzle-kit push:pg

# Or run the SQL file directly in Railway's database console
```

### 3. Seed Initial Tenants

After the migration, seed the database with initial tenant data:

```bash
# Run the seeding script
npm run seed:tenants

# Or manually execute
npx tsx scripts/seed-tenants.ts
```

## Database Schema Changes

The migration adds:

1. **tenants table** - Stores school/organization information
2. **tenant_id columns** - Added to all existing tables for data isolation
3. **Unique constraints** - Updated to be per-tenant instead of global
4. **Indexes** - Added for better query performance on tenant_id columns
5. **Foreign key constraints** - Ensure referential integrity

## Security Features

### Data Isolation
- Every database query is automatically scoped to the current tenant
- Cross-tenant data access is prevented at the database level
- Tenant context is enforced through middleware

### Authentication Updates
- User sessions now include `tenantId` for isolation
- Login process validates tenant membership
- Authentication middleware enforces tenant context

## Testing Multi-Tenancy

The system creates two test tenants:

### 1. Primax Academy (Default)
- **Tenant ID**: `default-tenant-primax`
- **Slug**: `primax-academy`
- **Admin Email**: `admin@primaxacademy.edu.pk`
- **Colors**: Blue theme (#3B82F6, #1E40AF)

### 2. Siddeeq Public School (Test)
- **Tenant ID**: `siddeeq-public-school`
- **Slug**: `siddeeq-public-school`
- **Admin Email**: `admin@siddeeqpublic.edu.pk`
- **Colors**: Green theme (#10B981, #059669)

## API Endpoints

### Tenant Onboarding
```bash
POST /api/tenants/onboard
```

### Tenant Configuration
```bash
GET /api/tenant/config
GET /api/tenants/by-slug/:slug
GET /api/tenants/check-slug/:slug
```

## Environment Variables

Make sure these are set in Railway:

```bash
# Database
DATABASE_URL=postgresql://postgres:qRyFcPYaDCkmDzZcXrDjOmhQWApHUHFw@crossover.proxy.rlwy.net:21573/railway

# Session
SESSION_SECRET=your-secure-session-secret-here

# Optional: For development
NODE_ENV=production
```

## Monitoring & Debugging

### Tenant Context Logging
The application logs tenant context for all database operations:

```
🏢 [GET /api/students] Tenant Context: {
  tenantId: 'default-tenant-primax',
  userId: 'user-123',
  role: 'management',
  isSuperAdmin: true
}
```

### Query Scoping Verification
All database queries automatically include tenant isolation:

```sql
SELECT * FROM students WHERE tenant_id = 'default-tenant-primax' AND is_active = true;
```

## Troubleshooting

### Common Issues

1. **Missing tenant_id in session**
   - Ensure users log in after the migration
   - Check that authentication middleware includes tenantId

2. **Cross-tenant data leaks**
   - Verify all routes use `requireTenantContextMiddleware`
   - Use `scopedDb` operations instead of direct database queries

3. **Migration errors**
   - Ensure all existing data is assigned to default tenant
   - Check foreign key constraints are properly set

### Verification Queries

```sql
-- Check tenant isolation
SELECT tenant_id, COUNT(*) FROM students GROUP BY tenant_id;

-- Verify unique constraints
SELECT tenant_id, roll_number, COUNT(*) 
FROM students 
GROUP BY tenant_id, roll_number 
HAVING COUNT(*) > 1;

-- Check foreign key relationships
SELECT t.name as tenant_name, COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name;
```

## Next Steps

1. **Domain Routing**: Implement custom domain support for tenants
2. **Tenant Analytics**: Add tenant-specific analytics and reporting
3. **Resource Limits**: Implement per-tenant resource quotas
4. **Backup Strategy**: Set up tenant-aware backup procedures
5. **Monitoring**: Add tenant-specific monitoring and alerting

## Support

For issues with the multi-tenant setup:

1. Check the application logs for tenant context information
2. Verify database constraints and indexes are in place
3. Test with the provided sample tenants
4. Review the tenant onboarding flow

The system is now ready for multi-tenant operation with complete data isolation between schools.

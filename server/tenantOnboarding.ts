/**
 * Tenant Onboarding API for Frontbench.io Multi-Tenant SaaS
 * 
 * This module handles the creation of new tenants (schools) and their
 * initial setup including admin user creation and basic configuration.
 */

import { Express, Request, Response } from 'express';
import { db } from './db';
import { tenants, users, subjects, addOns } from '../shared/schema';
import { generateUserCredentials } from './passwordUtils';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for tenant onboarding
const tenantOnboardingSchema = z.object({
  // Tenant Information
  name: z.string().min(2, 'School name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  
  // Branding
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color').optional(),
  logoUrl: z.string().url().optional(),
  
  // School Details
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required'),
  website: z.string().url().optional(),
  timezone: z.string().default('Asia/Karachi'),
  currency: z.string().default('PKR'),
  
  // Admin User
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().min(1, 'Admin last name is required'),
  adminEmail: z.string().email('Valid admin email is required'),
  adminPhone: z.string().optional(),
  
  // Optional: Initial Setup Data
  setupDefaultSubjects: z.boolean().default(true),
  setupDefaultAddOns: z.boolean().default(true),
});

type TenantOnboardingData = z.infer<typeof tenantOnboardingSchema>;

/**
 * Default subjects to create for new tenants
 */
const defaultSubjects = [
  {
    name: 'Mathematics',
    code: 'MATH',
    classLevels: ['o-level', 'a-level'],
    baseFee: '5000.00',
    description: 'Core mathematics curriculum',
  },
  {
    name: 'Physics',
    code: 'PHY',
    classLevels: ['o-level', 'a-level'],
    baseFee: '5500.00',
    description: 'Physics fundamentals and advanced topics',
  },
  {
    name: 'Chemistry',
    code: 'CHEM',
    classLevels: ['o-level', 'a-level'],
    baseFee: '5500.00',
    description: 'Organic and inorganic chemistry',
  },
  {
    name: 'Biology',
    code: 'BIO',
    classLevels: ['o-level', 'a-level'],
    baseFee: '5000.00',
    description: 'Life sciences and biological processes',
  },
  {
    name: 'English',
    code: 'ENG',
    classLevels: ['o-level', 'a-level'],
    baseFee: '4500.00',
    description: 'English language and literature',
  },
  {
    name: 'Urdu',
    code: 'URD',
    classLevels: ['o-level'],
    baseFee: '4000.00',
    description: 'Urdu language and literature',
  },
];

/**
 * Default add-ons to create for new tenants
 */
const defaultAddOns = [
  {
    name: 'Registration Fee',
    description: 'One-time registration fee for new students',
    price: '2000.00',
    category: 'registration',
  },
  {
    name: 'Lab Fee',
    description: 'Laboratory usage and equipment fee',
    price: '1500.00',
    category: 'laboratory',
  },
  {
    name: 'Library Fee',
    description: 'Library access and book borrowing fee',
    price: '500.00',
    category: 'library',
  },
  {
    name: 'Transport Fee',
    description: 'Monthly transportation fee',
    price: '3000.00',
    category: 'transport',
  },
  {
    name: 'Examination Fee',
    description: 'Examination and assessment fee',
    price: '1000.00',
    category: 'examination',
  },
];

/**
 * Create a new tenant with complete setup
 */
export async function createTenant(onboardingData: TenantOnboardingData) {
  console.log('🏢 Starting tenant onboarding for:', onboardingData.name);
  
  // Start transaction
  return await db.transaction(async (tx) => {
    // 1. Check if slug is already taken
    const existingTenant = await tx.select()
      .from(tenants)
      .where(eq(tenants.slug, onboardingData.slug))
      .limit(1);
    
    if (existingTenant.length > 0) {
      throw new Error(`Slug '${onboardingData.slug}' is already taken. Please choose a different slug.`);
    }
    
    // 2. Check if admin email is already taken
    const existingAdmin = await tx.select()
      .from(users)
      .where(eq(users.email, onboardingData.adminEmail))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      throw new Error(`Admin email '${onboardingData.adminEmail}' is already registered. Please use a different email.`);
    }
    
    // 3. Create the tenant
    const [newTenant] = await tx.insert(tenants).values({
      name: onboardingData.name,
      slug: onboardingData.slug,
      domain: onboardingData.domain,
      primaryColor: onboardingData.primaryColor || '#3B82F6',
      secondaryColor: onboardingData.secondaryColor || '#1E40AF',
      logoUrl: onboardingData.logoUrl,
      timezone: onboardingData.timezone,
      currency: onboardingData.currency,
      address: onboardingData.address,
      phone: onboardingData.phone,
      email: onboardingData.email,
      website: onboardingData.website,
      isActive: true,
    }).returning();
    
    console.log('✅ Tenant created:', newTenant.id);
    
    // 4. Create admin user
    const adminCredentials = await generateUserCredentials();
    const [adminUser] = await tx.insert(users).values({
      tenantId: newTenant.id,
      email: onboardingData.adminEmail,
      firstName: onboardingData.adminFirstName,
      lastName: onboardingData.adminLastName,
      phone: onboardingData.adminPhone,
      role: 'management',
      isSuperAdmin: true,
      isTeacher: false,
      password: adminCredentials.password,
      temporaryPassword: adminCredentials.temporaryPassword,
      mustChangePassword: true,
      isActive: true,
      position: 'System Administrator',
    }).returning();
    
    console.log('✅ Admin user created:', adminUser.id);
    
    // 5. Setup default subjects if requested
    if (onboardingData.setupDefaultSubjects) {
      const subjectsToCreate = defaultSubjects.map(subject => ({
        ...subject,
        tenantId: newTenant.id,
        classLevels: subject.classLevels,
      }));
      
      const createdSubjects = await tx.insert(subjects).values(subjectsToCreate).returning();
      console.log(`✅ Created ${createdSubjects.length} default subjects`);
    }
    
    // 6. Setup default add-ons if requested
    if (onboardingData.setupDefaultAddOns) {
      const addOnsToCreate = defaultAddOns.map(addOn => ({
        ...addOn,
        tenantId: newTenant.id,
      }));
      
      const createdAddOns = await tx.insert(addOns).values(addOnsToCreate).returning();
      console.log(`✅ Created ${createdAddOns.length} default add-ons`);
    }
    
    return {
      tenant: newTenant,
      adminUser: {
        ...adminUser,
        temporaryPassword: adminCredentials.temporaryPassword, // Include for response
      },
    };
  });
}

/**
 * Setup tenant onboarding routes
 */
export function setupTenantOnboardingRoutes(app: Express) {
  // Create new tenant
  app.post('/api/tenants/onboard', async (req: Request, res: Response) => {
    try {
      console.log('📥 Tenant onboarding request received');
      
      // Validate request data
      const onboardingData = tenantOnboardingSchema.parse(req.body);
      
      // Create tenant
      const result = await createTenant(onboardingData);
      
      console.log('🎉 Tenant onboarding completed successfully');
      
      res.status(201).json({
        success: true,
        message: 'Tenant onboarded successfully',
        data: {
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
            primaryColor: result.tenant.primaryColor,
            secondaryColor: result.tenant.secondaryColor,
            isActive: result.tenant.isActive,
          },
          adminUser: {
            id: result.adminUser.id,
            email: result.adminUser.email,
            firstName: result.adminUser.firstName,
            lastName: result.adminUser.lastName,
            temporaryPassword: result.adminUser.temporaryPassword,
            mustChangePassword: result.adminUser.mustChangePassword,
          },
        },
      });
      
    } catch (error) {
      console.error('❌ Tenant onboarding failed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to onboard tenant',
      });
    }
  });
  
  // Get tenant by slug (for domain routing)
  app.get('/api/tenants/by-slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const [tenant] = await db.select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        domain: tenants.domain,
        primaryColor: tenants.primaryColor,
        secondaryColor: tenants.secondaryColor,
        logoUrl: tenants.logoUrl,
        faviconUrl: tenants.faviconUrl,
        timezone: tenants.timezone,
        currency: tenants.currency,
        isActive: tenants.isActive,
      })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }
      
      if (!tenant.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Tenant is not active',
        });
      }
      
      res.json({
        success: true,
        data: tenant,
      });
      
    } catch (error) {
      console.error('❌ Error fetching tenant by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenant',
      });
    }
  });
  
  // Check slug availability
  app.get('/api/tenants/check-slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.json({
          available: false,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens',
        });
      }
      
      const existingTenant = await db.select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);
      
      const available = existingTenant.length === 0;
      
      res.json({
        available,
        message: available ? 'Slug is available' : 'Slug is already taken',
      });
      
    } catch (error) {
      console.error('❌ Error checking slug availability:', error);
      res.status(500).json({
        available: false,
        message: 'Failed to check slug availability',
      });
    }
  });
  
  // Get tenant configuration (for current tenant)
  app.get('/api/tenant/config', async (req: Request, res: Response) => {
    try {
      const user = req.session?.user as any;
      
      if (!user?.tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }
      
      const [tenant] = await db.select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        primaryColor: tenants.primaryColor,
        secondaryColor: tenants.secondaryColor,
        logoUrl: tenants.logoUrl,
        faviconUrl: tenants.faviconUrl,
        timezone: tenants.timezone,
        currency: tenants.currency,
        address: tenants.address,
        phone: tenants.phone,
        email: tenants.email,
        website: tenants.website,
      })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }
      
      res.json({
        success: true,
        data: tenant,
      });
      
    } catch (error) {
      console.error('❌ Error fetching tenant config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenant configuration',
      });
    }
  });
}

export default {
  createTenant,
  setupTenantOnboardingRoutes,
};

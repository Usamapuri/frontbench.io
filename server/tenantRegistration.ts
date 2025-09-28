import { Router, Request, Response } from 'express';
import { db } from './db';
import { tenants, users, subjects } from '@shared/schema';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { isValidSubdomain, isReservedSubdomain } from './subdomainMiddleware';

const router = Router();

// Validation schemas
const registerTenantSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/, 'Invalid subdomain format'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * POST /api/tenants/register
 * Register a new tenant (school)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerTenantSchema.parse(req.body);
    const { schoolName, subdomain, adminName, adminEmail, adminPassword, phone, address } = validatedData;

    // Check if subdomain is reserved
    if (isReservedSubdomain(subdomain)) {
      return res.status(400).json({
        error: 'Subdomain reserved',
        message: 'This subdomain is reserved and cannot be used'
      });
    }

    // Check if subdomain already exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (existingTenant.length > 0) {
      return res.status(400).json({
        error: 'Subdomain taken',
        message: 'This subdomain is already taken. Please choose another one.'
      });
    }

    // Check if admin email already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      return res.status(400).json({
        error: 'Email taken',
        message: 'This email address is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create tenant and admin user in a transaction
    const tenantId = randomUUID();
    const adminUserId = randomUUID();

    // Create tenant
    await db.insert(tenants).values({
      id: tenantId,
      name: schoolName,
      slug: subdomain,
      subdomain: subdomain,
      email: adminEmail,
      phone: phone,
      address: address,
      isActive: true,
      isVerified: false, // Will be verified via email
      primaryColor: '#3B82F6', // Default blue theme
      secondaryColor: '#1E40AF',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    });

    // Create admin user
    await db.insert(users).values({
      id: adminUserId,
      tenantId: tenantId,
      email: adminEmail,
      password: hashedPassword,
      firstName: adminName.split(' ')[0] || adminName,
      lastName: adminName.split(' ').slice(1).join(' ') || '',
      role: 'management',
      isSuperAdmin: true,
      isTeacher: false,
      isActive: true,
    });

    // Create default subjects for the new tenant
    const defaultSubjects = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English', code: 'ENG' },
      { name: 'Science', code: 'SCI' },
      { name: 'Social Studies', code: 'SS' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Physical Education', code: 'PE' }
    ];

    const subjectPromises = defaultSubjects.map(subject => 
      db.insert(subjects).values({
        id: randomUUID(),
        tenantId: tenantId,
        name: subject.name,
        code: subject.code,
        classLevels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        baseFee: '1000.00',
        description: `${subject.name} subject`,
        isActive: true,
      })
    );

    await Promise.all(subjectPromises);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'School account created successfully!',
      tenant: {
        id: tenantId,
        name: schoolName,
        subdomain: subdomain,
        url: `https://${subdomain}.frontbench.io`
      },
      admin: {
        id: adminUserId,
        email: adminEmail,
        name: adminName
      }
    });

  } catch (error) {
    console.error('Tenant registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please check your input and try again',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred while creating your school account. Please try again.'
    });
  }
});

/**
 * GET /api/tenants/check-subdomain/:subdomain
 * Check if subdomain is available
 */
router.get('/check-subdomain/:subdomain', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params;

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return res.json({
        available: false,
        reason: 'Invalid subdomain format'
      });
    }

    // Check if subdomain is reserved
    if (isReservedSubdomain(subdomain)) {
      return res.json({
        available: false,
        reason: 'This subdomain is reserved'
      });
    }

    // Check if subdomain exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    const available = existingTenant.length === 0;

    res.json({
      available,
      subdomain,
      url: available ? `https://${subdomain}.frontbench.io` : null
    });

  } catch (error) {
    console.error('Subdomain check error:', error);
    res.status(500).json({
      error: 'Failed to check subdomain availability'
    });
  }
});

/**
 * GET /api/tenants/verify/:token
 * Verify tenant email (placeholder for email verification)
 */
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    // This would typically verify an email token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Email verification not implemented yet'
    });
  } catch (error) {
    console.error('Tenant verification error:', error);
    res.status(500).json({
      error: 'Verification failed'
    });
  }
});

export { router as tenantRegistrationRouter };

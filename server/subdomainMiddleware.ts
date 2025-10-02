import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
        domain?: string;
        primaryColor: string;
        secondaryColor: string;
        logoUrl?: string;
        faviconUrl?: string;
        timezone: string;
        currency: string;
        isActive: boolean;
        isVerified: boolean;
      };
      subdomain?: string;
    }
  }
}

/**
 * Middleware to resolve tenant from subdomain or domain
 */
export async function subdomainMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const hostname = req.get('host') || req.hostname;
    // Don't try to set hostname as it's read-only, just use the variable
    
    // Skip subdomain resolution for localhost and IP addresses
    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168.') || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
      // For development, use default tenant
      req.tenant = {
        id: 'default-tenant-id',
        name: 'Default Development Tenant',
        subdomain: 'app',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        timezone: 'Asia/Karachi',
        currency: 'PKR',
        isActive: true,
        isVerified: true
      };
      req.subdomain = 'app';
      return next();
    }

    // Parse subdomain from hostname
    const parts = hostname.split('.');
    let subdomain = '';
    let isMainDomain = false;

    if (parts.length >= 3) {
      // Format: subdomain.frontbench.io
      subdomain = parts[0];
    } else if (parts.length === 2) {
      // Format: frontbench.io (main domain)
      isMainDomain = true;
    }

    req.subdomain = subdomain;

    // Handle main domain (frontbench.io) - show landing page
    if (isMainDomain || !subdomain) {
      req.tenant = null; // No tenant for main domain
      return next();
    }

    // Handle app subdomain (app.frontbench.io) - show landing page
    if (subdomain === 'app') {
      req.tenant = null;
      return next();
    }

    // Look up tenant by subdomain
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (tenant.length === 0) {
      // Tenant not found - show 404 or redirect to main domain
      return res.status(404).json({
        error: 'School not found',
        message: `The school "${subdomain}" was not found. Please check the URL or contact support.`,
        subdomain: subdomain
      });
    }

    const tenantData = tenant[0];

    // Check if tenant is active
    if (!tenantData.isActive) {
      return res.status(403).json({
        error: 'School account suspended',
        message: 'This school account has been suspended. Please contact support.',
        subdomain: subdomain
      });
    }

    // Attach tenant info to request
    req.tenant = {
      id: tenantData.id,
      name: tenantData.name,
      subdomain: tenantData.subdomain,
      domain: tenantData.domain || undefined,
      primaryColor: tenantData.primaryColor || '#3B82F6',
      secondaryColor: tenantData.secondaryColor || '#1E40AF',
      logoUrl: tenantData.logoUrl || undefined,
      faviconUrl: tenantData.faviconUrl || undefined,
      timezone: tenantData.timezone || 'Asia/Karachi',
      currency: tenantData.currency || 'PKR',
      isActive: tenantData.isActive,
      isVerified: tenantData.isVerified
    };

    next();
  } catch (error) {
    console.error('Subdomain middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve school information'
    });
  }
}

/**
 * Middleware to require tenant context
 */
export function requireTenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'Tenant context required',
      message: 'This endpoint requires a valid school context'
    });
  }
  next();
}

/**
 * Helper function to get tenant-aware URL
 */
export function getTenantUrl(subdomain: string, path: string = '', useHttps: boolean = true): string {
  const protocol = useHttps ? 'https' : 'http';
  return `${protocol}://${subdomain}.frontbench.io${path}`;
}

/**
 * Helper function to validate subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Subdomain must be 3-63 characters, alphanumeric and hyphens only
  const regex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
}

/**
 * Helper function to check if subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  const reserved = [
    'www', 'app', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store',
    'support', 'help', 'docs', 'status', 'dev', 'staging', 'test', 'demo',
    'cdn', 'assets', 'static', 'img', 'images', 'js', 'css', 'fonts'
  ];
  return reserved.includes(subdomain.toLowerCase());
}

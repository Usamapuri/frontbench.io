import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include super admin info
declare global {
  namespace Express {
    interface Request {
      isSuperAdmin?: boolean;
      superAdminTenantId?: string;
    }
  }
}

/**
 * Middleware to check if user is a super admin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;
  
  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  // Check if user has super admin role
  if (user.role !== 'super_admin' && !user.isSuperAdmin) {
    return res.status(403).json({
      error: 'Super admin access required',
      message: 'This resource is only accessible to super administrators'
    });
  }

  req.isSuperAdmin = true;
  req.superAdminTenantId = user.tenantId; // Super admin's tenant ID for context
  next();
}

/**
 * Middleware to allow super admin to access any tenant's data
 */
export function superAdminTenantAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;
  
  if (!user || (user.role !== 'super_admin' && !user.isSuperAdmin)) {
    return res.status(403).json({
      error: 'Super admin access required',
      message: 'This resource requires super administrator privileges'
    });
  }

  // Super admins can access any tenant's data
  // The tenant context will be set by the regular tenant middleware
  next();
}

/**
 * Helper function to log super admin actions
 */
export function logSuperAdminAction(
  req: Request, 
  action: string, 
  resource: string, 
  resourceId?: string, 
  details?: any
) {
  const user = req.session?.user;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  console.log(`[SUPER_ADMIN] ${user?.email} performed ${action} on ${resource}${resourceId ? ` (${resourceId})` : ''}`, {
    userId: user?.id,
    tenantId: req.tenant?.id,
    ipAddress,
    userAgent,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to check if a user can access a specific tenant
 */
export function canAccessTenant(user: any, tenantId: string): boolean {
  // Super admins can access any tenant
  if (user.role === 'super_admin' || user.isSuperAdmin) {
    return true;
  }

  // Regular users can only access their own tenant
  return user.tenantId === tenantId;
}

/**
 * Helper function to get accessible tenant IDs for a user
 */
export function getAccessibleTenantIds(user: any): string[] {
  // Super admins can access all tenants
  if (user.role === 'super_admin' || user.isSuperAdmin) {
    return []; // Empty array means all tenants
  }

  // Regular users can only access their own tenant
  return [user.tenantId];
}

// Export alias for compatibility
export const superAdminMiddleware = requireSuperAdmin;

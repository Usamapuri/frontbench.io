/**
 * Tenant Context Management for Multi-Tenant Data Isolation
 * 
 * This module provides middleware and utilities to ensure that all database
 * operations are scoped to the current user's tenant, preventing data leaks
 * between different schools/organizations.
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

// Type definitions for tenant context
export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  isSuperAdmin: boolean;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isSuperAdmin: boolean;
  isTeacher: boolean;
}

// Async local storage for tenant context
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Middleware to extract and store tenant context from authenticated user session
 */
export function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user as AuthenticatedUser;
  
  if (!user) {
    // If no user in session, continue without setting context
    // Auth middleware will handle authentication requirements
    return next();
  }

  if (!user.tenantId) {
    console.error('❌ User session missing tenantId:', user);
    return res.status(500).json({ 
      message: 'Invalid session: missing tenant information. Please login again.' 
    });
  }

  // Create tenant context
  const context: TenantContext = {
    tenantId: user.tenantId,
    userId: user.id,
    userRole: user.role,
    isSuperAdmin: user.isSuperAdmin,
  };

  // Store context in async local storage for the duration of this request
  tenantContextStorage.run(context, () => {
    next();
  });
}

/**
 * Get the current tenant context
 * @throws Error if no tenant context is available
 */
export function getCurrentTenantContext(): TenantContext {
  const context = tenantContextStorage.getStore();
  
  if (!context) {
    throw new Error(
      'No tenant context available. This usually means the request is not authenticated ' +
      'or tenantContextMiddleware was not applied to the route.'
    );
  }
  
  return context;
}

/**
 * Get the current tenant ID safely
 * @returns tenantId if available, null otherwise
 */
export function getCurrentTenantId(): string | null {
  try {
    const context = getCurrentTenantContext();
    return context.tenantId;
  } catch {
    return null;
  }
}

/**
 * Get the current user ID safely
 * @returns userId if available, null otherwise
 */
export function getCurrentUserId(): string | null {
  try {
    const context = getCurrentTenantContext();
    return context.userId;
  } catch {
    return null;
  }
}

/**
 * Check if the current user is a super admin
 */
export function isCurrentUserSuperAdmin(): boolean {
  try {
    const context = getCurrentTenantContext();
    return context.isSuperAdmin;
  } catch {
    return false;
  }
}

/**
 * Ensure tenant context exists, throw error if not
 * Use this in database operations that require tenant isolation
 */
export function requireTenantContext(): TenantContext {
  const context = getCurrentTenantContext();
  
  if (!context.tenantId) {
    throw new Error('Tenant ID is required for this operation');
  }
  
  return context;
}

/**
 * Validate that a resource belongs to the current tenant
 * @param resourceTenantId - The tenant ID of the resource being accessed
 * @param resourceType - Type of resource for error messaging
 */
export function validateTenantAccess(resourceTenantId: string, resourceType: string = 'resource'): void {
  const context = requireTenantContext();
  
  if (resourceTenantId !== context.tenantId) {
    throw new Error(
      `Access denied: ${resourceType} belongs to a different tenant. ` +
      `Expected: ${context.tenantId}, Got: ${resourceTenantId}`
    );
  }
}

/**
 * Enhanced middleware for routes that require tenant context
 * This ensures both authentication and tenant context are available
 */
export function requireTenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    requireTenantContext();
    next();
  } catch (error) {
    console.error('❌ Tenant context required but not available:', error);
    res.status(401).json({ 
      message: 'Authentication required. Please login to access this resource.' 
    });
  }
}

/**
 * Development helper to log tenant context for debugging
 */
export function logTenantContext(operation: string): void {
  try {
    const context = getCurrentTenantContext();
    console.log(`🏢 [${operation}] Tenant Context:`, {
      tenantId: context.tenantId,
      userId: context.userId,
      role: context.userRole,
      isSuperAdmin: context.isSuperAdmin,
    });
  } catch {
    console.log(`🏢 [${operation}] No tenant context available`);
  }
}

export default {
  tenantContextMiddleware,
  requireTenantContextMiddleware,
  getCurrentTenantContext,
  getCurrentTenantId,
  getCurrentUserId,
  isCurrentUserSuperAdmin,
  requireTenantContext,
  validateTenantAccess,
  logTenantContext,
};

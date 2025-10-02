import { Router, Request, Response } from 'express';
import { db } from './db';
import { 
  tenants, 
  users, 
  students, 
  tenantAnalytics, 
  subscriptions, 
  billingHistory, 
  systemNotifications,
  auditLogs,
  systemHealth
} from '@shared/schema';
import { eq, desc, gte, lte, sql, count, sum, avg } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin, logSuperAdminAction } from './superAdminMiddleware';

const router = Router();

// Apply super admin middleware to all routes
router.use(requireSuperAdmin);

/**
 * GET /api/super-admin/dashboard
 * Get super admin dashboard overview
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    logSuperAdminAction(req, 'view', 'dashboard');

    // Get overall statistics
    const [totalTenants] = await db.select({ count: count() }).from(tenants);
    const [activeTenants] = await db.select({ count: count() }).from(tenants).where(eq(tenants.isActive, true));
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalStudents] = await db.select({ count: count() }).from(students);

    // Get revenue statistics
    const [revenueStats] = await db
      .select({
        totalRevenue: sum(billingHistory.amount),
        averageMonthlyRevenue: avg(billingHistory.amount),
        paidInvoices: count()
      })
      .from(billingHistory)
      .where(eq(billingHistory.status, 'paid'));

    // Get subscription statistics
    const subscriptionStats = await db
      .select({
        plan: tenants.subscriptionPlan,
        count: count()
      })
      .from(tenants)
      .groupBy(tenants.subscriptionPlan);

    // Get recent tenant registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        subscriptionPlan: tenants.subscriptionPlan,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        totalUsers: tenants.totalUsers,
        totalStudents: tenants.totalStudents
      })
      .from(tenants)
      .where(gte(tenants.createdAt, thirtyDaysAgo))
      .orderBy(desc(tenants.createdAt))
      .limit(10);

    // Get system health status
    const systemHealthStatus = await db
      .select()
      .from(systemHealth)
      .orderBy(desc(systemHealth.lastCheck))
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalTenants: totalTenants.count,
          activeTenants: activeTenants.count,
          totalUsers: totalUsers.count,
          totalStudents: totalStudents.count,
          totalRevenue: revenueStats.totalRevenue || 0,
          averageMonthlyRevenue: revenueStats.averageMonthlyRevenue || 0,
          paidInvoices: revenueStats.paidInvoices || 0
        },
        subscriptionDistribution: subscriptionStats,
        recentTenants,
        systemHealth: systemHealthStatus
      }
    });

  } catch (error) {
    console.error('Super admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while loading the dashboard'
    });
  }
});

/**
 * GET /api/super-admin/tenants
 * Get all tenants with pagination and filtering
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const plan = req.query.plan as string;

    logSuperAdminAction(req, 'list', 'tenants', undefined, { page, limit, search, status, plan });

    let whereConditions = [];

    if (search) {
      whereConditions.push(
        sql`${tenants.name} ILIKE ${`%${search}%`} OR ${tenants.subdomain} ILIKE ${`%${search}%`} OR ${tenants.email} ILIKE ${`%${search}%`}`
      );
    }

    if (status) {
      if (status === 'active') {
        whereConditions.push(eq(tenants.isActive, true));
      } else if (status === 'inactive') {
        whereConditions.push(eq(tenants.isActive, false));
      }
    }

    if (plan) {
      whereConditions.push(eq(tenants.subscriptionPlan, plan));
    }

    const whereClause = whereConditions.length > 0 ? whereConditions : undefined;

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(tenants)
      .where(whereClause);

    // Get tenants with pagination
    const tenantList = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        email: tenants.email,
        phone: tenants.phone,
        subscriptionPlan: tenants.subscriptionPlan,
        subscriptionStatus: tenants.subscriptionStatus,
        isActive: tenants.isActive,
        isVerified: tenants.isVerified,
        totalUsers: tenants.totalUsers,
        totalStudents: tenants.totalStudents,
        maxUsers: tenants.maxUsers,
        maxStudents: tenants.maxStudents,
        lastLoginAt: tenants.lastLoginAt,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt
      })
      .from(tenants)
      .where(whereClause)
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      data: {
        tenants: tenantList,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: 'An error occurred while loading tenants'
    });
  }
});

/**
 * GET /api/super-admin/tenants/:id
 * Get detailed information about a specific tenant
 */
router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logSuperAdminAction(req, 'view', 'tenant', id);

    // Get tenant details
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'The specified tenant does not exist'
      });
    }

    // Get tenant analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await db
      .select()
      .from(tenantAnalytics)
      .where(
        sql`${tenantAnalytics.tenantId} = ${id} AND ${tenantAnalytics.date} >= ${thirtyDaysAgo.toISOString().split('T')[0]}`
      )
      .orderBy(desc(tenantAnalytics.date))
      .limit(30);

    // Get subscription history
    const subscriptionHistory = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, id))
      .orderBy(desc(subscriptions.createdAt));

    // Get billing history
    const billing = await db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.tenantId, id))
      .orderBy(desc(billingHistory.createdAt))
      .limit(12);

    res.json({
      success: true,
      data: {
        tenant,
        analytics,
        subscriptionHistory,
        billing
      }
    });

  } catch (error) {
    console.error('Get tenant details error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenant details',
      message: 'An error occurred while loading tenant information'
    });
  }
});

/**
 * PUT /api/super-admin/tenants/:id
 * Update tenant information
 */
router.put('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    logSuperAdminAction(req, 'update', 'tenant', id, updateData);

    // Validate update data
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'website',
      'subscriptionPlan', 'subscriptionStatus', 'maxUsers', 'maxStudents',
      'isActive', 'isVerified', 'primaryColor', 'secondaryColor'
    ];

    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        message: 'Please provide valid fields to update'
      });
    }

    filteredData.updatedAt = new Date();

    // Update tenant
    await db
      .update(tenants)
      .set(filteredData)
      .where(eq(tenants.id, id));

    // Get updated tenant
    const [updatedTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    res.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      error: 'Failed to update tenant',
      message: 'An error occurred while updating tenant information'
    });
  }
});

/**
 * POST /api/super-admin/tenants/:id/suspend
 * Suspend a tenant
 */
router.post('/tenants/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    logSuperAdminAction(req, 'suspend', 'tenant', id, { reason });

    await db
      .update(tenants)
      .set({
        isActive: false,
        subscriptionStatus: 'suspended',
        updatedAt: new Date()
      })
      .where(eq(tenants.id, id));

    // Create system notification for the tenant
    await db.insert(systemNotifications).values({
      tenantId: id,
      type: 'warning',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason || 'Administrative action'}`,
      category: 'system',
      priority: 'high',
      isDismissible: false
    });

    res.json({
      success: true,
      message: 'Tenant suspended successfully'
    });

  } catch (error) {
    console.error('Suspend tenant error:', error);
    res.status(500).json({
      error: 'Failed to suspend tenant',
      message: 'An error occurred while suspending the tenant'
    });
  }
});

/**
 * POST /api/super-admin/tenants/:id/activate
 * Activate a suspended tenant
 */
router.post('/tenants/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logSuperAdminAction(req, 'activate', 'tenant', id);

    await db
      .update(tenants)
      .set({
        isActive: true,
        subscriptionStatus: 'active',
        updatedAt: new Date()
      })
      .where(eq(tenants.id, id));

    // Create system notification for the tenant
    await db.insert(systemNotifications).values({
      tenantId: id,
      type: 'success',
      title: 'Account Reactivated',
      message: 'Your account has been reactivated and is now accessible.',
      category: 'system',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Tenant activated successfully'
    });

  } catch (error) {
    console.error('Activate tenant error:', error);
    res.status(500).json({
      error: 'Failed to activate tenant',
      message: 'An error occurred while activating the tenant'
    });
  }
});

/**
 * GET /api/super-admin/analytics
 * Get system-wide analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;

    logSuperAdminAction(req, 'view', 'analytics', undefined, { period, days });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get tenant growth over time
    const tenantGrowth = await db
      .select({
        date: sql<string>`DATE(${tenants.createdAt})`,
        count: count()
      })
      .from(tenants)
      .where(gte(tenants.createdAt, startDate))
      .groupBy(sql`DATE(${tenants.createdAt})`)
      .orderBy(sql`DATE(${tenants.createdAt})`);

    // Get revenue trends
    const revenueTrends = await db
      .select({
        date: sql<string>`DATE(${billingHistory.createdAt})`,
        revenue: sum(billingHistory.amount),
        invoices: count()
      })
      .from(billingHistory)
      .where(
        sql`${billingHistory.status} = 'paid' AND ${billingHistory.createdAt} >= ${startDate.toISOString()}`
      )
      .groupBy(sql`DATE(${billingHistory.createdAt})`)
      .orderBy(sql`DATE(${billingHistory.createdAt})`);

    // Get subscription plan distribution
    const planDistribution = await db
      .select({
        plan: tenants.subscriptionPlan,
        count: count()
      })
      .from(tenants)
      .groupBy(tenants.subscriptionPlan);

    // Get geographic distribution (based on timezone)
    const geographicDistribution = await db
      .select({
        timezone: tenants.timezone,
        count: count()
      })
      .from(tenants)
      .groupBy(tenants.timezone);

    res.json({
      success: true,
      data: {
        period,
        tenantGrowth,
        revenueTrends,
        planDistribution,
        geographicDistribution
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: 'An error occurred while loading analytics data'
    });
  }
});

/**
 * GET /api/super-admin/audit-logs
 * Get audit logs for super admin actions
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const resource = req.query.resource as string;

    logSuperAdminAction(req, 'view', 'audit_logs', undefined, { page, limit, action, resource });

    let whereConditions = [];

    if (action) {
      whereConditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      whereConditions.push(eq(auditLogs.resource, resource));
    }

    const whereClause = whereConditions.length > 0 ? whereConditions : undefined;

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    // Get audit logs
    const logs = await db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt
      })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: 'An error occurred while loading audit logs'
    });
  }
});

export { router as superAdminRoutes };

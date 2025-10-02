import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { 
  systemNotifications, 
  tenantAnalytics,
  tenants,
  users,
  subscriptions,
  billingHistory
} from '../shared/schema';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  tenantId?: string;
  userId?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'billing' | 'usage' | 'security' | 'maintenance';
  metadata?: any;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: Notification['type'];
  category: Notification['category'];
  priority: Notification['priority'];
  variables: string[]; // Template variables like {tenantName}, {usage}, etc.
}

export class NotificationService {
  // Pre-defined notification templates
  private static templates: NotificationTemplate[] = [
    {
      id: 'tenant_usage_warning',
      name: 'Tenant Usage Warning',
      title: 'Usage Limit Warning',
      message: '{tenantName} is approaching their {limitType} limit ({current}/{max})',
      type: 'warning',
      category: 'usage',
      priority: 'medium',
      variables: ['tenantName', 'limitType', 'current', 'max']
    },
    {
      id: 'tenant_usage_exceeded',
      name: 'Tenant Usage Exceeded',
      title: 'Usage Limit Exceeded',
      message: '{tenantName} has exceeded their {limitType} limit ({current}/{max})',
      type: 'error',
      category: 'usage',
      priority: 'high',
      variables: ['tenantName', 'limitType', 'current', 'max']
    },
    {
      id: 'subscription_expiring',
      name: 'Subscription Expiring',
      title: 'Subscription Expiring Soon',
      message: '{tenantName}\'s {planName} subscription expires on {expiryDate}',
      type: 'warning',
      category: 'billing',
      priority: 'medium',
      variables: ['tenantName', 'planName', 'expiryDate']
    },
    {
      id: 'subscription_expired',
      name: 'Subscription Expired',
      title: 'Subscription Expired',
      message: '{tenantName}\'s {planName} subscription has expired',
      type: 'error',
      category: 'billing',
      priority: 'high',
      variables: ['tenantName', 'planName']
    },
    {
      id: 'payment_failed',
      name: 'Payment Failed',
      title: 'Payment Failed',
      message: 'Payment failed for {tenantName}\'s {planName} subscription (${amount})',
      type: 'error',
      category: 'billing',
      priority: 'high',
      variables: ['tenantName', 'planName', 'amount']
    },
    {
      id: 'system_maintenance',
      name: 'System Maintenance',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for {maintenanceDate} from {startTime} to {endTime}',
      type: 'info',
      category: 'maintenance',
      priority: 'medium',
      variables: ['maintenanceDate', 'startTime', 'endTime']
    },
    {
      id: 'security_alert',
      name: 'Security Alert',
      title: 'Security Alert',
      message: 'Suspicious activity detected for {tenantName}: {activity}',
      type: 'error',
      category: 'security',
      priority: 'urgent',
      variables: ['tenantName', 'activity']
    },
    {
      id: 'new_tenant_registered',
      name: 'New Tenant Registered',
      title: 'New Tenant Registered',
      message: 'New tenant registered: {tenantName} ({subdomain}.frontbench.io)',
      type: 'success',
      category: 'system',
      priority: 'low',
      variables: ['tenantName', 'subdomain']
    }
  ];

  /**
   * Create a new notification
   */
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationId = crypto.randomUUID();
      const now = new Date();

      await db
        .insert(systemNotifications)
        .values({
          id: notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          tenantId: notification.tenantId || null,
          userId: notification.userId || null,
          isRead: notification.isRead,
          priority: notification.priority,
          category: notification.category,
          metadata: notification.metadata || null,
          expiresAt: notification.expiresAt || null,
          createdAt: now,
          updatedAt: now
        });

      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create notification from template
   */
  static async createNotificationFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: {
      tenantId?: string;
      userId?: string;
      priority?: Notification['priority'];
      expiresAt?: Date;
    } = {}
  ): Promise<string> {
    try {
      const template = this.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Replace variables in title and message
      let title = template.title;
      let message = template.message;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        message = message.replace(new RegExp(placeholder, 'g'), String(value));
      }

      return await this.createNotification({
        type: template.type,
        title,
        message,
        tenantId: options.tenantId,
        userId: options.userId,
        isRead: false,
        priority: options.priority || template.priority,
        category: template.category,
        expiresAt: options.expiresAt
      });
    } catch (error) {
      console.error('Error creating notification from template:', error);
      throw new Error('Failed to create notification from template');
    }
  }

  /**
   * Get notifications for a user or tenant
   */
  static async getNotifications(
    options: {
      tenantId?: string;
      userId?: string;
      category?: Notification['category'];
      isRead?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { tenantId, userId, category, isRead, limit = 50, offset = 0 } = options;
      
      let whereConditions = [];
      
      if (tenantId) {
        whereConditions.push(eq(systemNotifications.tenantId, tenantId));
      }
      
      if (userId) {
        whereConditions.push(eq(systemNotifications.userId, userId));
      }
      
      if (category) {
        whereConditions.push(eq(systemNotifications.category, category));
      }
      
      if (typeof isRead === 'boolean') {
        whereConditions.push(eq(systemNotifications.isRead, isRead));
      }
      
      // Add expiry check
      whereConditions.push(
        or(
          eq(systemNotifications.expiresAt, null),
          gte(systemNotifications.expiresAt, new Date())
        )
      );

      const notifications = await db
        .select()
        .from(systemNotifications)
        .where(and(...whereConditions))
        .orderBy(desc(systemNotifications.createdAt))
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(systemNotifications)
        .where(and(...whereConditions));

      return {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type as Notification['type'],
          title: n.title,
          message: n.message,
          tenantId: n.tenantId || undefined,
          userId: n.userId || undefined,
          isRead: n.isRead,
          priority: n.priority as Notification['priority'],
          category: n.category as Notification['category'],
          metadata: n.metadata || undefined,
          createdAt: n.createdAt,
          expiresAt: n.expiresAt || undefined
        })),
        total: totalResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await db
        .update(systemNotifications)
        .set({
          isRead: true,
          updatedAt: new Date()
        })
        .where(eq(systemNotifications.id, notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user or tenant
   */
  static async markAllAsRead(options: {
    tenantId?: string;
    userId?: string;
  }): Promise<void> {
    try {
      const { tenantId, userId } = options;
      
      let whereConditions = [eq(systemNotifications.isRead, false)];
      
      if (tenantId) {
        whereConditions.push(eq(systemNotifications.tenantId, tenantId));
      }
      
      if (userId) {
        whereConditions.push(eq(systemNotifications.userId, userId));
      }

      await db
        .update(systemNotifications)
        .set({
          isRead: true,
          updatedAt: new Date()
        })
        .where(and(...whereConditions));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete expired notifications
   */
  static async deleteExpiredNotifications(): Promise<number> {
    try {
      const result = await db
        .delete(systemNotifications)
        .where(
          and(
            ne(systemNotifications.expiresAt, null),
            lte(systemNotifications.expiresAt, new Date())
          )
        );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      return 0;
    }
  }

  /**
   * Check for usage limit warnings
   */
  static async checkUsageLimits(): Promise<void> {
    try {
      const tenants = await db
        .select()
        .from(tenants)
        .where(eq(tenants.isActive, true));

      for (const tenant of tenants) {
        // Get latest analytics for this tenant
        const latestAnalytics = await db
          .select()
          .from(tenantAnalytics)
          .where(eq(tenantAnalytics.tenantId, tenant.id))
          .orderBy(desc(tenantAnalytics.date))
          .limit(1);

        if (latestAnalytics.length === 0) continue;

        const analytics = latestAnalytics[0];
        const maxUsers = tenant.maxUsers;
        const maxStudents = tenant.maxStudents;

        // Check user limits
        if (maxUsers > 0) {
          const userUsagePercent = (analytics.totalUsers / maxUsers) * 100;
          
          if (userUsagePercent >= 90) {
            await this.createNotificationFromTemplate(
              'tenant_usage_exceeded',
              {
                tenantName: tenant.name,
                limitType: 'user',
                current: analytics.totalUsers,
                max: maxUsers
              },
              { tenantId: tenant.id, priority: 'high' }
            );
          } else if (userUsagePercent >= 80) {
            await this.createNotificationFromTemplate(
              'tenant_usage_warning',
              {
                tenantName: tenant.name,
                limitType: 'user',
                current: analytics.totalUsers,
                max: maxUsers
              },
              { tenantId: tenant.id, priority: 'medium' }
            );
          }
        }

        // Check student limits
        if (maxStudents > 0) {
          const studentUsagePercent = (analytics.totalStudents / maxStudents) * 100;
          
          if (studentUsagePercent >= 90) {
            await this.createNotificationFromTemplate(
              'tenant_usage_exceeded',
              {
                tenantName: tenant.name,
                limitType: 'student',
                current: analytics.totalStudents,
                max: maxStudents
              },
              { tenantId: tenant.id, priority: 'high' }
            );
          } else if (studentUsagePercent >= 80) {
            await this.createNotificationFromTemplate(
              'tenant_usage_warning',
              {
                tenantName: tenant.name,
                limitType: 'student',
                current: analytics.totalStudents,
                max: maxStudents
              },
              { tenantId: tenant.id, priority: 'medium' }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  }

  /**
   * Check for subscription expirations
   */
  static async checkSubscriptionExpirations(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Get subscriptions expiring in the next 3 days
      const expiringSubscriptions = await db
        .select({
          subscription: subscriptions,
          tenant: tenants
        })
        .from(subscriptions)
        .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
        .where(
          and(
            eq(subscriptions.status, 'active'),
            lte(subscriptions.endDate, threeDaysFromNow),
            gte(subscriptions.endDate, now)
          )
        );

      for (const { subscription, tenant } of expiringSubscriptions) {
        await this.createNotificationFromTemplate(
          'subscription_expiring',
          {
            tenantName: tenant.name,
            planName: subscription.plan,
            expiryDate: subscription.endDate.toLocaleDateString()
          },
          { tenantId: tenant.id, priority: 'medium' }
        );
      }

      // Get expired subscriptions
      const expiredSubscriptions = await db
        .select({
          subscription: subscriptions,
          tenant: tenants
        })
        .from(subscriptions)
        .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
        .where(
          and(
            eq(subscriptions.status, 'active'),
            lte(subscriptions.endDate, now)
          )
        );

      for (const { subscription, tenant } of expiredSubscriptions) {
        await this.createNotificationFromTemplate(
          'subscription_expired',
          {
            tenantName: tenant.name,
            planName: subscription.plan
          },
          { tenantId: tenant.id, priority: 'high' }
        );
      }
    } catch (error) {
      console.error('Error checking subscription expirations:', error);
    }
  }

  /**
   * Get notification templates
   */
  static getTemplates(): NotificationTemplate[] {
    return this.templates;
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(options: {
    tenantId?: string;
    userId?: string;
  } = {}): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const { notifications } = await this.getNotifications({
        ...options,
        limit: 1000 // Get a large number to calculate stats
      });

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      notifications.forEach(notification => {
        stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification stats');
    }
  }
}

// Import missing functions
import { or, ne, count } from 'drizzle-orm';

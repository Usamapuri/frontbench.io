import { Router } from 'express';
import { NotificationService } from './notificationService';
import { requireTenantMiddleware } from './subdomainMiddleware';
import { superAdminMiddleware } from './superAdminMiddleware';

const router = Router();

/**
 * Get notifications for current user/tenant
 * Requires authentication
 */
router.get('/', requireTenantMiddleware, async (req, res) => {
  try {
    const { category, isRead, limit = '50', offset = '0' } = req.query;
    const tenantId = req.tenant?.id;
    const userId = req.session?.user?.id;

    const result = await NotificationService.getNotifications({
      tenantId,
      userId,
      category: category as any,
      isRead: isRead ? isRead === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * Get notification statistics
 * Requires authentication
 */
router.get('/stats', requireTenantMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.session?.user?.id;

    const stats = await NotificationService.getNotificationStats({
      tenantId,
      userId
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification stats'
    });
  }
});

/**
 * Mark notification as read
 * Requires authentication
 */
router.put('/:notificationId/read', requireTenantMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    await NotificationService.markAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * Mark all notifications as read
 * Requires authentication
 */
router.put('/read-all', requireTenantMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.session?.user?.id;

    await NotificationService.markAllAsRead({
      tenantId,
      userId
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * Get notification templates (super admin only)
 * Requires super admin authentication
 */
router.get('/admin/templates', superAdminMiddleware, async (req, res) => {
  try {
    const templates = NotificationService.getTemplates();

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification templates'
    });
  }
});

/**
 * Create custom notification (super admin only)
 * Requires super admin authentication
 */
router.post('/admin/create', superAdminMiddleware, async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      tenantId,
      userId,
      priority,
      category,
      expiresAt
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    const notificationId = await NotificationService.createNotification({
      type,
      title,
      message,
      tenantId,
      userId,
      isRead: false,
      priority: priority || 'medium',
      category: category || 'system',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.json({
      success: true,
      data: { notificationId }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

/**
 * Create notification from template (super admin only)
 * Requires super admin authentication
 */
router.post('/admin/template/:templateId', superAdminMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables, tenantId, userId, priority, expiresAt } = req.body;

    if (!variables) {
      return res.status(400).json({
        success: false,
        error: 'Variables are required'
      });
    }

    const notificationId = await NotificationService.createNotificationFromTemplate(
      templateId,
      variables,
      {
        tenantId,
        userId,
        priority,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      }
    );

    res.json({
      success: true,
      data: { notificationId }
    });
  } catch (error) {
    console.error('Error creating notification from template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification from template'
    });
  }
});

/**
 * Get all notifications (super admin only)
 * Requires super admin authentication
 */
router.get('/admin/all', superAdminMiddleware, async (req, res) => {
  try {
    const { category, isRead, limit = '100', offset = '0' } = req.query;

    const result = await NotificationService.getNotifications({
      category: category as any,
      isRead: isRead ? isRead === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * Delete expired notifications (super admin only)
 * Requires super admin authentication
 */
router.delete('/admin/expired', superAdminMiddleware, async (req, res) => {
  try {
    const deletedCount = await NotificationService.deleteExpiredNotifications();

    res.json({
      success: true,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('Error deleting expired notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expired notifications'
    });
  }
});

/**
 * Run usage limit checks (super admin only)
 * Requires super admin authentication
 */
router.post('/admin/check-usage-limits', superAdminMiddleware, async (req, res) => {
  try {
    await NotificationService.checkUsageLimits();

    res.json({
      success: true,
      message: 'Usage limit checks completed'
    });
  } catch (error) {
    console.error('Error checking usage limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check usage limits'
    });
  }
});

/**
 * Run subscription expiration checks (super admin only)
 * Requires super admin authentication
 */
router.post('/admin/check-subscription-expirations', superAdminMiddleware, async (req, res) => {
  try {
    await NotificationService.checkSubscriptionExpirations();

    res.json({
      success: true,
      message: 'Subscription expiration checks completed'
    });
  } catch (error) {
    console.error('Error checking subscription expirations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check subscription expirations'
    });
  }
});

export default router;

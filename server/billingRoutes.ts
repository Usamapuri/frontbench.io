import { Router } from 'express';
import { BillingService } from './billingService';
import { requireTenantMiddleware } from './subdomainMiddleware';
import { superAdminMiddleware } from './superAdminMiddleware';

const router = Router();

/**
 * Get available subscription plans
 * Public endpoint - no authentication required
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await BillingService.getSubscriptionPlans();
    
    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * Get subscription plan details by ID
 * Public endpoint - no authentication required
 */
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await BillingService.getSubscriptionPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plan'
    });
  }
});

/**
 * Create subscription for current tenant
 * Requires tenant authentication
 */
router.post('/subscribe', requireTenantMiddleware, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const tenantId = req.tenant?.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const result = await BillingService.createSubscription(
      tenantId,
      planId,
      paymentMethodId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: { subscriptionId: result.subscriptionId }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * Update subscription for current tenant
 * Requires tenant authentication
 */
router.put('/subscription', requireTenantMiddleware, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const tenantId = req.tenant?.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const result = await BillingService.updateSubscription(
      tenantId,
      planId,
      paymentMethodId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
});

/**
 * Cancel subscription for current tenant
 * Requires tenant authentication
 */
router.post('/subscription/cancel', requireTenantMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const result = await BillingService.cancelSubscription(tenantId, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get billing history for current tenant
 * Requires tenant authentication
 */
router.get('/history', requireTenantMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { limit = '50', offset = '0' } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const result = await BillingService.getBillingHistory(
      tenantId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history'
    });
  }
});

/**
 * Check tenant limits
 * Requires tenant authentication
 */
router.get('/limits', requireTenantMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const limits = await BillingService.checkTenantLimits(tenantId);

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Error checking tenant limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check tenant limits'
    });
  }
});

/**
 * Get billing metrics for super admin
 * Requires super admin authentication
 */
router.get('/metrics', superAdminMiddleware, async (req, res) => {
  try {
    const metrics = await BillingService.getBillingMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching billing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing metrics'
    });
  }
});

/**
 * Update tenant subscription (super admin only)
 * Requires super admin authentication
 */
router.put('/admin/subscription/:tenantId', superAdminMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    const result = await BillingService.updateSubscription(
      tenantId,
      planId,
      paymentMethodId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Tenant subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant subscription'
    });
  }
});

/**
 * Cancel tenant subscription (super admin only)
 * Requires super admin authentication
 */
router.post('/admin/subscription/:tenantId/cancel', superAdminMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const result = await BillingService.cancelSubscription(tenantId, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Tenant subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling tenant subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel tenant subscription'
    });
  }
});

/**
 * Get billing history for specific tenant (super admin only)
 * Requires super admin authentication
 */
router.get('/admin/history/:tenantId', superAdminMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const result = await BillingService.getBillingHistory(
      tenantId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching tenant billing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant billing history'
    });
  }
});

export default router;

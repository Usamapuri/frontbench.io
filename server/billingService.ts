import { eq, and, gte, lte, desc, sum, count } from 'drizzle-orm';
import { db } from './db';
import { 
  tenants, 
  subscriptions, 
  billingHistory, 
  invoices, 
  payments,
  tenantAnalytics 
} from '../shared/schema';

export interface BillingMetrics {
  monthlyRecurringRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxUsers: number;
    maxStudents: number;
    maxStorage: number; // in GB
    maxApiCalls: number; // per month
  };
  isActive: boolean;
}

// Available subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small schools getting started',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Up to 10 users',
      'Up to 100 students',
      'Basic reporting',
      'Email support',
      '1GB storage'
    ],
    limits: {
      maxUsers: 10,
      maxStudents: 100,
      maxStorage: 1,
      maxApiCalls: 1000
    },
    isActive: true
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Ideal for growing schools',
    price: 29,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Up to 50 users',
      'Up to 500 students',
      'Advanced reporting',
      'Priority support',
      '10GB storage',
      'Custom branding'
    ],
    limits: {
      maxUsers: 50,
      maxStudents: 500,
      maxStorage: 10,
      maxApiCalls: 10000
    },
    isActive: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For established schools with advanced needs',
    price: 79,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Up to 200 users',
      'Up to 2000 students',
      'Advanced analytics',
      '24/7 support',
      '100GB storage',
      'Custom domain',
      'API access',
      'White-label options'
    ],
    limits: {
      maxUsers: 200,
      maxStudents: 2000,
      maxStorage: 100,
      maxApiCalls: 50000
    },
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large institutions with custom requirements',
    price: 199,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Unlimited users',
      'Unlimited students',
      'Custom analytics',
      'Dedicated support',
      'Unlimited storage',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment'
    ],
    limits: {
      maxUsers: -1, // unlimited
      maxStudents: -1, // unlimited
      maxStorage: -1, // unlimited
      maxApiCalls: -1 // unlimited
    },
    isActive: true
  }
];

export class BillingService {
  /**
   * Get billing metrics for super admin dashboard
   */
  static async getBillingMetrics(): Promise<BillingMetrics> {
    try {
      // Get current month's start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Calculate Monthly Recurring Revenue (MRR)
      const activeSubscriptions = await db
        .select({
          plan: subscriptions.plan,
          price: subscriptions.price
        })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

      const monthlyRecurringRevenue = activeSubscriptions.reduce((total, sub) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.plan);
        return total + (plan?.price || 0);
      }, 0);

      // Calculate total revenue from billing history
      const totalRevenueResult = await db
        .select({ total: sum(billingHistory.amount) })
        .from(billingHistory)
        .where(eq(billingHistory.status, 'paid'));

      const totalRevenue = totalRevenueResult[0]?.total || 0;

      // Calculate active subscriptions count
      const activeSubscriptionsCount = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

      // Calculate churn rate (simplified - cancelled subscriptions in last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const cancelledSubscriptions = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'cancelled'),
            gte(subscriptions.updatedAt, thirtyDaysAgo)
          )
        );

      const totalSubscriptions = await db
        .select({ count: count() })
        .from(subscriptions);

      const churnRate = totalSubscriptions[0]?.count > 0 
        ? (cancelledSubscriptions[0]?.count || 0) / totalSubscriptions[0]?.count * 100
        : 0;

      // Calculate Average Revenue Per User (ARPU)
      const averageRevenuePerUser = activeSubscriptionsCount[0]?.count > 0
        ? monthlyRecurringRevenue / activeSubscriptionsCount[0]?.count
        : 0;

      // Calculate Lifetime Value (simplified)
      const lifetimeValue = averageRevenuePerUser * 24; // Assuming 24 month average lifetime

      return {
        monthlyRecurringRevenue,
        totalRevenue,
        activeSubscriptions: activeSubscriptionsCount[0]?.count || 0,
        churnRate,
        averageRevenuePerUser,
        lifetimeValue
      };
    } catch (error) {
      console.error('Error calculating billing metrics:', error);
      throw new Error('Failed to calculate billing metrics');
    }
  }

  /**
   * Get subscription plan details
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return SUBSCRIPTION_PLANS.filter(plan => plan.isActive);
  }

  /**
   * Get subscription plan by ID
   */
  static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Create a new subscription for a tenant
   */
  static async createSubscription(
    tenantId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const plan = await this.getSubscriptionPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Check if tenant already has an active subscription
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.tenantId, tenantId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (existingSubscription.length > 0) {
        return { success: false, error: 'Tenant already has an active subscription' };
      }

      // Create subscription record
      const subscriptionId = crypto.randomUUID();
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription

      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          id: subscriptionId,
          tenantId,
          plan: planId,
          status: 'active',
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          startDate: now,
          endDate,
          paymentMethodId,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      // Update tenant with new plan and limits
      await db
        .update(tenants)
        .set({
          subscriptionPlan: planId,
          subscriptionStatus: 'active',
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
          maxUsers: plan.limits.maxUsers,
          maxStudents: plan.limits.maxStudents,
          updatedAt: now
        })
        .where(eq(tenants.id, tenantId));

      // Create billing history entry for free plan (no charge)
      if (plan.price > 0) {
        await db
          .insert(billingHistory)
          .values({
            id: crypto.randomUUID(),
            tenantId,
            subscriptionId,
            amount: plan.price,
            currency: plan.currency,
            status: 'pending', // Would be 'paid' after successful payment
            description: `Subscription to ${plan.name} plan`,
            paymentMethodId,
            createdAt: now
          });
      }

      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  /**
   * Update subscription plan for a tenant
   */
  static async updateSubscription(
    tenantId: string,
    newPlanId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const newPlan = await this.getSubscriptionPlan(newPlanId);
      if (!newPlan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Get current subscription
      const currentSubscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.tenantId, tenantId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (currentSubscription.length === 0) {
        return { success: false, error: 'No active subscription found' };
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      // Update subscription
      await db
        .update(subscriptions)
        .set({
          plan: newPlanId,
          price: newPlan.price,
          currency: newPlan.currency,
          interval: newPlan.interval,
          endDate,
          paymentMethodId,
          updatedAt: now
        })
        .where(eq(subscriptions.id, currentSubscription[0].id));

      // Update tenant
      await db
        .update(tenants)
        .set({
          subscriptionPlan: newPlanId,
          maxUsers: newPlan.limits.maxUsers,
          maxStudents: newPlan.limits.maxStudents,
          updatedAt: now
        })
        .where(eq(tenants.id, tenantId));

      // Create billing history entry for plan change
      if (newPlan.price > 0) {
        await db
          .insert(billingHistory)
          .values({
            id: crypto.randomUUID(),
            tenantId,
            subscriptionId: currentSubscription[0].id,
            amount: newPlan.price,
            currency: newPlan.currency,
            status: 'pending',
            description: `Plan upgrade to ${newPlan.name}`,
            paymentMethodId,
            createdAt: now
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  /**
   * Cancel subscription for a tenant
   */
  static async cancelSubscription(
    tenantId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current subscription
      const currentSubscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.tenantId, tenantId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (currentSubscription.length === 0) {
        return { success: false, error: 'No active subscription found' };
      }

      const now = new Date();

      // Cancel subscription
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: reason,
          updatedAt: now
        })
        .where(eq(subscriptions.id, currentSubscription[0].id));

      // Update tenant
      await db
        .update(tenants)
        .set({
          subscriptionStatus: 'cancelled',
          updatedAt: now
        })
        .where(eq(tenants.id, tenantId));

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  /**
   * Get billing history for a tenant
   */
  static async getBillingHistory(
    tenantId: string,
    limit = 50,
    offset = 0
  ): Promise<{ billingHistory: any[]; total: number }> {
    try {
      const billingRecords = await db
        .select()
        .from(billingHistory)
        .where(eq(billingHistory.tenantId, tenantId))
        .orderBy(desc(billingHistory.createdAt))
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(billingHistory)
        .where(eq(billingHistory.tenantId, tenantId));

      return {
        billingHistory: billingRecords,
        total: totalResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw new Error('Failed to fetch billing history');
    }
  }

  /**
   * Check if tenant has reached their plan limits
   */
  static async checkTenantLimits(tenantId: string): Promise<{
    hasReachedUserLimit: boolean;
    hasReachedStudentLimit: boolean;
    currentUsers: number;
    currentStudents: number;
    maxUsers: number;
    maxStudents: number;
  }> {
    try {
      // Get tenant info
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (tenant.length === 0) {
        throw new Error('Tenant not found');
      }

      // Get current counts from analytics
      const latestAnalytics = await db
        .select()
        .from(tenantAnalytics)
        .where(eq(tenantAnalytics.tenantId, tenantId))
        .orderBy(desc(tenantAnalytics.date))
        .limit(1);

      const currentUsers = latestAnalytics[0]?.totalUsers || 0;
      const currentStudents = latestAnalytics[0]?.totalStudents || 0;
      const maxUsers = tenant[0].maxUsers;
      const maxStudents = tenant[0].maxStudents;

      return {
        hasReachedUserLimit: maxUsers > 0 && currentUsers >= maxUsers,
        hasReachedStudentLimit: maxStudents > 0 && currentStudents >= maxStudents,
        currentUsers,
        currentStudents,
        maxUsers,
        maxStudents
      };
    } catch (error) {
      console.error('Error checking tenant limits:', error);
      throw new Error('Failed to check tenant limits');
    }
  }
}

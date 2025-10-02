import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  CreditCard, 
  Check, 
  X, 
  AlertTriangle,
  Crown,
  Users,
  GraduationCap,
  HardDrive,
  Zap,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface SubscriptionPlan {
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
    maxStorage: number;
    maxApiCalls: number;
  };
  isActive: boolean;
}

interface CurrentSubscription {
  id: string;
  plan: string;
  status: string;
  price: number;
  currency: string;
  interval: string;
  startDate: string;
  endDate: string;
  paymentMethodId?: string;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

interface UsageLimits {
  hasReachedUserLimit: boolean;
  hasReachedStudentLimit: boolean;
  currentUsers: number;
  currentStudents: number;
  maxUsers: number;
  maxStudents: number;
}

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load available plans
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      if (plansData.success) {
        setPlans(plansData.data.plans);
      }

      // Load current subscription (would need a new endpoint)
      // For now, we'll simulate this
      setCurrentSubscription({
        id: 'sub_123',
        plan: 'basic',
        status: 'active',
        price: 29,
        currency: 'USD',
        interval: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-02-01'
      });

      // Load billing history
      const historyResponse = await fetch('/api/billing/history');
      const historyData = await historyResponse.json();
      if (historyData.success) {
        setBillingHistory(historyData.data.billingHistory);
      }

      // Load usage limits
      const limitsResponse = await fetch('/api/billing/limits');
      const limitsData = await limitsResponse.json();
      if (limitsData.success) {
        setUsageLimits(limitsData.data);
      }

    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      
      if (response.ok) {
        loadSubscriptionData();
        setShowUpgradeModal(false);
      }
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/billing/subscription/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'User requested cancellation' })
        });
        
        if (response.ok) {
          loadSubscriptionData();
        }
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Users className="h-6 w-6" />;
      case 'basic': return <Crown className="h-6 w-6" />;
      case 'premium': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Crown className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max <= 0) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-gray-600 mt-1">Manage your subscription and billing</p>
            </div>
            <Button onClick={loadSubscriptionData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {getPlanIcon(currentSubscription.plan)}
                    <span className="ml-2 capitalize">{currentSubscription.plan} Plan</span>
                  </CardTitle>
                  <CardDescription>
                    Current subscription details
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(currentSubscription.price, currentSubscription.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {currentSubscription.interval}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusBadge(currentSubscription.status)}
                  <div className="text-sm text-gray-500">
                    Next billing: {new Date(currentSubscription.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowUpgradeModal(true)} variant="outline" size="sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                  {currentSubscription.plan !== 'free' && (
                    <Button onClick={handleCancelSubscription} variant="destructive" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Limits */}
        {usageLimits && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Users</span>
                    <span className={getUsageColor(getUsagePercentage(usageLimits.currentUsers, usageLimits.maxUsers))}>
                      {usageLimits.currentUsers}/{usageLimits.maxUsers === -1 ? '∞' : usageLimits.maxUsers}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(usageLimits.currentUsers, usageLimits.maxUsers) >= 90 
                          ? 'bg-red-500' 
                          : getUsagePercentage(usageLimits.currentUsers, usageLimits.maxUsers) >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${getUsagePercentage(usageLimits.currentUsers, usageLimits.maxUsers)}%` 
                      }}
                    ></div>
                  </div>
                  {usageLimits.hasReachedUserLimit && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      User limit reached
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Student Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Students</span>
                    <span className={getUsageColor(getUsagePercentage(usageLimits.currentStudents, usageLimits.maxStudents))}>
                      {usageLimits.currentStudents}/{usageLimits.maxStudents === -1 ? '∞' : usageLimits.maxStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(usageLimits.currentStudents, usageLimits.maxStudents) >= 90 
                          ? 'bg-red-500' 
                          : getUsagePercentage(usageLimits.currentStudents, usageLimits.maxStudents) >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${getUsagePercentage(usageLimits.currentStudents, usageLimits.maxStudents)}%` 
                      }}
                    ></div>
                  </div>
                  {usageLimits.hasReachedStudentLimit && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Student limit reached
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
            <TabsTrigger value="usage">Usage Details</TabsTrigger>
          </TabsList>

          {/* Available Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${
                    currentSubscription?.plan === plan.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:shadow-lg transition-shadow'
                  }`}
                >
                  {currentSubscription?.plan === plan.id && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500">Current Plan</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                      {getPlanIcon(plan.id)}
                    </div>
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        {formatCurrency(plan.price, plan.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {plan.interval}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Max Users:</span>
                        <span>{plan.limits.maxUsers === -1 ? '∞' : plan.limits.maxUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Students:</span>
                        <span>{plan.limits.maxStudents === -1 ? '∞' : plan.limits.maxStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>{plan.limits.maxStorage === -1 ? '∞' : `${plan.limits.maxStorage}GB`}</span>
                      </div>
                    </div>
                    
                    {currentSubscription?.plan !== plan.id && (
                      <Button 
                        className="w-full"
                        variant={plan.price === 0 ? 'outline' : 'default'}
                        onClick={() => handleUpgradePlan(plan.id)}
                      >
                        {currentSubscription?.plan === 'free' ? 'Upgrade' : 'Switch to'} {plan.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your payment history and invoices</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {billingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {billingHistory.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{bill.description}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(bill.amount, bill.currency)}
                          </div>
                          <div className="text-sm">
                            {getStatusBadge(bill.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No billing history available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Details Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Usage</CardTitle>
                  <CardDescription>Your current resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {usageLimits && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Users</span>
                        <span className="text-sm font-medium">
                          {usageLimits.currentUsers}/{usageLimits.maxUsers === -1 ? '∞' : usageLimits.maxUsers}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Students</span>
                        <span className="text-sm font-medium">
                          {usageLimits.currentStudents}/{usageLimits.maxStudents === -1 ? '∞' : usageLimits.maxStudents}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                  <CardDescription>Features included in your current plan</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentSubscription && (
                    <div className="space-y-2">
                      {plans
                        .find(p => p.id === currentSubscription.plan)
                        ?.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span>{feature}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

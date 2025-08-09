import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { DashboardStats, Transaction, CashDrawRequest } from "@/types";

function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return targetDate.toLocaleDateString();
}

export default function FinanceDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentPayments } = useQuery<Transaction[]>({
    queryKey: ['/api/payments'],
  });

  const { data: cashDrawRequests } = useQuery<CashDrawRequest[]>({
    queryKey: ['/api/cash-draw-requests'],
  });

  const pendingRequests = cashDrawRequests?.filter(req => req.status === 'pending') || [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-total-students">
                  {stats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-monthly-revenue">
                  Rs. {stats?.monthlyRevenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <i className="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-pending-fees">
                  Rs. {stats?.pendingFees?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-percentage text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-avg-attendance">
                  {stats?.avgAttendance || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/enrollment">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-new-enrollment">
                <i className="fas fa-user-plus text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">New Enrollment</span>
              </Button>
            </Link>
            
            <Link href="/invoices">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-create-invoice">
                <i className="fas fa-file-invoice text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">Create Invoice</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-record-payment">
              <i className="fas fa-credit-card text-2xl text-blue-600"></i>
              <span className="text-sm font-medium">Record Payment</span>
            </Button>
            
            <Link href="/daily-close">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-daily-close">
                <i className="fas fa-lock text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">Daily Close</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments?.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Received</p>
                      <p className="text-xs text-gray-600">Receipt #{payment.id?.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">Rs. {payment.amount}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.paymentDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-receipt text-4xl mb-4"></i>
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4" data-testid="button-view-all-transactions">
              View All Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Cash Draw Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.teacherName}</p>
                    <p className="text-xs text-gray-600">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(request.requestedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">Rs. {request.amount}</p>
                    <div className="flex space-x-2 mt-1">
                      <Button size="sm" className="px-2 py-1 text-xs" data-testid="button-approve-request">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="px-2 py-1 text-xs" data-testid="button-deny-request">
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-check-circle text-4xl mb-4"></i>
                  <p>No pending approvals</p>
                </div>
              )}
            </div>
            <Link href="/approvals">
              <Button variant="ghost" className="w-full mt-4" data-testid="button-view-all-approvals">
                View All Pending Approvals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

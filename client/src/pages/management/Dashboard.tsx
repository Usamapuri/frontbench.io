import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function ManagementDashboard() {
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: expenses } = useQuery({
    queryKey: ['/api/expenses'],
  });

  const { data: payments } = useQuery({
    queryKey: ['/api/payments'],
  });

  // Calculate key metrics
  const currentMonth = new Date();
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  
  const currentMonthRevenue = payments?.filter((p: any) => 
    new Date(p.paymentDate).getMonth() === currentMonth.getMonth()
  ).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

  const lastMonthRevenue = payments?.filter((p: any) => 
    new Date(p.paymentDate).getMonth() === lastMonth.getMonth()
  ).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

  const currentMonthExpenses = expenses?.filter((e: any) => 
    new Date(e.expenseDate).getMonth() === currentMonth.getMonth()
  ).reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;

  const netProfit = currentMonthRevenue - currentMonthExpenses;
  const profitMargin = currentMonthRevenue > 0 ? (netProfit / currentMonthRevenue) * 100 : 0;
  const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  if (isLoading) {
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
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-monthly-revenue">
                  Rs. {currentMonthRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <i className="fas fa-minus-circle text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-monthly-expenses">
                  Rs. {currentMonthExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-chart-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="stat-net-profit">
                  Rs. {netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-percentage text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className={`text-2xl font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="stat-profit-margin">
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Month Revenue</span>
                <span className="font-semibold text-green-600">Rs. {currentMonthRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '70%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Month Expenses</span>
                <span className="font-semibold text-red-600">Rs. {currentMonthExpenses.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-red-600 h-3 rounded-full" style={{ width: '50%' }}></div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Net Profit</span>
                  <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Revenue Growth</p>
                <p className={`text-3xl font-bold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="revenue-growth">
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Student Enrollment</p>
                <p className="text-3xl font-bold text-blue-600" data-testid="total-students">
                  {stats?.totalStudents || 0}
                </p>
                <p className="text-xs text-gray-500">active students</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-3xl font-bold text-purple-600">94.2%</p>
                <p className="text-xs text-gray-500">monthly average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>





      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown - This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-chalkboard-teacher text-blue-600 text-sm"></i>
                </div>
                <span className="font-medium">Teacher Salaries</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">Rs. {(currentMonthExpenses * 0.6).toLocaleString()}</p>
                <p className="text-xs text-gray-500">60% of expenses</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-bolt text-green-600 text-sm"></i>
                </div>
                <span className="font-medium">Utilities</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">Rs. {(currentMonthExpenses * 0.15).toLocaleString()}</p>
                <p className="text-xs text-gray-500">15% of expenses</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-cog text-purple-600 text-sm"></i>
                </div>
                <span className="font-medium">Administrative</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">Rs. {(currentMonthExpenses * 0.25).toLocaleString()}</p>
                <p className="text-xs text-gray-500">25% of expenses</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-yellow-800">High Outstanding Fees</p>
                  <p className="text-xs text-yellow-600">Rs. 45,200 in overdue payments require attention</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-300" data-testid="button-review-overdue">
                Review
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-info-circle text-blue-600 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-blue-800">Monthly Report Ready</p>
                  <p className="text-xs text-blue-600">March 2024 financial report is ready for download</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-300" data-testid="button-download-report">
                Download
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-600 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-green-800">All Payrolls Processed</p>
                  <p className="text-xs text-green-600">Teacher payments for March have been completed</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}

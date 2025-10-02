import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';

interface AnalyticsSummary {
  totalUsers: number;
  totalStudents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageAttendanceRate: number;
  growthRate: number;
}

interface DailyData {
  date: string;
  revenue?: number;
  totalRevenue?: number;
  outstandingInvoices?: number;
  totalUsers?: number;
  newUsers?: number;
  activeUsers?: number;
  totalStudents?: number;
  newStudents?: number;
  activeStudents?: number;
  totalClasses?: number;
  totalAttendance?: number;
  averageAttendance?: number;
}

export default function TenantAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueData, setRevenueData] = useState<DailyData[]>([]);
  const [studentData, setStudentData] = useState<DailyData[]>([]);
  const [attendanceData, setAttendanceData] = useState<DailyData[]>([]);
  const [userData, setUserData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard summary
      const dashboardResponse = await fetch('/api/analytics/dashboard');
      const dashboardResult = await dashboardResponse.json();
      
      if (dashboardResult.success) {
        setSummary(dashboardResult.data.summary);
      }

      // Load revenue data
      const revenueResponse = await fetch(`/api/analytics/revenue?period=${selectedPeriod}`);
      const revenueResult = await revenueResponse.json();
      
      if (revenueResult.success) {
        setRevenueData(revenueResult.data.dailyData);
      }

      // Load student data
      const studentResponse = await fetch(`/api/analytics/students?period=${selectedPeriod}`);
      const studentResult = await studentResponse.json();
      
      if (studentResult.success) {
        setStudentData(studentResult.data.dailyData);
      }

      // Load attendance data
      const attendanceResponse = await fetch(`/api/analytics/attendance?period=${selectedPeriod}`);
      const attendanceResult = await attendanceResponse.json();
      
      if (attendanceResult.success) {
        setAttendanceData(attendanceResult.data.dailyData);
      }

      // Load user data
      const userResponse = await fetch(`/api/analytics/users?period=${selectedPeriod}`);
      const userResult = await userResponse.json();
      
      if (userResult.success) {
        setUserData(userResult.data.dailyData);
      }

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (selectedPeriod === '7d' ? 7 : selectedPeriod === '90d' ? 90 : 30));
      
      const response = await fetch(
        `/api/analytics/export?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (growthRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your school's performance and growth</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(summary.growthRate)}
                  <span className="ml-1">{formatPercentage(summary.growthRate)} growth</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalStudents}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(summary.growthRate)}
                  <span className="ml-1">{formatPercentage(summary.growthRate)} growth</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(summary.monthlyRevenue)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(summary.averageAttendanceRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Average class attendance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Daily revenue over {selectedPeriod}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <LineChart className="h-12 w-12 mr-2" />
                    Revenue Chart Placeholder
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                  <CardDescription>Key revenue metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {revenueData.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Period Revenue:</span>
                        <span className="font-bold">
                          {formatCurrency(revenueData.reduce((sum, day) => sum + (day.revenue || 0), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Average Daily:</span>
                        <span className="font-bold">
                          {formatCurrency(revenueData.reduce((sum, day) => sum + (day.revenue || 0), 0) / revenueData.length)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Outstanding Invoices:</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(revenueData[revenueData.length - 1]?.outstandingInvoices || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Student Analytics */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Growth</CardTitle>
                  <CardDescription>Student enrollment trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mr-2" />
                    Student Growth Chart Placeholder
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Summary</CardTitle>
                  <CardDescription>Key student metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentData.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Students:</span>
                        <span className="font-bold">
                          {studentData[studentData.length - 1]?.totalStudents || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">New This Period:</span>
                        <span className="font-bold">
                          {studentData.reduce((sum, day) => sum + (day.newStudents || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Average Daily New:</span>
                        <span className="font-bold">
                          {(studentData.reduce((sum, day) => sum + (day.newStudents || 0), 0) / studentData.length).toFixed(1)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Analytics */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Daily attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <LineChart className="h-12 w-12 mr-2" />
                    Attendance Chart Placeholder
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>Key attendance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {attendanceData.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Classes:</span>
                        <span className="font-bold">
                          {attendanceData[attendanceData.length - 1]?.totalClasses || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Attendance:</span>
                        <span className="font-bold">
                          {attendanceData.reduce((sum, day) => sum + (day.totalAttendance || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Average Rate:</span>
                        <span className="font-bold">
                          {formatPercentage(
                            attendanceData.reduce((sum, day) => sum + (day.averageAttendance || 0), 0) / attendanceData.length
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Analytics */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>User registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mr-2" />
                    User Growth Chart Placeholder
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Summary</CardTitle>
                  <CardDescription>Key user metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userData.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Users:</span>
                        <span className="font-bold">
                          {userData[userData.length - 1]?.totalUsers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">New This Period:</span>
                        <span className="font-bold">
                          {userData.reduce((sum, day) => sum + (day.newUsers || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Average Daily New:</span>
                        <span className="font-bold">
                          {(userData.reduce((sum, day) => sum + (day.newUsers || 0), 0) / userData.length).toFixed(1)}
                        </span>
                      </div>
                    </>
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

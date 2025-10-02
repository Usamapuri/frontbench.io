import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analyticsService';
import { requireTenantMiddleware } from './subdomainMiddleware';
import { db } from './db';
import { tenantAnalytics } from '@shared/schema';
import { eq, desc, gte, lte, sql } from 'drizzle-orm';

const router = Router();

// Apply tenant middleware to all routes
router.use(requireTenantMiddleware);

/**
 * GET /api/analytics/dashboard
 * Get tenant dashboard analytics
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    // Generate today's analytics if not exists
    await AnalyticsService.generateDailyAnalytics(tenantId);

    // Get dashboard analytics
    const analytics = await AnalyticsService.getTenantDashboardAnalytics(tenantId);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard analytics',
      message: 'An error occurred while loading analytics data'
    });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics over time
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const period = req.query.period as string || '30d';
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await AnalyticsService.getTenantAnalytics(tenantId, startDate, endDate);

    // Format data for charts
    const revenueData = analytics.map(day => ({
      date: day.date,
      revenue: Number(day.monthlyRevenue || 0),
      totalRevenue: Number(day.totalRevenue || 0),
      outstandingInvoices: Number(day.outstandingInvoices || 0)
    }));

    // Calculate summary
    const totalRevenue = analytics.reduce((sum, day) => sum + Number(day.monthlyRevenue || 0), 0);
    const averageDailyRevenue = totalRevenue / analytics.length || 0;
    const latestOutstanding = analytics.length > 0 ? Number(analytics[analytics.length - 1].outstandingInvoices || 0) : 0;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue,
          averageDailyRevenue,
          outstandingInvoices: latestOutstanding
        },
        dailyData: revenueData
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch revenue analytics',
      message: 'An error occurred while loading revenue data'
    });
  }
});

/**
 * GET /api/analytics/students
 * Get student analytics over time
 */
router.get('/students', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const period = req.query.period as string || '30d';
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await AnalyticsService.getTenantAnalytics(tenantId, startDate, endDate);

    // Format data for charts
    const studentData = analytics.map(day => ({
      date: day.date,
      totalStudents: day.totalStudents,
      newStudents: day.newStudents,
      activeStudents: day.activeStudents
    }));

    // Calculate summary
    const totalStudents = analytics.length > 0 ? analytics[analytics.length - 1].totalStudents : 0;
    const totalNewStudents = analytics.reduce((sum, day) => sum + (day.newStudents || 0), 0);
    const averageDailyNewStudents = totalNewStudents / analytics.length || 0;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalStudents,
          totalNewStudents,
          averageDailyNewStudents
        },
        dailyData: studentData
      }
    });

  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch student analytics',
      message: 'An error occurred while loading student data'
    });
  }
});

/**
 * GET /api/analytics/attendance
 * Get attendance analytics over time
 */
router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const period = req.query.period as string || '30d';
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await AnalyticsService.getTenantAnalytics(tenantId, startDate, endDate);

    // Format data for charts
    const attendanceData = analytics.map(day => ({
      date: day.date,
      totalAttendance: day.totalAttendance,
      averageAttendance: Number(day.averageAttendance || 0),
      totalClasses: day.totalClasses
    }));

    // Calculate summary
    const totalClasses = analytics.length > 0 ? analytics[analytics.length - 1].totalClasses : 0;
    const totalAttendance = analytics.reduce((sum, day) => sum + (day.totalAttendance || 0), 0);
    const averageAttendanceRate = analytics.reduce((sum, day) => sum + Number(day.averageAttendance || 0), 0) / analytics.length || 0;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalClasses,
          totalAttendance,
          averageAttendanceRate
        },
        dailyData: attendanceData
      }
    });

  } catch (error) {
    console.error('Attendance analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance analytics',
      message: 'An error occurred while loading attendance data'
    });
  }
});

/**
 * GET /api/analytics/users
 * Get user analytics over time
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const period = req.query.period as string || '30d';
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await AnalyticsService.getTenantAnalytics(tenantId, startDate, endDate);

    // Format data for charts
    const userData = analytics.map(day => ({
      date: day.date,
      totalUsers: day.totalUsers,
      newUsers: day.newUsers,
      activeUsers: day.activeUsers
    }));

    // Calculate summary
    const totalUsers = analytics.length > 0 ? analytics[analytics.length - 1].totalUsers : 0;
    const totalNewUsers = analytics.reduce((sum, day) => sum + (day.newUsers || 0), 0);
    const averageDailyNewUsers = totalNewUsers / analytics.length || 0;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalUsers,
          totalNewUsers,
          averageDailyNewUsers
        },
        dailyData: userData
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch user analytics',
      message: 'An error occurred while loading user data'
    });
  }
});

/**
 * GET /api/analytics/export
 * Export analytics data as CSV
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date range',
        message: 'Please provide startDate and endDate parameters'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const analytics = await AnalyticsService.getTenantAnalytics(tenantId, start, end);

    // Convert to CSV format
    const csvHeaders = [
      'Date',
      'Total Users',
      'New Users',
      'Active Users',
      'Total Students',
      'New Students',
      'Active Students',
      'Total Revenue',
      'Monthly Revenue',
      'Outstanding Invoices',
      'Total Classes',
      'Total Attendance',
      'Average Attendance %'
    ];

    const csvRows = analytics.map(day => [
      day.date,
      day.totalUsers,
      day.newUsers,
      day.activeUsers,
      day.totalStudents,
      day.newStudents,
      day.activeStudents,
      day.totalRevenue,
      day.monthlyRevenue,
      day.outstandingInvoices,
      day.totalClasses,
      day.totalAttendance,
      day.averageAttendance
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${tenantId}-${startDate}-to-${endDate}.csv"`);
    
    res.send(csvContent);

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: 'Failed to export analytics',
      message: 'An error occurred while exporting analytics data'
    });
  }
});

export { router as tenantAnalyticsRoutes };

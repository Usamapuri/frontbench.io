import { db } from './db';
import { 
  tenantAnalytics, 
  tenants, 
  users, 
  students, 
  invoices, 
  payments, 
  classes, 
  attendance,
  billingHistory
} from '@shared/schema';
import { eq, desc, gte, lte, sql, count, sum, avg } from 'drizzle-orm';

export class AnalyticsService {
  /**
   * Generate daily analytics for a tenant
   */
  static async generateDailyAnalytics(tenantId: string, date: Date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if analytics already exist for this date
      const existing = await db
        .select()
        .from(tenantAnalytics)
        .where(
          sql`${tenantAnalytics.tenantId} = ${tenantId} AND ${tenantAnalytics.date} = ${dateStr}`
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing analytics
        return this.updateDailyAnalytics(tenantId, dateStr);
      } else {
        // Create new analytics
        return this.createDailyAnalytics(tenantId, dateStr);
      }
    } catch (error) {
      console.error('Error generating daily analytics:', error);
      throw error;
    }
  }

  /**
   * Create new daily analytics record
   */
  private static async createDailyAnalytics(tenantId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    // Get user metrics
    const [userMetrics] = await db
      .select({
        totalUsers: count(),
        newUsers: sql<number>`COUNT(CASE WHEN ${users.createdAt} >= ${startOfDay.toISOString()} THEN 1 END)`
      })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    // Get student metrics
    const [studentMetrics] = await db
      .select({
        totalStudents: count(),
        newStudents: sql<number>`COUNT(CASE WHEN ${students.createdAt} >= ${startOfDay.toISOString()} THEN 1 END)`
      })
      .from(students)
      .where(eq(students.tenantId, tenantId));

    // Get financial metrics
    const [financialMetrics] = await db
      .select({
        totalRevenue: sum(payments.amount),
        monthlyRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.createdAt} >= ${startOfDay.toISOString()} THEN ${payments.amount} ELSE 0 END), 0)`,
        outstandingInvoices: sql<number>`COALESCE((SELECT SUM(${invoices.total}) FROM ${invoices} WHERE ${invoices.tenantId} = ${tenantId} AND ${invoices.status} = 'pending'), 0)`
      })
      .from(payments)
      .where(eq(payments.tenantId, tenantId));

    // Get academic metrics
    const [academicMetrics] = await db
      .select({
        totalClasses: count(),
        totalAttendance: sql<number>`COALESCE((SELECT COUNT(*) FROM ${attendance} WHERE ${attendance.tenantId} = ${tenantId} AND DATE(${attendance.markedAt}) = ${dateStr}), 0)`
      })
      .from(classes)
      .where(eq(classes.tenantId, tenantId));

    // Calculate average attendance percentage
    const averageAttendance = academicMetrics.totalClasses > 0 
      ? (academicMetrics.totalAttendance / academicMetrics.totalClasses) * 100 
      : 0;

    // Insert analytics record
    const [analytics] = await db.insert(tenantAnalytics).values({
      tenantId,
      date: dateStr,
      activeUsers: userMetrics.totalUsers, // Simplified - could be improved with session tracking
      totalUsers: userMetrics.totalUsers,
      newUsers: userMetrics.newUsers,
      activeStudents: studentMetrics.totalStudents, // Simplified - could be improved with attendance tracking
      totalStudents: studentMetrics.totalStudents,
      newStudents: studentMetrics.newStudents,
      totalRevenue: financialMetrics.totalRevenue || 0,
      monthlyRevenue: financialMetrics.monthlyRevenue || 0,
      outstandingInvoices: financialMetrics.outstandingInvoices || 0,
      totalClasses: academicMetrics.totalClasses,
      totalAttendance: academicMetrics.totalAttendance,
      averageAttendance: averageAttendance,
      apiCalls: 0, // Would need to be tracked separately
      storageUsed: 0 // Would need to be calculated from file storage
    }).returning();

    return analytics;
  }

  /**
   * Update existing daily analytics record
   */
  private static async updateDailyAnalytics(tenantId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    // Recalculate metrics (same as create but update existing record)
    const [userMetrics] = await db
      .select({
        totalUsers: count(),
        newUsers: sql<number>`COUNT(CASE WHEN ${users.createdAt} >= ${startOfDay.toISOString()} THEN 1 END)`
      })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const [studentMetrics] = await db
      .select({
        totalStudents: count(),
        newStudents: sql<number>`COUNT(CASE WHEN ${students.createdAt} >= ${startOfDay.toISOString()} THEN 1 END)`
      })
      .from(students)
      .where(eq(students.tenantId, tenantId));

    const [financialMetrics] = await db
      .select({
        totalRevenue: sum(payments.amount),
        monthlyRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.createdAt} >= ${startOfDay.toISOString()} THEN ${payments.amount} ELSE 0 END), 0)`,
        outstandingInvoices: sql<number>`COALESCE((SELECT SUM(${invoices.total}) FROM ${invoices} WHERE ${invoices.tenantId} = ${tenantId} AND ${invoices.status} = 'pending'), 0)`
      })
      .from(payments)
      .where(eq(payments.tenantId, tenantId));

    const [academicMetrics] = await db
      .select({
        totalClasses: count(),
        totalAttendance: sql<number>`COALESCE((SELECT COUNT(*) FROM ${attendance} WHERE ${attendance.tenantId} = ${tenantId} AND DATE(${attendance.markedAt}) = ${dateStr}), 0)`
      })
      .from(classes)
      .where(eq(classes.tenantId, tenantId));

    const averageAttendance = academicMetrics.totalClasses > 0 
      ? (academicMetrics.totalAttendance / academicMetrics.totalClasses) * 100 
      : 0;

    // Update analytics record
    await db
      .update(tenantAnalytics)
      .set({
        activeUsers: userMetrics.totalUsers,
        totalUsers: userMetrics.totalUsers,
        newUsers: userMetrics.newUsers,
        activeStudents: studentMetrics.totalStudents,
        totalStudents: studentMetrics.totalStudents,
        newStudents: studentMetrics.newStudents,
        totalRevenue: financialMetrics.totalRevenue || 0,
        monthlyRevenue: financialMetrics.monthlyRevenue || 0,
        outstandingInvoices: financialMetrics.outstandingInvoices || 0,
        totalClasses: academicMetrics.totalClasses,
        totalAttendance: academicMetrics.totalAttendance,
        averageAttendance: averageAttendance
      })
      .where(
        sql`${tenantAnalytics.tenantId} = ${tenantId} AND ${tenantAnalytics.date} = ${dateStr}`
      );

    // Return updated record
    const [updated] = await db
      .select()
      .from(tenantAnalytics)
      .where(
        sql`${tenantAnalytics.tenantId} = ${tenantId} AND ${tenantAnalytics.date} = ${dateStr}`
      )
      .limit(1);

    return updated;
  }

  /**
   * Get analytics for a tenant over a date range
   */
  static async getTenantAnalytics(tenantId: string, startDate: Date, endDate: Date) {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const analytics = await db
        .select()
        .from(tenantAnalytics)
        .where(
          sql`${tenantAnalytics.tenantId} = ${tenantId} AND ${tenantAnalytics.date} >= ${startDateStr} AND ${tenantAnalytics.date} <= ${endDateStr}`
        )
        .orderBy(tenantAnalytics.date);

      return analytics;
    } catch (error) {
      console.error('Error getting tenant analytics:', error);
      throw error;
    }
  }

  /**
   * Get tenant dashboard analytics (last 30 days)
   */
  static async getTenantDashboardAnalytics(tenantId: string) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Get analytics data
      const analytics = await this.getTenantAnalytics(tenantId, startDate, endDate);

      // Calculate summary statistics
      const summary = {
        totalUsers: analytics.length > 0 ? analytics[analytics.length - 1].totalUsers : 0,
        totalStudents: analytics.length > 0 ? analytics[analytics.length - 1].totalStudents : 0,
        totalRevenue: analytics.length > 0 ? analytics[analytics.length - 1].totalRevenue : 0,
        monthlyRevenue: analytics.reduce((sum, day) => sum + Number(day.monthlyRevenue || 0), 0),
        averageAttendance: analytics.length > 0 ? avg(analytics.map(a => Number(a.averageAttendance || 0))) : 0,
        growthRate: this.calculateGrowthRate(analytics)
      };

      return {
        summary,
        dailyData: analytics,
        period: '30 days'
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate growth rate from analytics data
   */
  private static calculateGrowthRate(analytics: any[]): number {
    if (analytics.length < 2) return 0;

    const first = analytics[0];
    const last = analytics[analytics.length - 1];

    const userGrowth = ((last.totalUsers - first.totalUsers) / first.totalUsers) * 100;
    const studentGrowth = ((last.totalStudents - first.totalStudents) / first.totalStudents) * 100;

    return (userGrowth + studentGrowth) / 2; // Average growth rate
  }

  /**
   * Generate analytics for all tenants (called by cron job)
   */
  static async generateAllTenantAnalytics(date: Date = new Date()) {
    try {
      // Get all active tenants
      const activeTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.isActive, true));

      const results = [];

      for (const tenant of activeTenants) {
        try {
          const analytics = await this.generateDailyAnalytics(tenant.id, date);
          results.push({ tenantId: tenant.id, success: true, analytics });
        } catch (error) {
          console.error(`Failed to generate analytics for tenant ${tenant.id}:`, error);
          results.push({ tenantId: tenant.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error generating all tenant analytics:', error);
      throw error;
    }
  }
}

import { eq, desc, gte } from 'drizzle-orm';
import { db } from './db';
import { systemHealth } from '../shared/schema';

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastCheck: Date;
  error?: string;
  details?: any;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
}

export class SystemMonitoringService {
  /**
   * Perform health checks on all system services
   */
  static async performHealthChecks(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = [];

    // Check database connectivity
    try {
      const startTime = Date.now();
      await db.select().from(systemHealth).limit(1);
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: 'database',
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'down',
        responseTime,
        uptime: 99.9, // Would calculate actual uptime from historical data
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'database',
        status: 'down',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check authentication service
    try {
      const startTime = Date.now();
      // Simulate auth service check
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: 'authentication',
        status: 'healthy',
        responseTime,
        uptime: 99.8,
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'authentication',
        status: 'down',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check file storage service
    try {
      const startTime = Date.now();
      // Simulate file storage check
      await new Promise(resolve => setTimeout(resolve, 15));
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: 'file_storage',
        status: 'healthy',
        responseTime,
        uptime: 99.7,
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'file_storage',
        status: 'down',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check email service
    try {
      const startTime = Date.now();
      // Simulate email service check
      await new Promise(resolve => setTimeout(resolve, 20));
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: 'email',
        status: responseTime < 200 ? 'healthy' : 'degraded',
        responseTime,
        uptime: 99.5,
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'email',
        status: 'down',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check API gateway
    try {
      const startTime = Date.now();
      // Simulate API gateway check
      await new Promise(resolve => setTimeout(resolve, 5));
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: 'api_gateway',
        status: 'healthy',
        responseTime,
        uptime: 99.9,
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'api_gateway',
        status: 'down',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return healthChecks;
  }

  /**
   * Save health check results to database
   */
  static async saveHealthCheckResults(healthChecks: HealthCheck[]): Promise<void> {
    try {
      const now = new Date();
      
      for (const check of healthChecks) {
        // Check if record exists for this service
        const existing = await db
          .select()
          .from(systemHealth)
          .where(eq(systemHealth.service, check.service))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          await db
            .update(systemHealth)
            .set({
              status: check.status,
              responseTime: check.responseTime,
              uptime: check.uptime,
              lastCheck: check.lastCheck,
              error: check.error || null,
              details: check.details || null,
              updatedAt: now
            })
            .where(eq(systemHealth.service, check.service));
        } else {
          // Insert new record
          await db
            .insert(systemHealth)
            .values({
              id: crypto.randomUUID(),
              service: check.service,
              status: check.status,
              responseTime: check.responseTime,
              uptime: check.uptime,
              lastCheck: check.lastCheck,
              error: check.error || null,
              details: check.details || null,
              createdAt: now,
              updatedAt: now
            });
        }
      }
    } catch (error) {
      console.error('Error saving health check results:', error);
      throw new Error('Failed to save health check results');
    }
  }

  /**
   * Get current system health status
   */
  static async getSystemHealth(): Promise<HealthCheck[]> {
    try {
      const healthRecords = await db
        .select()
        .from(systemHealth)
        .orderBy(desc(systemHealth.lastCheck));

      return healthRecords.map(record => ({
        service: record.service,
        status: record.status as 'healthy' | 'degraded' | 'down',
        responseTime: record.responseTime,
        uptime: record.uptime,
        lastCheck: record.lastCheck,
        error: record.error || undefined,
        details: record.details || undefined
      }));
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw new Error('Failed to fetch system health');
    }
  }

  /**
   * Get system metrics
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // These would typically come from monitoring tools like Prometheus, New Relic, etc.
      // For now, we'll simulate the data
      const metrics: SystemMetrics = {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        databaseConnections: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 1000) + 100,
        responseTime: Math.random() * 200 + 50,
        errorRate: Math.random() * 5
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw new Error('Failed to fetch system metrics');
    }
  }

  /**
   * Get system health history
   */
  static async getSystemHealthHistory(
    service?: string,
    hours = 24
  ): Promise<{ timestamp: Date; status: string; responseTime: number; uptime: number }[]> {
    try {
      // This would typically query a time-series database
      // For now, we'll return mock data
      const now = new Date();
      const history = [];
      
      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        history.push({
          timestamp,
          status: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'down',
          responseTime: Math.random() * 300 + 50,
          uptime: Math.random() * 2 + 98
        });
      }

      return history;
    } catch (error) {
      console.error('Error fetching system health history:', error);
      throw new Error('Failed to fetch system health history');
    }
  }

  /**
   * Check if system is experiencing issues
   */
  static async isSystemHealthy(): Promise<boolean> {
    try {
      const healthChecks = await this.getSystemHealth();
      return healthChecks.every(check => check.status === 'healthy');
    } catch (error) {
      console.error('Error checking system health:', error);
      return false;
    }
  }

  /**
   * Get services with degraded performance
   */
  static async getDegradedServices(): Promise<HealthCheck[]> {
    try {
      const healthChecks = await this.getSystemHealth();
      return healthChecks.filter(check => check.status === 'degraded');
    } catch (error) {
      console.error('Error fetching degraded services:', error);
      return [];
    }
  }

  /**
   * Get down services
   */
  static async getDownServices(): Promise<HealthCheck[]> {
    try {
      const healthChecks = await this.getSystemHealth();
      return healthChecks.filter(check => check.status === 'down');
    } catch (error) {
      console.error('Error fetching down services:', error);
      return [];
    }
  }

  /**
   * Run scheduled health checks
   */
  static async runScheduledHealthChecks(): Promise<void> {
    try {
      console.log('Running scheduled health checks...');
      
      const healthChecks = await this.performHealthChecks();
      await this.saveHealthCheckResults(healthChecks);
      
      // Log any issues
      const downServices = healthChecks.filter(check => check.status === 'down');
      const degradedServices = healthChecks.filter(check => check.status === 'degraded');
      
      if (downServices.length > 0) {
        console.error('DOWN SERVICES:', downServices.map(s => s.service));
      }
      
      if (degradedServices.length > 0) {
        console.warn('DEGRADED SERVICES:', degradedServices.map(s => s.service));
      }
      
      console.log('Health checks completed successfully');
    } catch (error) {
      console.error('Error running scheduled health checks:', error);
    }
  }
}

// Export a function to run health checks periodically
export function startHealthCheckScheduler(intervalMinutes = 5): NodeJS.Timeout {
  // Run initial health check
  SystemMonitoringService.runScheduledHealthChecks();
  
  // Schedule periodic health checks
  return setInterval(
    () => SystemMonitoringService.runScheduledHealthChecks(),
    intervalMinutes * 60 * 1000
  );
}

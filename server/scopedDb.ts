/**
 * Tenant-Scoped Database Operations for Multi-Tenant Data Isolation
 * 
 * This module provides database operation wrappers that automatically
 * enforce tenant isolation by adding WHERE tenant_id clauses to all queries.
 * 
 * CRITICAL SECURITY NOTE: All database operations MUST use these scoped
 * functions to prevent data leaks between tenants.
 */

import { db } from './db';
import { 
  getCurrentTenantContext, 
  requireTenantContext, 
  validateTenantAccess,
  logTenantContext 
} from './tenantContext';
import { and, eq, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

// Import all tables that have tenant_id columns
import {
  tenants,
  users,
  students,
  subjects,
  subjectCombos,
  comboSubjects,
  enrollments,
  invoices,
  invoiceItems,
  addOns,
  payments,
  paymentAllocations,
  invoiceAdjustments,
  billingSchedules,
  classes,
  attendance,
  assessments,
  grades,
  payoutRules,
  cashDrawRequests,
  dailyClose,
  expenses,
  announcements,
  announcementRecipients,
  classSchedules,
  scheduleChanges,
  studentNotifications,
} from '../shared/schema';

/**
 * Type helper to get the tenant_id column from a table
 */
type TenantAwareTable = {
  tenantId: any;
};

/**
 * Add tenant scope condition to WHERE clause
 */
function addTenantScope(table: TenantAwareTable, additionalConditions?: SQL): SQL {
  const context = requireTenantContext();
  
  const tenantCondition = eq(table.tenantId, context.tenantId);
  
  if (additionalConditions) {
    return and(tenantCondition, additionalConditions);
  }
  
  return tenantCondition;
}

/**
 * Scoped SELECT operations - automatically filters by tenant_id
 */
export const scopedDb = {
  // Users table operations
  users: {
    findMany: (conditions?: SQL) => {
      logTenantContext('users.findMany');
      return db.select().from(users).where(addTenantScope(users, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('users.findFirst');
      return db.select().from(users).where(addTenantScope(users, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('users.create');
      return db.insert(users).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('users.update');
      return db.update(users)
        .set(data)
        .where(and(eq(users.id, id), eq(users.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('users.delete');
      return db.delete(users)
        .where(and(eq(users.id, id), eq(users.tenantId, context.tenantId)));
    },
  },

  // Students table operations
  students: {
    findMany: (conditions?: SQL) => {
      logTenantContext('students.findMany');
      return db.select().from(students).where(addTenantScope(students, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('students.findFirst');
      return db.select().from(students).where(addTenantScope(students, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('students.create');
      return db.insert(students).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('students.update');
      return db.update(students)
        .set(data)
        .where(and(eq(students.id, id), eq(students.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('students.delete');
      return db.delete(students)
        .where(and(eq(students.id, id), eq(students.tenantId, context.tenantId)));
    },
  },

  // Subjects table operations
  subjects: {
    findMany: (conditions?: SQL) => {
      logTenantContext('subjects.findMany');
      return db.select().from(subjects).where(addTenantScope(subjects, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('subjects.findFirst');
      return db.select().from(subjects).where(addTenantScope(subjects, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('subjects.create');
      return db.insert(subjects).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('subjects.update');
      return db.update(subjects)
        .set(data)
        .where(and(eq(subjects.id, id), eq(subjects.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('subjects.delete');
      return db.delete(subjects)
        .where(and(eq(subjects.id, id), eq(subjects.tenantId, context.tenantId)));
    },
  },

  // Enrollments table operations
  enrollments: {
    findMany: (conditions?: SQL) => {
      logTenantContext('enrollments.findMany');
      return db.select().from(enrollments).where(addTenantScope(enrollments, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('enrollments.findFirst');
      return db.select().from(enrollments).where(addTenantScope(enrollments, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('enrollments.create');
      return db.insert(enrollments).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('enrollments.update');
      return db.update(enrollments)
        .set(data)
        .where(and(eq(enrollments.id, id), eq(enrollments.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('enrollments.delete');
      return db.delete(enrollments)
        .where(and(eq(enrollments.id, id), eq(enrollments.tenantId, context.tenantId)));
    },
  },

  // Invoices table operations
  invoices: {
    findMany: (conditions?: SQL) => {
      logTenantContext('invoices.findMany');
      return db.select().from(invoices).where(addTenantScope(invoices, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('invoices.findFirst');
      return db.select().from(invoices).where(addTenantScope(invoices, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('invoices.create');
      return db.insert(invoices).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('invoices.update');
      return db.update(invoices)
        .set(data)
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('invoices.delete');
      return db.delete(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, context.tenantId)));
    },
  },

  // Payments table operations
  payments: {
    findMany: (conditions?: SQL) => {
      logTenantContext('payments.findMany');
      return db.select().from(payments).where(addTenantScope(payments, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('payments.findFirst');
      return db.select().from(payments).where(addTenantScope(payments, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('payments.create');
      return db.insert(payments).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('payments.update');
      return db.update(payments)
        .set(data)
        .where(and(eq(payments.id, id), eq(payments.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('payments.delete');
      return db.delete(payments)
        .where(and(eq(payments.id, id), eq(payments.tenantId, context.tenantId)));
    },
  },

  // Classes table operations
  classes: {
    findMany: (conditions?: SQL) => {
      logTenantContext('classes.findMany');
      return db.select().from(classes).where(addTenantScope(classes, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('classes.findFirst');
      return db.select().from(classes).where(addTenantScope(classes, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('classes.create');
      return db.insert(classes).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('classes.update');
      return db.update(classes)
        .set(data)
        .where(and(eq(classes.id, id), eq(classes.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('classes.delete');
      return db.delete(classes)
        .where(and(eq(classes.id, id), eq(classes.tenantId, context.tenantId)));
    },
  },

  // Attendance table operations
  attendance: {
    findMany: (conditions?: SQL) => {
      logTenantContext('attendance.findMany');
      return db.select().from(attendance).where(addTenantScope(attendance, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('attendance.findFirst');
      return db.select().from(attendance).where(addTenantScope(attendance, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('attendance.create');
      return db.insert(attendance).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('attendance.update');
      return db.update(attendance)
        .set(data)
        .where(and(eq(attendance.id, id), eq(attendance.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('attendance.delete');
      return db.delete(attendance)
        .where(and(eq(attendance.id, id), eq(attendance.tenantId, context.tenantId)));
    },
  },

  // Assessments table operations
  assessments: {
    findMany: (conditions?: SQL) => {
      logTenantContext('assessments.findMany');
      return db.select().from(assessments).where(addTenantScope(assessments, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('assessments.findFirst');
      return db.select().from(assessments).where(addTenantScope(assessments, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('assessments.create');
      return db.insert(assessments).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('assessments.update');
      return db.update(assessments)
        .set(data)
        .where(and(eq(assessments.id, id), eq(assessments.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('assessments.delete');
      return db.delete(assessments)
        .where(and(eq(assessments.id, id), eq(assessments.tenantId, context.tenantId)));
    },
  },

  // Grades table operations
  grades: {
    findMany: (conditions?: SQL) => {
      logTenantContext('grades.findMany');
      return db.select().from(grades).where(addTenantScope(grades, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('grades.findFirst');
      return db.select().from(grades).where(addTenantScope(grades, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('grades.create');
      return db.insert(grades).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('grades.update');
      return db.update(grades)
        .set(data)
        .where(and(eq(grades.id, id), eq(grades.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('grades.delete');
      return db.delete(grades)
        .where(and(eq(grades.id, id), eq(grades.tenantId, context.tenantId)));
    },
  },

  // Announcements table operations
  announcements: {
    findMany: (conditions?: SQL) => {
      logTenantContext('announcements.findMany');
      return db.select().from(announcements).where(addTenantScope(announcements, conditions));
    },
    
    findFirst: (conditions?: SQL) => {
      logTenantContext('announcements.findFirst');
      return db.select().from(announcements).where(addTenantScope(announcements, conditions)).limit(1);
    },
    
    create: (data: any) => {
      const context = requireTenantContext();
      logTenantContext('announcements.create');
      return db.insert(announcements).values({ ...data, tenantId: context.tenantId }).returning();
    },
    
    update: (id: string, data: any) => {
      const context = requireTenantContext();
      logTenantContext('announcements.update');
      return db.update(announcements)
        .set(data)
        .where(and(eq(announcements.id, id), eq(announcements.tenantId, context.tenantId)))
        .returning();
    },
    
    delete: (id: string) => {
      const context = requireTenantContext();
      logTenantContext('announcements.delete');
      return db.delete(announcements)
        .where(and(eq(announcements.id, id), eq(announcements.tenantId, context.tenantId)));
    },
  },

  // Tenant operations (only for super admins or system operations)
  tenants: {
    findMany: () => {
      // Only system-level operations should access all tenants
      logTenantContext('tenants.findMany - SYSTEM OPERATION');
      return db.select().from(tenants);
    },
    
    findById: (id: string) => {
      logTenantContext('tenants.findById');
      return db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    },
    
    create: (data: any) => {
      logTenantContext('tenants.create - SYSTEM OPERATION');
      return db.insert(tenants).values(data).returning();
    },
    
    update: (id: string, data: any) => {
      logTenantContext('tenants.update');
      return db.update(tenants)
        .set(data)
        .where(eq(tenants.id, id))
        .returning();
    },
  },
};

/**
 * Utility function to validate that a record belongs to the current tenant
 * Use this when you need to check tenant ownership of a record before operations
 */
export async function validateRecordTenantAccess(
  table: TenantAwareTable, 
  recordId: string, 
  resourceType: string = 'record'
): Promise<void> {
  const context = requireTenantContext();
  
  const record = await db.select({ tenantId: table.tenantId })
    .from(table as any)
    .where(eq((table as any).id, recordId))
    .limit(1);
  
  if (record.length === 0) {
    throw new Error(`${resourceType} not found`);
  }
  
  validateTenantAccess(record[0].tenantId, resourceType);
}

/**
 * Raw query wrapper that automatically adds tenant scoping
 * Use with caution - prefer the typed operations above
 */
export function createTenantScopedQuery<T extends TenantAwareTable>(
  table: T, 
  additionalConditions?: SQL
): SQL {
  return addTenantScope(table, additionalConditions);
}

export default scopedDb;

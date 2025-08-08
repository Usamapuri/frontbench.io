import {
  users,
  students,
  subjects,
  classes,
  enrollments,
  invoices,
  payments,
  paymentAllocations,
  invoiceAdjustments,
  billingSchedules,
  attendance,
  assessments,
  grades,
  cashDrawRequests,
  dailyClose,
  expenses,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Subject,
  type Class,
  type Invoice,
  type Payment,
  type Attendance,
  type Assessment,
  type Grade,
  type CashDrawRequest,
  type DailyClose,
  type Expense,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count, sum, avg } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectsByClassLevel(classLevel: string): Promise<Subject[]>;
  
  // Classes
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getTodayClasses(teacherId: string): Promise<any[]>;
  
  // Enrollments
  getStudentsByClass(classId: string): Promise<any[]>;
  
  // Invoices
  getInvoices(limit?: number): Promise<Invoice[]>;
  getStudentInvoices(studentId: string): Promise<Invoice[]>;
  createInvoice(invoice: any): Promise<Invoice>;
  
  // Payments
  getPayments(limit?: number): Promise<Payment[]>;
  createPayment(payment: any): Promise<Payment>;
  
  // Attendance
  createAttendance(attendanceData: any): Promise<Attendance>;
  getAttendanceByClass(classId: string, date: string): Promise<Attendance[]>;
  getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  
  // Grades
  createAssessment(assessment: any): Promise<Assessment>;
  createGrade(grade: any): Promise<Grade>;
  getStudentGrades(studentId: string): Promise<Grade[]>;
  
  // Cash Draw Requests
  getCashDrawRequests(): Promise<CashDrawRequest[]>;
  
  // Enhanced Billing System
  getStudentFinancialSummary(studentId: string): Promise<{
    totalOwed: number;
    totalPaid: number;
    outstandingBalance: number;
    feeStatus: 'paid' | 'pending' | 'overdue' | 'partial';
    lastPaymentDate?: Date;
  }>;
  
  getStudentAttendancePercentage(studentId: string): Promise<number>;
  getStudentAverageGrade(studentId: string): Promise<string>;
  
  // Advanced Billing Operations
  createPaymentWithAllocations(paymentData: any, allocations: any[]): Promise<Payment>;
  addInvoiceAdjustment(invoiceId: string, adjustment: any): Promise<any>;
  getStudentLedger(studentId: string): Promise<any[]>;
  createBillingSchedule(scheduleData: any): Promise<any>;
  generateRecurringInvoices(date?: string): Promise<Invoice[]>;
  createCashDrawRequest(request: any): Promise<CashDrawRequest>;
  updateCashDrawRequest(id: string, updates: any): Promise<CashDrawRequest>;
  
  // Daily Close
  getDailyClose(date: string): Promise<DailyClose | undefined>;
  createDailyClose(dailyCloseData: any): Promise<DailyClose>;
  
  // Expenses
  getExpenses(limit?: number): Promise<Expense[]>;
  createExpense(expense: any): Promise<Expense>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  getTeacherEarnings(teacherId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.firstName);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.isActive, true));
  }

  async getSubjectsByClassLevel(classLevel: string): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.classLevel, classLevel as any), eq(subjects.isActive, true)));
  }

  // Classes
  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(and(eq(classes.teacherId, teacherId), eq(classes.isActive, true)));
  }

  async getTodayClasses(teacherId: string): Promise<any[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    return await db
      .select({
        id: classes.id,
        name: classes.name,
        startTime: classes.startTime,
        endTime: classes.endTime,
        subject: subjects.name,
      })
      .from(classes)
      .innerJoin(subjects, eq(classes.subjectId, subjects.id))
      .where(
        and(
          eq(classes.teacherId, teacherId),
          eq(classes.dayOfWeek, dayOfWeek),
          eq(classes.isActive, true)
        )
      )
      .orderBy(classes.startTime);
  }

  // Enrollments
  async getStudentsByClass(classId: string): Promise<any[]> {
    return await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        rollNumber: students.rollNumber,
        profileImageUrl: students.profileImageUrl,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(classes, eq(classes.subjectId, enrollments.subjectId))
      .where(and(eq(classes.id, classId), eq(enrollments.isActive, true)));
  }

  // Invoices
  async getInvoices(limit = 50): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    return result.length > 0 ? result[0] : null;
  }

  async getStudentInvoices(studentId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoiceData: any): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  // Payments
  async getPayments(limit = 50): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  async createPayment(paymentData: any): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async processPartialPayment(paymentData: {
    paymentAmount: number;
    studentId: string;
    paymentMethod: string;
    paymentDate: string | Date;
    receivedBy: string;
    notes: string;
    transactionNumber?: string | null;
    invoiceId: string;
  }): Promise<any> {
    // Get the invoice to validate and update
    const invoice = await this.getInvoiceById(paymentData.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const currentBalance = parseFloat(invoice.balanceDue);
    if (paymentData.paymentAmount > currentBalance) {
      throw new Error('Payment amount cannot exceed invoice balance');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}`;

    // Create payment record
    const [payment] = await db.insert(payments).values({
      receiptNumber: receiptNumber,
      studentId: paymentData.studentId,
      amount: paymentData.paymentAmount.toFixed(2),
      paymentMethod: paymentData.paymentMethod,
      paymentDate: typeof paymentData.paymentDate === 'string' ? new Date(paymentData.paymentDate) : paymentData.paymentDate,
      receivedBy: paymentData.receivedBy || 'system',
      notes: paymentData.notes,
      transactionNumber: paymentData.transactionNumber,
      status: 'completed'
    }).returning();

    // Create payment allocation
    await db.insert(paymentAllocations).values({
      paymentId: payment.id,
      invoiceId: paymentData.invoiceId,
      amount: paymentData.paymentAmount.toFixed(2)
    });

    // Update invoice balances
    const newAmountPaid = parseFloat(invoice.amountPaid || '0') + paymentData.paymentAmount;
    const newBalanceDue = parseFloat(invoice.total) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'sent';

    await db.update(invoices)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        balanceDue: newBalanceDue.toFixed(2),
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, paymentData.invoiceId));

    return {
      payment,
      invoice: {
        ...invoice,
        amountPaid: newAmountPaid.toFixed(2),
        balanceDue: newBalanceDue.toFixed(2),
        status: newStatus
      }
    };
  }

  // Attendance
  async createAttendance(attendanceData: any): Promise<Attendance> {
    const [attendanceRecord] = await db.insert(attendance).values(attendanceData).returning();
    return attendanceRecord;
  }

  async getAttendanceByClass(classId: string, date: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.classId, classId), eq(attendance.attendanceDate, date)));
  }

  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    let conditions = [eq(attendance.studentId, studentId)];
    
    if (startDate) {
      conditions.push(gte(attendance.attendanceDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.attendanceDate, endDate));
    }
    
    return await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.attendanceDate));
  }

  // Grades
  async createAssessment(assessmentData: any): Promise<Assessment> {
    const [assessment] = await db.insert(assessments).values(assessmentData).returning();
    return assessment;
  }

  async createGrade(gradeData: any): Promise<Grade> {
    const [grade] = await db.insert(grades).values(gradeData).returning();
    return grade;
  }

  async getStudentGrades(studentId: string): Promise<Grade[]> {
    return await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, studentId))
      .orderBy(desc(grades.enteredAt));
  }

  // Cash Draw Requests
  async getCashDrawRequests(): Promise<CashDrawRequest[]> {
    return await db
      .select()
      .from(cashDrawRequests)
      .orderBy(desc(cashDrawRequests.requestedAt));
  }

  async createCashDrawRequest(requestData: any): Promise<CashDrawRequest> {
    const [request] = await db.insert(cashDrawRequests).values(requestData).returning();
    return request;
  }

  async updateCashDrawRequest(id: string, updates: any): Promise<CashDrawRequest> {
    const [updatedRequest] = await db
      .update(cashDrawRequests)
      .set(updates)
      .where(eq(cashDrawRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Daily Close
  async getDailyClose(date: string): Promise<DailyClose | undefined> {
    const [dailyCloseRecord] = await db
      .select()
      .from(dailyClose)
      .where(eq(dailyClose.closeDate, date));
    return dailyCloseRecord;
  }

  async createDailyClose(dailyCloseData: any): Promise<DailyClose> {
    const [dailyCloseRecord] = await db.insert(dailyClose).values(dailyCloseData).returning();
    return dailyCloseRecord;
  }

  // Expenses
  async getExpenses(limit = 50): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.createdAt))
      .limit(limit);
  }

  async createExpense(expenseData: any): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(expenseData).returning();
    return expense;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const totalStudents = await db.select({ count: count() }).from(students);
    const monthlyRevenue = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(gte(payments.paymentDate, sql`date_trunc('month', current_date)`));
    
    const pendingInvoices = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(eq(invoices.status, 'overdue'));

    const avgAttendance = await db
      .select({ avg: avg(sql`case when status = 'present' then 1.0 else 0.0 end`) })
      .from(attendance)
      .where(gte(attendance.attendanceDate, sql`date_trunc('month', current_date)`));

    return {
      totalStudents: totalStudents[0]?.count || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      pendingFees: pendingInvoices[0]?.total || 0,
      avgAttendance: Math.round(Number(avgAttendance[0]?.avg || 0) * 100),
    };
  }

  async getTeacherEarnings(teacherId: string): Promise<any> {
    // Calculate earnings based on enrollments and payout rules
    // This is a simplified version - in reality would be more complex
    return {
      baseAmount: 21000,
      extraClasses: 3500,
      total: 24500,
    };
  }
  
  async getStudentFinancialSummary(studentId: string): Promise<{
    totalOwed: number;
    totalPaid: number;
    outstandingBalance: number;
    feeStatus: 'paid' | 'pending' | 'overdue' | 'partial';
    lastPaymentDate?: Date;
  }> {
    // Get all invoices for this student
    const studentInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.studentId, studentId));
    
    // Get all payments for this student
    const studentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId));
    
    const totalOwed = studentInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalPaid = studentPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    const outstandingBalance = totalOwed - totalPaid;
    
    // Determine fee status
    let feeStatus: 'paid' | 'pending' | 'overdue' | 'partial' = 'paid';
    if (outstandingBalance > 0) {
      // Check if any invoices are overdue
      const now = new Date();
      const hasOverdueInvoice = studentInvoices.some(inv => 
        new Date(inv.dueDate) < now && inv.status !== 'paid'
      );
      
      if (hasOverdueInvoice) {
        feeStatus = 'overdue';
      } else if (totalPaid > 0 && outstandingBalance > 0) {
        feeStatus = 'partial';
      } else {
        feeStatus = 'pending';
      }
    }
    
    const lastPayment = studentPayments
      .filter(p => p.paymentDate)
      .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())[0];
    
    return {
      totalOwed,
      totalPaid,
      outstandingBalance,
      feeStatus,
      lastPaymentDate: lastPayment?.paymentDate ?? undefined
    };
  }
  
  async getStudentAttendancePercentage(studentId: string): Promise<number> {
    // Get all attendance records for this student in the current academic year
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId));
    
    if (attendanceRecords.length === 0) return 0;
    
    const presentCount = attendanceRecords.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length;
    
    return Math.round((presentCount / attendanceRecords.length) * 100);
  }
  
  async getStudentAverageGrade(studentId: string): Promise<string> {
    // Get all grades for this student
    const studentGrades = await db
      .select()
      .from(grades)
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(eq(grades.studentId, studentId));
    
    if (studentGrades.length === 0) return 'N/A';
    
    // Calculate percentage average
    const totalPercentage = studentGrades.reduce((sum, gradeRecord) => {
      const { grades: grade, assessments: assessment } = gradeRecord;
      const percentage = (grade.marksObtained / assessment.totalMarks) * 100;
      return sum + percentage;
    }, 0);
    
    const averagePercentage = totalPercentage / studentGrades.length;
    
    // Convert to grade
    if (averagePercentage >= 95) return 'A+';
    if (averagePercentage >= 90) return 'A';
    if (averagePercentage >= 85) return 'A-';
    if (averagePercentage >= 80) return 'B+';
    if (averagePercentage >= 75) return 'B';
    if (averagePercentage >= 70) return 'B-';
    if (averagePercentage >= 65) return 'C+';
    if (averagePercentage >= 60) return 'C';
    if (averagePercentage >= 55) return 'C-';
    if (averagePercentage >= 50) return 'D';
    return 'F';
  }

  // Missing methods to complete interface implementation
  async createPaymentWithAllocations(paymentData: any, allocations: any[]): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    
    // Create payment allocations
    for (const allocation of allocations) {
      await db.insert(paymentAllocations).values({
        paymentId: payment.id,
        ...allocation
      });
    }
    
    return payment;
  }

  async addInvoiceAdjustment(invoiceId: string, adjustment: any): Promise<any> {
    const [adjustmentRecord] = await db.insert(invoiceAdjustments).values({
      invoiceId,
      ...adjustment
    }).returning();
    return adjustmentRecord;
  }

  async getStudentLedger(studentId: string): Promise<any[]> {
    // Get student invoices and payments to create ledger
    const invoices = await this.getStudentInvoices(studentId);
    const studentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.createdAt));

    // Combine and sort by date
    const ledger = [
      ...invoices.map(inv => ({
        id: inv.id,
        date: inv.issueDate,
        type: 'invoice' as const,
        description: `Invoice #${inv.invoiceNumber}`,
        amount: parseFloat(inv.total),
        balance: 0 // Will be calculated
      })),
      ...studentPayments.map((pay: any) => ({
        id: pay.id,
        date: pay.paymentDate || pay.createdAt,
        type: 'payment' as const,
        description: `Payment #${pay.receiptNumber}`,
        amount: -parseFloat(pay.amount),
        balance: 0 // Will be calculated
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    ledger.forEach(entry => {
      runningBalance += entry.amount;
      entry.balance = runningBalance;
    });

    return ledger;
  }

  async createBillingSchedule(scheduleData: any): Promise<any> {
    const [schedule] = await db.insert(billingSchedules).values(scheduleData).returning();
    return schedule;
  }

  async generateRecurringInvoices(date?: string): Promise<Invoice[]> {
    // This would generate invoices based on billing schedules
    // For now, return empty array as placeholder
    return [];
  }
}

export const storage = new DatabaseStorage();

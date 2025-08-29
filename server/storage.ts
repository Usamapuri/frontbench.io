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
  payoutRules,
  cashDrawRequests,
  dailyClose,
  expenses,
  announcements,
  announcementRecipients,
  addOns,
  invoiceItems,
  classSchedules,
  scheduleChanges,
  studentNotifications,
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
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementRecipient,
  type InsertAnnouncementRecipient,
  type ClassSchedule,
  type InsertClassSchedule,
  type ScheduleChange,
  type InsertScheduleChange,
  type StudentNotification,
  type InsertStudentNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count, sum, avg } from "drizzle-orm";
import { PrimaxBillingService } from "./billing";

const billingService = new PrimaxBillingService();

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  toggleStudentActiveStatus(id: string, isActive: boolean): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Roll Number Management
  generateRollNumber(): Promise<string>;
  rollNumberExists(rollNumber: string): Promise<boolean>;
  getNextRollNumber(): Promise<string>;
  reserveRollNumber(): Promise<{ rollNumber: string; expiresAt: Date }>;
  assignRollNumbersToExistingStudents(): Promise<{ updated: number; errors: string[] }>;

  // Teacher and Staff Management
  createTeacher(teacherData: any): Promise<any>;
  getTeachers(): Promise<any[]>;
  updateTeacher(id: string, teacherData: any): Promise<any>;
  deleteTeacher(id: string): Promise<void>;
  createStaff(staffData: any): Promise<any>;
  getStaff(): Promise<any[]>;
  updateStaff(id: string, staffData: any): Promise<any>;
  deleteStaff(id: string): Promise<void>;
  createPayoutRule(payoutData: any): Promise<any>;
  
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectsByClassLevel(classLevel: string): Promise<Subject[]>;
  
  // Classes
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getTodayClasses(teacherId: string): Promise<any[]>;
  getClassesForDay(dayOfWeek: number): Promise<any[]>;
  
  // Enrollments
  getStudentsByClass(classId: string): Promise<any[]>;
  createEnrollment(enrollment: any): Promise<any>;
  
  // Invoices
  getInvoices(limit?: number): Promise<Invoice[]>;
  getStudentInvoices(studentId: string): Promise<Invoice[]>;
  getInvoiceById(invoiceId: string): Promise<Invoice | null>;
  createInvoice(invoice: any): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  getInvoicesByStudent(studentId: string): Promise<Invoice[]>;
  getEnrollmentsByStudent(studentId: string): Promise<any[]>;
  getSubjectById(subjectId: string): Promise<Subject | null>;
  createPaymentAllocation(allocationData: { paymentId: string; invoiceId: string; amount: string; }): Promise<any>;
  
  // Payments
  getPayments(limit?: number): Promise<Payment[]>;
  createPayment(payment: any): Promise<Payment>;
  
  // Attendance
  createAttendance(attendanceData: any): Promise<Attendance>;
  getAttendanceByClassAndDate(classId: string, date: string): Promise<Attendance[]>;
  getAttendanceRecord(classId: string, studentId: string, date: string): Promise<Attendance | undefined>;
  updateAttendance(attendanceId: string, updates: Partial<Attendance>): Promise<Attendance>;
  getAttendanceByClass(classId: string, date: string): Promise<Attendance[]>;
  getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  
  // Assessments
  getAssessments(): Promise<Assessment[]>;
  getTeacherAssessments(teacherId: string): Promise<Assessment[]>;
  createAssessment(assessment: any): Promise<Assessment>;
  
  // Grades
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
  
  // Staff Members (for expense tracking)
  getStaffMembers(): Promise<any[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  getTeacherEarnings(teacherId: string): Promise<any>;

  // Teacher Data Isolation
  getTeacherSubjects(teacherId: string): Promise<Subject[]>;
  getTeacherStudents(teacherId: string): Promise<Student[]>;
  getTeacherEarningsRestricted(teacherId: string): Promise<any>;
  getTeacherAnnouncements(teacherId: string): Promise<Announcement[]>;

  // Digital Diary - Announcements
  getAnnouncements(teacherId?: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;
  
  // Announcement Recipients
  addAnnouncementRecipients(announcementId: string, studentIds: string[]): Promise<void>;
  getStudentAnnouncements(studentId: string): Promise<any[]>;
  markAnnouncementAsRead(announcementId: string, studentId: string): Promise<void>;
  getAnnouncementsByClass(classId: string): Promise<Announcement[]>;
  getAnnouncementsBySubject(subjectId: string): Promise<Announcement[]>;

  // Add-ons
  getAddOns(): Promise<any[]>;
  createAddOn(addOn: any): Promise<any>;

  // Schedule Management
  getTeacherSchedules(teacherId: string): Promise<ClassSchedule[]>;
  createSchedule(schedule: InsertClassSchedule): Promise<ClassSchedule>;
  updateSchedule(id: string, updates: Partial<InsertClassSchedule>): Promise<ClassSchedule>;
  deleteSchedule(id: string): Promise<void>;
  
  // Schedule Changes
  getScheduleChanges(teacherId: string, startDate?: Date, endDate?: Date): Promise<ScheduleChange[]>;
  createScheduleChange(change: InsertScheduleChange): Promise<ScheduleChange>;
  updateScheduleChange(id: string, updates: Partial<InsertScheduleChange>): Promise<ScheduleChange>;
  deleteScheduleChange(id: string): Promise<void>;
  
  // Student Schedule & Notifications
  getStudentSchedule(studentId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getStudentNotifications(studentId: string): Promise<StudentNotification[]>;
  createStudentNotification(notification: InsertStudentNotification): Promise<StudentNotification>;
  markNotificationRead(notificationId: string): Promise<void>;
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
    // Generate roll number if not provided
    if (!student.rollNumber) {
      student.rollNumber = await this.generateRollNumber();
    }
    
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  // Roll number generation system
  async generateRollNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits (e.g., "25" for 2025)
    
    let rollNumber: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      // Generate random 4-digit number
      const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      rollNumber = `PMX${yearSuffix}-${randomNum}`;
      attempts++;
      
      // Check if this roll number already exists
      const exists = await this.rollNumberExists(rollNumber);
      if (!exists) {
        break;
      }
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique roll number after maximum attempts');
    }
    
    // Format: PMXyy-#### (e.g., PMX25-4782, PMX25-8391)
    return rollNumber;
  }



  // Get next available roll number for preview
  async getNextRollNumber(): Promise<string> {
    return await this.generateRollNumber();
  }

  // Reserve a roll number for temporary use (30 minutes)
  async reserveRollNumber(): Promise<{ rollNumber: string; expiresAt: Date }> {
    const rollNumber = await this.generateRollNumber();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    // For now, we'll store reservations in memory (in production, use Redis or database)
    if (!global.rollNumberReservations) {
      global.rollNumberReservations = new Map();
    }
    
    global.rollNumberReservations.set(rollNumber, expiresAt);
    
    // Clean up expired reservations
    this.cleanupExpiredReservations();
    
    return { rollNumber, expiresAt };
  }

  // Clean up expired roll number reservations
  private cleanupExpiredReservations() {
    if (!global.rollNumberReservations) return;
    
    const now = new Date();
    for (const [rollNumber, expiresAt] of global.rollNumberReservations.entries()) {
      if (expiresAt < now) {
        global.rollNumberReservations.delete(rollNumber);
      }
    }
  }

  // Check if roll number exists (including reservations)
  async rollNumberExists(rollNumber: string): Promise<boolean> {
    // Check database
    const [existing] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.rollNumber, rollNumber))
      .limit(1);
    
    if (existing) return true;
    
    // Check reservations
    if (global.rollNumberReservations?.has(rollNumber)) {
      const expiresAt = global.rollNumberReservations.get(rollNumber);
      if (expiresAt && expiresAt > new Date()) {
        return true; // Still reserved
      } else {
        global.rollNumberReservations.delete(rollNumber); // Expired, clean up
      }
    }
    
    return false;
  }

  // Bulk assign roll numbers to existing students without them
  async assignRollNumbersToExistingStudents(): Promise<{ updated: number; errors: string[] }> {
    const studentsWithoutRollNumbers = await db
      .select()
      .from(students)
      .where(sql`${students.rollNumber} IS NULL OR ${students.rollNumber} = '' OR ${students.rollNumber} ~ '^[0-9]+$'`);
    
    let updated = 0;
    const errors: string[] = [];
    
    for (const student of studentsWithoutRollNumbers) {
      try {
        const newRollNumber = await this.generateRollNumber();
        await db
          .update(students)
          .set({ 
            rollNumber: newRollNumber, 
            updatedAt: new Date() 
          })
          .where(eq(students.id, student.id));
        updated++;
      } catch (error) {
        errors.push(`Failed to update student ${student.firstName} ${student.lastName}: ${error}`);
      }
    }
    
    return { updated, errors };
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async toggleStudentActiveStatus(id: string, isActive: boolean): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    // First delete related records, then the student
    
    // Get all payments for this student to delete their allocations
    const studentPayments = await db.select({ id: payments.id }).from(payments).where(eq(payments.studentId, id));
    const paymentIds = studentPayments.map(p => p.id);
    
    // Delete payment allocations for this student's payments
    if (paymentIds.length > 0) {
      for (const paymentId of paymentIds) {
        await db.delete(paymentAllocations).where(eq(paymentAllocations.paymentId, paymentId));
      }
    }
    
    // Delete grades (which link assessments to students)
    await db.delete(grades).where(eq(grades.studentId, id));
    
    // Delete attendance records
    await db.delete(attendance).where(eq(attendance.studentId, id));
    
    // Delete enrollments
    await db.delete(enrollments).where(eq(enrollments.studentId, id));
    
    // Delete billing schedules
    await db.delete(billingSchedules).where(eq(billingSchedules.studentId, id));
    
    // Delete invoice adjustments for this student's invoices
    const studentInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.studentId, id));
    const invoiceIds = studentInvoices.map(i => i.id);
    
    if (invoiceIds.length > 0) {
      for (const invoiceId of invoiceIds) {
        await db.delete(invoiceAdjustments).where(eq(invoiceAdjustments.invoiceId, invoiceId));
        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      }
    }
    
    // Delete invoices
    await db.delete(invoices).where(eq(invoices.studentId, id));
    
    // Delete payments
    await db.delete(payments).where(eq(payments.studentId, id));
    
    // Delete announcement recipients
    await db.delete(announcementRecipients).where(eq(announcementRecipients.studentId, id));
    
    // Delete student notifications
    await db.delete(studentNotifications).where(eq(studentNotifications.studentId, id));
    
    // Finally, delete the student
    await db.delete(students).where(eq(students.id, id));
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.isActive, true));
  }

  async getSubjectsByClassLevel(classLevel: string): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(and(sql`${classLevel} = ANY(${subjects.classLevels})`, eq(subjects.isActive, true)));
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
    
    // Convert JavaScript Date.getDay() (0-6, 0=Sunday) to dayOfWeekEnum strings
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayString = dayNames[dayOfWeek];
    
    return await db
      .select({
        id: classSchedules.id,
        subject: subjects.name,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        location: classSchedules.location,
      })
      .from(classSchedules)
      .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
      .where(
        and(
          eq(classSchedules.teacherId, teacherId),
          eq(classSchedules.dayOfWeek, todayString as any),
          eq(classSchedules.isActive, true)
        )
      )
      .orderBy(classSchedules.startTime);
  }

  async getClassesForDay(dayOfWeek: number): Promise<any[]> {
    return await db
      .select({
        id: classes.id,
        name: classes.name,
        startTime: classes.startTime,
        endTime: classes.endTime,
        subject: subjects.name,
        teacherName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Demo Teacher')`,
        teacherId: classes.teacherId,
      })
      .from(classes)
      .innerJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(users, eq(classes.teacherId, users.id))
      .where(
        and(
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
  async getInvoices(limit = 50): Promise<any[]> {
    return await db
      .select({
        ...invoices,
        studentRollNumber: students.rollNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
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

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updated) {
      throw new Error('Invoice not found');
    }
    
    return updated;
  }

  async getInvoicesByStudent(studentId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.studentId, studentId))
      .orderBy(desc(invoices.createdAt));
  }

  async createEnrollment(enrollmentData: any): Promise<any> {
    const [enrollment] = await db.insert(enrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: string): Promise<any[]> {
    return await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        subjectId: enrollments.subjectId,
        subjectName: subjects.name,
        tuitionFee: subjects.baseFee,
        enrollmentDate: enrollments.enrolledAt,
        isActive: enrollments.isActive,
      })
      .from(enrollments)
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.isActive, true)));
  }

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    const result = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));
    
    return result.length > 0 ? result[0] : null;
  }

  async createPaymentAllocation(allocationData: {
    paymentId: string;
    invoiceId: string;
    amount: string;
  }): Promise<any> {
    const [allocation] = await db.insert(paymentAllocations).values(allocationData).returning();
    return allocation;
  }

  // Payments
  async getPayments(limit = 50): Promise<any[]> {
    return await db
      .select({
        ...payments,
        studentRollNumber: students.rollNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  async createPayment(paymentData: any): Promise<Payment> {
    // Ensure receiptNumber is provided or generate clean one
    let receiptNumber = paymentData.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await billingService.generateReceiptNumber();
    }
    const paymentDataWithReceipt = {
      ...paymentData,
      receiptNumber
    };
    const [payment] = await db.insert(payments).values(paymentDataWithReceipt).returning();
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
      throw new Error(`Payment amount Rs. ${paymentData.paymentAmount.toLocaleString()} exceeds invoice balance Rs. ${currentBalance.toLocaleString()}`);
    }
    
    if (currentBalance <= 0) {
      throw new Error('Invoice is already fully paid and cannot accept additional payments');
    }

    // Create payment record with clean receipt number based on invoice
    const cleanReceiptNumber = await billingService.generateReceiptNumber(invoice.invoiceNumber);
    const [payment] = await db.insert(payments).values({
      receiptNumber: cleanReceiptNumber,
      studentId: paymentData.studentId,
      amount: paymentData.paymentAmount.toFixed(2),
      paymentMethod: paymentData.paymentMethod as "cash" | "bank_transfer" | "card" | "cheque",
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

  async getAttendanceByClassAndDate(classId: string, date: string): Promise<any[]> {
    return await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        status: attendance.status,
        markedBy: attendance.markedBy,
        markedAt: attendance.markedAt,
        notes: attendance.notes,
        student: {
          firstName: students.firstName,
          lastName: students.lastName,
          rollNumber: students.rollNumber,
        }
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(
        and(
          eq(attendance.classId, classId),
          eq(attendance.attendanceDate, date)
        )
      );
  }

  async getAttendanceRecord(classId: string, studentId: string, date: string): Promise<Attendance | undefined> {
    const result = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          eq(attendance.studentId, studentId),
          eq(attendance.attendanceDate, date)
        )
      );

    return result.length > 0 ? result[0] : undefined;
  }

  async updateAttendance(attendanceId: string, updates: Partial<Attendance>): Promise<Attendance> {
    const [updated] = await db
      .update(attendance)
      .set({
        ...updates,
      })
      .where(eq(attendance.id, attendanceId))
      .returning();
    
    if (!updated) {
      throw new Error('Attendance record not found');
    }
    
    return updated;
  }

  // Grades
  async getAssessments(): Promise<Assessment[]> {
    const allAssessments = await db.select().from(assessments).orderBy(desc(assessments.createdAt));
    return allAssessments;
  }

  async getTeacherAssessments(teacherId: string): Promise<Assessment[]> {
    const teacherAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.teacherId, teacherId))
      .orderBy(desc(assessments.createdAt));
    return teacherAssessments;
  }

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

  async updateDailyClose(date: string, updates: any): Promise<DailyClose> {
    const [updatedRecord] = await db
      .update(dailyClose)
      .set(updates)
      .where(eq(dailyClose.closeDate, date))
      .returning();
    return updatedRecord;
  }

  async getAllDailyCloses(): Promise<DailyClose[]> {
    return await db
      .select()
      .from(dailyClose)
      .orderBy(desc(dailyClose.closeDate));
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

  // Staff Members (for expense tracking)
  async getStaffMembers(): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(sql`${users.role} IN ('teacher', 'management', 'finance')`)
      .orderBy(users.firstName);
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

  // Digital Diary - Announcement Implementation
  async getAnnouncements(teacherId?: string): Promise<Announcement[]> {
    const whereCondition = teacherId 
      ? and(eq(announcements.isActive, true), eq(announcements.createdBy, teacherId))
      : eq(announcements.isActive, true);

    return await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        type: announcements.type,
        priority: announcements.priority,
        createdBy: announcements.createdBy,
        subjectId: announcements.subjectId,
        classId: announcements.classId,
        dueDate: announcements.dueDate,
        isActive: announcements.isActive,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(whereCondition)
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.update(announcements)
      .set({ isActive: false })
      .where(eq(announcements.id, id));
  }

  async addAnnouncementRecipients(announcementId: string, studentIds: string[]): Promise<void> {
    const recipients = studentIds.map(studentId => ({
      announcementId,
      studentId,
    }));
    
    await db.insert(announcementRecipients).values(recipients);
  }

  async getStudentAnnouncements(studentId: string): Promise<any[]> {
    const results = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        type: announcements.type,
        priority: announcements.priority,
        dueDate: announcements.dueDate,
        createdAt: announcements.createdAt,
        isRead: announcementRecipients.isRead,
        readAt: announcementRecipients.readAt,
        // Include teacher and subject info
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(announcementRecipients)
      .innerJoin(announcements, eq(announcementRecipients.announcementId, announcements.id))
      .innerJoin(users, eq(announcements.createdBy, users.id))
      .leftJoin(subjects, eq(announcements.subjectId, subjects.id))
      .where(
        and(
          eq(announcementRecipients.studentId, studentId),
          eq(announcements.isActive, true)
        )
      )
      .orderBy(desc(announcements.createdAt));

    return results;
  }

  async markAnnouncementAsRead(announcementId: string, studentId: string): Promise<void> {
    await db
      .update(announcementRecipients)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(announcementRecipients.announcementId, announcementId),
          eq(announcementRecipients.studentId, studentId)
        )
      );
  }

  async getAnnouncementsByClass(classId: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.classId, classId),
          eq(announcements.isActive, true)
        )
      )
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementsBySubject(subjectId: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.subjectId, subjectId),
          eq(announcements.isActive, true)
        )
      )
      .orderBy(desc(announcements.createdAt));
  }

  // Add-ons management
  async getAddOns(): Promise<any[]> {
    try {
      return await db.select().from(addOns).orderBy(addOns.name);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      return [];
    }
  }

  async createAddOn(addOnData: any): Promise<any> {
    const [addOn] = await db.insert(addOns).values({
      name: addOnData.name,
      description: addOnData.description || '',
      price: addOnData.price.toString(),
      isActive: addOnData.isActive ?? true,
      category: addOnData.category || 'other',
    }).returning();
    return addOn;
  }

  // Enhanced invoice creation with items
  async createInvoiceWithItems(invoiceData: any): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Use provided totals or calculate from items
    const subtotal = parseFloat(invoiceData.subtotal) || invoiceData.items.reduce((sum: number, item: any) => 
      sum + parseFloat(item.totalPrice), 0);
    const discountAmount = parseFloat(invoiceData.discountAmount) || 0;
    const total = parseFloat(invoiceData.total) || (subtotal - discountAmount);

    // Create invoice
    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      studentId: invoiceData.studentId,
      billingPeriodStart: invoiceData.billingPeriodStart || invoiceData.dueDate,
      billingPeriodEnd: invoiceData.billingPeriodEnd || invoiceData.dueDate,
      issueDate: invoiceData.dueDate,
      dueDate: invoiceData.dueDate,
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      amountPaid: '0.00',
      balanceDue: total.toFixed(2),
      status: 'sent',
      notes: invoiceData.notes || '',
      createdBy: invoiceData.createdBy || 'system',
    }).returning();

    // Create invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        type: item.type,
        subjectId: item.type === 'subject' ? item.itemId : null,
        addOnId: item.type === 'addon' ? item.itemId : null,
        description: item.description || item.name || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
      }));
      
      await db.insert(invoiceItems).values(itemsToInsert);
    }

    return invoice;
  }

  async updateInvoiceWithItems(invoiceId: string, invoiceData: any): Promise<Invoice> {
    // Update invoice
    const [invoice] = await db
      .update(invoices)
      .set({
        dueDate: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discountAmount || '0.00',
        total: invoiceData.total,
        balanceDue: invoiceData.total,
        notes: invoiceData.notes || '',
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    // Delete existing items and recreate
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        type: item.type,
        subjectId: item.type === 'subject' ? item.itemId : null,
        addOnId: item.type === 'addon' ? item.itemId : null,
        description: item.description || item.name || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
      }));
      
      await db.insert(invoiceItems).values(itemsToInsert);
    }

    return invoice;
  }

  // Teacher Data Isolation Methods
  async getTeacherSubjects(teacherId: string): Promise<Subject[]> {
    return await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        classLevels: subjects.classLevels,
        baseFee: subjects.baseFee,
        description: subjects.description,
        isActive: subjects.isActive,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .innerJoin(enrollments, eq(subjects.id, enrollments.subjectId))
      .where(and(
        eq(enrollments.teacherId, teacherId),
        eq(subjects.isActive, true)
      ))
      .groupBy(subjects.id);
  }

  async getTeacherStudents(teacherId: string): Promise<Student[]> {
    return await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        classLevels: students.classLevels,
        parentId: students.parentId,
        profileImageUrl: students.profileImageUrl,
        isActive: students.isActive,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(enrollments, eq(students.id, enrollments.studentId))
      .where(and(
        eq(enrollments.teacherId, teacherId),
        eq(students.isActive, true)
      ))
      .groupBy(students.id);
  }

  async getTeacherEarningsRestricted(teacherId: string): Promise<any> {
    // Get teacher's subjects first
    const teacherSubjects = await this.getTeacherSubjects(teacherId);
    const subjectIds = teacherSubjects.map(s => s.id);
    
    if (subjectIds.length === 0) {
      return {
        baseAmount: 0,
        extraClasses: 0,
        bonuses: 0,
        deductions: 0,
        netAmount: 0,
        subjectBreakdown: []
      };
    }

    // Calculate earnings only for teacher's subjects
    const earnings = {
      baseAmount: teacherSubjects.reduce((sum, subject) => 
        sum + parseFloat(subject.baseFee), 0),
      extraClasses: 3500, // Placeholder - would calculate from actual extra classes
      bonuses: 2000,
      deductions: 500,
      netAmount: 0,
      subjectBreakdown: teacherSubjects.map(subject => ({
        subjectName: subject.name,
        studentCount: 0, // Will be calculated
        baseFee: parseFloat(subject.baseFee)
      }))
    };
    
    earnings.netAmount = earnings.baseAmount + earnings.extraClasses + earnings.bonuses - earnings.deductions;
    
    return earnings;
  }

  async getTeacherAnnouncements(teacherId: string): Promise<Announcement[]> {
    // Get announcements created by this teacher only
    return await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        type: announcements.type,
        priority: announcements.priority,
        createdBy: announcements.createdBy,
        subjectId: announcements.subjectId,
        classId: announcements.classId,
        dueDate: announcements.dueDate,
        isActive: announcements.isActive,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(and(
        eq(announcements.createdBy, teacherId),
        eq(announcements.isActive, true)
      ))
      .orderBy(desc(announcements.createdAt));
  }

  // Schedule Management Implementation
  async getTeacherSchedules(teacherId: string): Promise<ClassSchedule[]> {
    return await db
      .select({
        id: classSchedules.id,
        teacherId: classSchedules.teacherId,
        subjectId: classSchedules.subjectId,
        dayOfWeek: classSchedules.dayOfWeek,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        location: classSchedules.location,
        isActive: classSchedules.isActive,
        createdAt: classSchedules.createdAt,
        updatedAt: classSchedules.updatedAt,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(classSchedules)
      .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
      .where(
        and(
          eq(classSchedules.teacherId, teacherId),
          eq(classSchedules.isActive, true)
        )
      )
      .orderBy(classSchedules.dayOfWeek, classSchedules.startTime);
  }

  async createSchedule(schedule: InsertClassSchedule): Promise<ClassSchedule> {
    const [newSchedule] = await db.insert(classSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: string, updates: Partial<InsertClassSchedule>): Promise<ClassSchedule> {
    const [updatedSchedule] = await db
      .update(classSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    await db
      .update(classSchedules)
      .set({ isActive: false })
      .where(eq(classSchedules.id, id));
  }

  // Schedule Changes Implementation
  async getScheduleChanges(teacherId: string, startDate?: Date, endDate?: Date): Promise<ScheduleChange[]> {
    const conditions = [eq(scheduleChanges.teacherId, teacherId)];
    
    if (startDate) {
      conditions.push(gte(scheduleChanges.affectedDate, startDate.toISOString().split('T')[0]));
    }
    if (endDate) {
      conditions.push(lte(scheduleChanges.affectedDate, endDate.toISOString().split('T')[0]));
    }

    return await db
      .select()
      .from(scheduleChanges)
      .innerJoin(subjects, eq(scheduleChanges.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(scheduleChanges.affectedDate));
  }

  async createScheduleChange(change: InsertScheduleChange): Promise<ScheduleChange> {
    const [newChange] = await db.insert(scheduleChanges).values(change).returning();
    
    // Auto-generate notifications for affected students
    await this.generateScheduleChangeNotifications(newChange.id);
    
    return newChange;
  }

  async updateScheduleChange(id: string, updates: Partial<InsertScheduleChange>): Promise<ScheduleChange> {
    const [updatedChange] = await db
      .update(scheduleChanges)
      .set(updates)
      .where(eq(scheduleChanges.id, id))
      .returning();
    return updatedChange;
  }

  async deleteScheduleChange(id: string): Promise<void> {
    await db.delete(scheduleChanges).where(eq(scheduleChanges.id, id));
  }

  // Helper method to generate notifications for schedule changes
  private async generateScheduleChangeNotifications(scheduleChangeId: string): Promise<void> {
    // Get the schedule change details
    const [change] = await db
      .select()
      .from(scheduleChanges)
      .where(eq(scheduleChanges.id, scheduleChangeId));

    if (!change) return;

    // Get students enrolled in the affected subject
    const enrolledStudents = await db
      .select({ id: students.id })
      .from(students)
      .innerJoin(enrollments, eq(students.id, enrollments.studentId))
      .where(
        and(
          eq(enrollments.subjectId, change.subjectId),
          eq(enrollments.isActive, true),
          eq(students.isActive, true)
        )
      );

    // Generate notification message
    const subject = await db
      .select({ name: subjects.name })
      .from(subjects)
      .where(eq(subjects.id, change.subjectId));

    let message = '';
    const subjectName = subject[0]?.name || 'Class';
    const affectedDate = new Date(change.affectedDate).toLocaleDateString();

    switch (change.changeType) {
      case 'cancellation':
        message = `${subjectName} class on ${affectedDate} has been cancelled. ${change.reason ? 'Reason: ' + change.reason : ''}`;
        break;
      case 'reschedule':
        const oldTime = change.originalStartTime ? `${change.originalStartTime}-${change.originalEndTime}` : '';
        const newTime = change.newStartTime ? `${change.newStartTime}-${change.newEndTime}` : '';
        message = `${subjectName} class on ${affectedDate} has been rescheduled from ${oldTime} to ${newTime}. ${change.reason ? 'Reason: ' + change.reason : ''}`;
        break;
      case 'extra_class':
        const extraTime = change.newStartTime ? `${change.newStartTime}-${change.newEndTime}` : '';
        message = `Extra ${subjectName} class scheduled for ${affectedDate} at ${extraTime}. ${change.reason ? 'Reason: ' + change.reason : ''}`;
        break;
    }

    // Create notifications for all affected students
    const notifications = enrolledStudents.map((student: any) => ({
      studentId: student.id,
      scheduleChangeId: scheduleChangeId,
      message: message.trim(),
      status: 'pending' as const,
    }));

    if (notifications.length > 0) {
      await db.insert(studentNotifications).values(notifications);
    }
  }

  // Student Schedule & Notifications Implementation
  async getStudentSchedule(studentId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Get regular schedules for student's enrolled subjects
    const regularSchedules = await db
      .select({
        id: classSchedules.id,
        type: sql<string>`'regular'`.as('type'),
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        dayOfWeek: classSchedules.dayOfWeek,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        location: classSchedules.location,
        teacherName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('teacherName'),
      })
      .from(enrollments)
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .innerJoin(classSchedules, eq(subjects.id, classSchedules.subjectId))
      .innerJoin(users, eq(classSchedules.teacherId, users.id))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.isActive, true),
          eq(classSchedules.isActive, true)
        )
      );

    return { regularSchedules, scheduleChanges: [] };
  }

  async getStudentNotifications(studentId: string): Promise<StudentNotification[]> {
    return await db
      .select()
      .from(studentNotifications)
      .innerJoin(scheduleChanges, eq(studentNotifications.scheduleChangeId, scheduleChanges.id))
      .innerJoin(subjects, eq(scheduleChanges.subjectId, subjects.id))
      .where(eq(studentNotifications.studentId, studentId))
      .orderBy(desc(studentNotifications.createdAt));
  }

  async createStudentNotification(notification: InsertStudentNotification): Promise<StudentNotification> {
    const [newNotification] = await db.insert(studentNotifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await db
      .update(studentNotifications)
      .set({ 
        status: 'read', 
        readAt: new Date() 
      })
      .where(eq(studentNotifications.id, notificationId));
  }

  // Teacher and Staff Management Methods
  async createTeacher(teacherData: any): Promise<any> {
    const teacher = await db.insert(users).values({
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      email: teacherData.email,
      phone: teacherData.phone,
      role: 'teacher',
      isTeacher: true,
      isSuperAdmin: false,
      teacherSubjects: teacherData.teacherSubjects || [],
      teacherClassLevels: teacherData.teacherClassLevels || [],
      hireDate: teacherData.hireDate,
      isActive: true,
    }).returning();
    
    return teacher[0];
  }

  async getTeachers(): Promise<any[]> {
    const teachers = await db.select().from(users).where(eq(users.isTeacher, true));
    // Transform data to match frontend expectations
    return teachers.map(teacher => ({
      ...teacher,
      name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
    }));
  }

  async createStaff(staffData: any): Promise<any> {
    const staff = await db.insert(users).values({
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      email: staffData.email,
      phone: staffData.phone,
      role: staffData.role,
      position: staffData.position,
      isTeacher: false,
      isSuperAdmin: false,
      hireDate: staffData.hireDate,
      isActive: true,
    }).returning();
    
    return staff[0];
  }

  async getStaff(): Promise<any[]> {
    // Get all active users (both teachers and non-teachers) for the staff management page
    const allUsers = await db.select().from(users).where(eq(users.isActive, true));
    // Transform data to match frontend expectations
    return allUsers.map(user => ({
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }));
  }

  async updateTeacher(id: string, teacherData: any): Promise<any> {
    const [teacher] = await db.update(users)
      .set({
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        phone: teacherData.phone,
        teacherSubjects: teacherData.teacherSubjects || [],
        teacherClassLevels: teacherData.teacherClassLevels || [],
        hireDate: teacherData.hireDate,
      })
      .where(eq(users.id, id))
      .returning();
    
    return teacher;
  }

  async deleteTeacher(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateStaff(id: string, staffData: any): Promise<any> {
    const [staff] = await db.update(users)
      .set({
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: staffData.phone,
        role: staffData.role,
        position: staffData.position,
        hireDate: staffData.hireDate,
      })
      .where(eq(users.id, id))
      .returning();
    
    return staff;
  }

  async deleteStaff(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createPayoutRule(payoutData: any): Promise<any> {
    const rule = await db.insert(payoutRules).values({
      teacherId: payoutData.teacherId,
      isFixed: payoutData.isFixed,
      fixedPercentage: payoutData.fixedPercentage?.toString(),
      tier1Percentage: payoutData.tier1Percentage?.toString(),
      tier1Threshold: payoutData.tier1Threshold?.toString(),
      tier2Percentage: payoutData.tier2Percentage?.toString(),
      effectiveFrom: payoutData.effectiveFrom,
      isActive: true,
    }).returning();
    
    return rule[0];
  }
}

export const storage = new DatabaseStorage();

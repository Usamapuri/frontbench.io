import {
  users,
  students,
  subjects,
  classes,
  enrollments,
  invoices,
  payments,
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
    let query = db.select().from(attendance).where(eq(attendance.studentId, studentId));
    
    if (startDate) {
      query = query.where(gte(attendance.attendanceDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(attendance.attendanceDate, endDate));
    }
    
    return await query.orderBy(desc(attendance.attendanceDate));
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
      avgAttendance: Math.round((avgAttendance[0]?.avg || 0) * 100),
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
}

export const storage = new DatabaseStorage();

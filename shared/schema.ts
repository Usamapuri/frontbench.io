import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull(), // finance, teacher, parent, management
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const classLevelEnum = pgEnum('class_level', ['o-level', 'a-level']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const feeStatusEnum = pgEnum('fee_status', ['paid', 'pending', 'overdue', 'partial']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'card', 'cheque']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue']);

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rollNumber: varchar("roll_number").notNull().unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  classLevel: classLevelEnum("class_level").notNull(),
  parentId: varchar("parent_id").references(() => users.id),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  classLevel: classLevelEnum("class_level").notNull(),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subject combinations/combos
export const subjectCombos = pgTable("subject_combos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  classLevel: classLevelEnum("class_level").notNull(),
  discountedFee: decimal("discounted_fee", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for combo subjects
export const comboSubjects = pgTable("combo_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  comboId: varchar("combo_id").references(() => subjectCombos.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
});

// Student enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id),
  comboId: varchar("combo_id").references(() => subjectCombos.id),
  teacherId: varchar("teacher_id").references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default('0'),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default('draft'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: varchar("receipt_number").notNull().unique(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  receivedBy: varchar("received_by").references(() => users.id).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  notes: text("notes"),
  isRefunded: boolean("is_refunded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes/Periods
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, 0 = Sunday
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance records
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  markedBy: varchar("marked_by").references(() => users.id).notNull(),
  markedAt: timestamp("marked_at").defaultNow(),
  notes: text("notes"),
});

// Grades/Assessments
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  assessmentDate: date("assessment_date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => assessments.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  marksObtained: integer("marks_obtained").notNull(),
  grade: varchar("grade"), // A+, A, B+, etc.
  comments: text("comments"),
  enteredBy: varchar("entered_by").references(() => users.id).notNull(),
  enteredAt: timestamp("entered_at").defaultNow(),
});

// Teacher payout rules
export const payoutRules = pgTable("payout_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  isFixed: boolean("is_fixed").default(false),
  fixedPercentage: decimal("fixed_percentage", { precision: 5, scale: 2 }),
  tier1Percentage: decimal("tier1_percentage", { precision: 5, scale: 2 }),
  tier1Threshold: decimal("tier1_threshold", { precision: 10, scale: 2 }),
  tier2Percentage: decimal("tier2_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  effectiveFrom: date("effective_from").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cash draw requests
export const cashDrawRequests = pgTable("cash_draw_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status").default('pending'), // pending, approved, denied
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
});

// Daily close records
export const dailyClose = pgTable("daily_close", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  closeDate: date("close_date").notNull().unique(),
  totalCash: decimal("total_cash", { precision: 10, scale: 2 }).notNull(),
  totalBank: decimal("total_bank", { precision: 10, scale: 2 }).notNull(),
  variance: decimal("variance", { precision: 10, scale: 2 }).default('0'),
  isLocked: boolean("is_locked").default(false),
  closedBy: varchar("closed_by").references(() => users.id).notNull(),
  closedAt: timestamp("closed_at").defaultNow(),
  notes: text("notes"),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  enteredBy: varchar("entered_by").references(() => users.id).notNull(),
  receiptUrl: varchar("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  studentsAsParent: many(students),
  enrollmentsAsTeacher: many(enrollments),
  classesAsTeacher: many(classes),
  paymentsMade: many(payments),
  attendanceMarked: many(attendance),
  assessmentsCreated: many(assessments),
  gradesEntered: many(grades),
  payoutRules: many(payoutRules),
  cashDrawRequests: many(cashDrawRequests),
  dailyCloses: many(dailyClose),
  expensesEntered: many(expenses),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  invoices: many(invoices),
  payments: many(payments),
  attendance: many(attendance),
  grades: many(grades),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  enrollments: many(enrollments),
  classes: many(classes),
  assessments: many(assessments),
  comboSubjects: many(comboSubjects),
}));

export const subjectCombosRelations = relations(subjectCombos, ({ many }) => ({
  enrollments: many(enrollments),
  comboSubjects: many(comboSubjects),
}));

export const comboSubjectsRelations = relations(comboSubjects, ({ one }) => ({
  combo: one(subjectCombos, {
    fields: [comboSubjects.comboId],
    references: [subjectCombos.id],
  }),
  subject: one(subjects, {
    fields: [comboSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [enrollments.subjectId],
    references: [subjects.id],
  }),
  combo: one(subjectCombos, {
    fields: [enrollments.comboId],
    references: [subjectCombos.id],
  }),
  teacher: one(users, {
    fields: [enrollments.teacherId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  receivedByUser: one(users, {
    fields: [payments.receivedBy],
    references: [users.id],
  }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  markedByUser: one(users, {
    fields: [attendance.markedBy],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [assessments.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [assessments.teacherId],
    references: [users.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  assessment: one(assessments, {
    fields: [grades.assessmentId],
    references: [assessments.id],
  }),
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  enteredByUser: one(users, {
    fields: [grades.enteredBy],
    references: [users.id],
  }),
}));

export const payoutRulesRelations = relations(payoutRules, ({ one }) => ({
  teacher: one(users, {
    fields: [payoutRules.teacherId],
    references: [users.id],
  }),
}));

export const cashDrawRequestsRelations = relations(cashDrawRequests, ({ one }) => ({
  teacher: one(users, {
    fields: [cashDrawRequests.teacherId],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [cashDrawRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const dailyCloseRelations = relations(dailyClose, ({ one }) => ({
  closedByUser: one(users, {
    fields: [dailyClose.closedBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  enteredByUser: one(users, {
    fields: [expenses.enteredBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  enteredAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Class = typeof classes.$inferSelect;
export type PayoutRule = typeof payoutRules.$inferSelect;
export type CashDrawRequest = typeof cashDrawRequests.$inferSelect;
export type DailyClose = typeof dailyClose.$inferSelect;
export type Expense = typeof expenses.$inferSelect;

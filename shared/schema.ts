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
  unique,
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

// Tenants table - Multi-tenant architecture
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(), // URL-friendly identifier for subdomain
  subdomain: varchar("subdomain").notNull().unique(), // Subdomain (e.g., primax, siddeeq)
  domain: varchar("domain").unique(), // Custom domain (optional, overrides subdomain)
  primaryColor: varchar("primary_color").default('#3B82F6'), // Brand primary color
  secondaryColor: varchar("secondary_color").default('#1E40AF'), // Brand secondary color
  logoUrl: varchar("logo_url"), // Logo image URL
  faviconUrl: varchar("favicon_url"), // Favicon URL
  timezone: varchar("timezone").default('Asia/Karachi'), // School timezone
  currency: varchar("currency").default('PKR'), // Currency code
  address: text("address"), // School address
  phone: varchar("phone"), // Contact phone
  email: varchar("email"), // Contact email
  website: varchar("website"), // School website
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false), // Email verification status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced role system enums
export const userRoleEnum = pgEnum('user_role', ['teacher', 'finance', 'parent', 'management']);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  email: varchar("email"), // Remove unique constraint - will be unique per tenant
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"), // Phone number for staff/teachers
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // Hashed password for login
  temporaryPassword: varchar("temporary_password"), // Temporary password for first login
  mustChangePassword: boolean("must_change_password").default(true), // Force password change on first login
  role: userRoleEnum("role").notNull(), // Primary role: teacher, finance, parent, management
  isSuperAdmin: boolean("is_super_admin").default(false), // Super admin privileges
  isTeacher: boolean("is_teacher").default(false), // Whether they teach (for super admins who are also teachers)
  teacherSubjects: text("teacher_subjects").array(), // Array of subject IDs they teach (for teachers/super admin teachers)
  teacherClassLevels: text("teacher_class_levels").array(), // Array of class levels they teach
  payoutPercentage: integer("payout_percentage"), // Teacher payout percentage
  isActive: boolean("is_active").default(true), // Whether staff member is active
  hireDate: date("hire_date"), // When they were hired
  position: varchar("position"), // Job title/position for non-teaching staff
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint per tenant
  unique("users_email_tenant_unique").on(table.email, table.tenantId),
]);

// Enums
export const classLevelEnum = pgEnum('class_level', ['o-level', 'igcse', 'as-level', 'a2-level']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const feeStatusEnum = pgEnum('fee_status', ['paid', 'pending', 'overdue', 'partial']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'card', 'cheque']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'partial', 'cancelled']);
export const invoiceTypeEnum = pgEnum('invoice_type', ['monthly', 'prorated', 'custom', 'multi_month', 'adjustment']);
export const paymentStatusEnum = pgEnum('payment_status', ['completed', 'pending', 'failed', 'refunded']);
export const adjustmentTypeEnum = pgEnum('adjustment_type', ['discount', 'late_fee', 'manual_edit', 'refund', 'writeoff']);
export const announcementTypeEnum = pgEnum('announcement_type', ['homework', 'announcement', 'notice', 'reminder', 'event']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
export const scheduleChangeTypeEnum = pgEnum('schedule_change_type', ['cancellation', 'reschedule', 'extra_class']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'read']);

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  rollNumber: varchar("roll_number").notNull(), // Remove unique constraint - will be unique per tenant
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  classLevels: text("class_levels").array().notNull(),
  // Student contact information
  studentPhone: varchar("student_phone"),
  studentEmail: varchar("student_email"),
  homeAddress: text("home_address"),
  // Parent/Guardian information
  parentName: varchar("parent_name"),
  parentPhone: varchar("parent_phone"),
  parentEmail: varchar("parent_email"),
  // Additional Parent/Guardian information
  additionalParentName: varchar("additional_parent_name"),
  additionalParentPhone: varchar("additional_parent_phone"),
  additionalParentEmail: varchar("additional_parent_email"),
  // System fields
  parentId: varchar("parent_id").references(() => users.id),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint per tenant
  unique("students_roll_number_tenant_unique").on(table.rollNumber, table.tenantId),
]);

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  name: varchar("name").notNull(),
  code: varchar("code").notNull(), // Remove unique constraint - will be unique per tenant
  classLevels: text("class_levels").array().notNull(),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint per tenant
  unique("subjects_code_tenant_unique").on(table.code, table.tenantId),
]);

// Subject combinations/combos
export const subjectCombos = pgTable("subject_combos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  name: varchar("name").notNull(),
  classLevels: text("class_levels").array().notNull(),
  discountedFee: decimal("discounted_fee", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for combo subjects
export const comboSubjects = pgTable("combo_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  comboId: varchar("combo_id").references(() => subjectCombos.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
});

// Student enrollments with subject-specific discount tracking
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  studentId: varchar("student_id").references(() => students.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id),
  comboId: varchar("combo_id").references(() => subjectCombos.id),
  teacherId: varchar("teacher_id").references(() => users.id),
  discountType: varchar("discount_type").default('none'), // 'none', 'percentage', 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default('0'),
  discountReason: varchar("discount_reason"), // why discount was given
  discountApprovedBy: varchar("discount_approved_by").references(() => users.id), // who approved discount
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  invoiceNumber: varchar("invoice_number").notNull(), // Remove unique constraint - will be unique per tenant
  studentId: varchar("student_id").references(() => students.id).notNull(),
  type: invoiceTypeEnum("type").default('monthly'),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default('0'),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  adjustments: decimal("adjustments", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0'),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default('draft'),
  isRecurring: boolean("is_recurring").default(false),
  parentInvoiceId: varchar("parent_invoice_id"), // For adjustments/corrections
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint per tenant
  unique("invoices_invoice_number_tenant_unique").on(table.invoiceNumber, table.tenantId),
]);

// Add-ons/Services table
export const addOns = pgTable("add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(), // materials, transport, activities, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced invoice line items with subject-specific discounts
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id),
  addOnId: varchar("add_on_id").references(() => addOns.id),
  type: varchar("type").notNull(), // 'subject', 'addon', 'custom'
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountType: varchar("discount_type").default('none'), // 'none', 'percentage', 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default('0'), // percentage or fixed amount
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'), // calculated discount
  discountReason: varchar("discount_reason"), // teacher name, reason for discount
  total: decimal("total", { precision: 10, scale: 2 }).notNull(), // after discount
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  receiptNumber: varchar("receipt_number").notNull(), // Remove unique constraint - will be unique per tenant
  studentId: varchar("student_id").references(() => students.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionNumber: varchar("transaction_number"), // For bank transfers
  receivedBy: varchar("received_by").references(() => users.id).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  status: paymentStatusEnum("status").default('completed'),
  notes: text("notes"),
  isRefunded: boolean("is_refunded").default(false),
  refundedAt: timestamp("refunded_at"),
  refundedBy: varchar("refunded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint per tenant
  unique("payments_receipt_number_tenant_unique").on(table.receiptNumber, table.tenantId),
]);

// Payment allocations - many-to-many between payments and invoices
export const paymentAllocations = pgTable("payment_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  paymentId: varchar("payment_id").references(() => payments.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice adjustments for audit trail
export const invoiceAdjustments = pgTable("invoice_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  type: adjustmentTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  appliedBy: varchar("applied_by").references(() => users.id).notNull(),
  appliedAt: timestamp("applied_at").defaultNow(),
  notes: text("notes"),
});

// Billing schedules for recurring invoices
export const billingSchedules = pgTable("billing_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  studentId: varchar("student_id").references(() => students.id).notNull(),
  enrollmentId: varchar("enrollment_id").references(() => enrollments.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // null for indefinite
  frequency: varchar("frequency").default('monthly'), // monthly, weekly, custom
  dayOfMonth: integer("day_of_month").default(1), // 1-31 for monthly billing
  isActive: boolean("is_active").default(true),
  lastGeneratedDate: date("last_generated_date"),
  nextBillingDate: date("next_billing_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes/Periods
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
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
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  closeDate: date("close_date").notNull(), // Remove unique constraint - will be unique per tenant
  totalCash: decimal("total_cash", { precision: 10, scale: 2 }).notNull(),
  totalBank: decimal("total_bank", { precision: 10, scale: 2 }).notNull(),
  expectedCash: decimal("expected_cash", { precision: 10, scale: 2 }).notNull(),
  expectedBank: decimal("expected_bank", { precision: 10, scale: 2 }).notNull(),
  expectedTotal: decimal("expected_total", { precision: 10, scale: 2 }).notNull(),
  actualTotal: decimal("actual_total", { precision: 10, scale: 2 }).notNull(),
  variance: decimal("variance", { precision: 10, scale: 2 }).default('0'),
  pdfPath: varchar("pdf_path"), // Object storage path for generated PDF
  isLocked: boolean("is_locked").default(false),
  closedBy: varchar("closed_by").references(() => users.id).notNull(),
  closedAt: timestamp("closed_at").defaultNow(),
  notes: text("notes"),
}, (table) => [
  // Unique constraint per tenant
  unique("daily_close_close_date_tenant_unique").on(table.closeDate, table.tenantId),
]);

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  category: varchar("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  enteredBy: varchar("entered_by").references(() => users.id).notNull(),
  whoPaid: varchar("who_paid").references(() => users.id), // Track who actually paid for the expense
  receiptUrl: varchar("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Digital Diary - Announcements
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: announcementTypeEnum("type").notNull(),
  priority: priorityEnum("priority").default('medium'),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id), // Optional - for subject-specific announcements
  classId: varchar("class_id").references(() => classes.id), // Optional - for class-specific announcements
  dueDate: date("due_date"), // Optional - for homework/assignments
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Announcement Recipients - Many-to-many relationship
export const announcementRecipients = pgTable("announcement_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  announcementId: varchar("announcement_id").references(() => announcements.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Class Schedules - Regular recurring schedules
export const classSchedules = pgTable("class_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  startTime: varchar("start_time").notNull(), // Format: "HH:MM"
  endTime: varchar("end_time").notNull(), // Format: "HH:MM"
  location: varchar("location"), // Room number or location
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Changes - One-time modifications to regular schedules
export const scheduleChanges = pgTable("schedule_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  scheduleId: varchar("schedule_id").references(() => classSchedules.id),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  changeType: scheduleChangeTypeEnum("change_type").notNull(),
  affectedDate: date("affected_date").notNull(), // Specific date for the change
  originalStartTime: varchar("original_start_time"), // For rescheduling
  originalEndTime: varchar("original_end_time"), // For rescheduling
  newStartTime: varchar("new_start_time"), // For rescheduling or extra classes
  newEndTime: varchar("new_end_time"), // For rescheduling or extra classes
  newLocation: varchar("new_location"), // For location changes
  reason: text("reason"), // Why the change was made
  isNotificationSent: boolean("is_notification_sent").default(false),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Notifications - Track alerts for schedule changes
export const studentNotifications = pgTable("student_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(), // Multi-tenant isolation
  studentId: varchar("student_id").references(() => students.id).notNull(),
  scheduleChangeId: varchar("schedule_change_id").references(() => scheduleChanges.id).notNull(),
  message: text("message").notNull(), // Generated notification message
  status: notificationStatusEnum("status").default('pending'),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  students: many(students),
  subjects: many(subjects),
  subjectCombos: many(subjectCombos),
  enrollments: many(enrollments),
  invoices: many(invoices),
  payments: many(payments),
  classes: many(classes),
  attendance: many(attendance),
  assessments: many(assessments),
  grades: many(grades),
  announcements: many(announcements),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
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
  announcementsCreated: many(announcements),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [students.tenantId],
    references: [tenants.id],
  }),
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  invoices: many(invoices),
  payments: many(payments),
  billingSchedules: many(billingSchedules),
  attendance: many(attendance),
  grades: many(grades),
  announcementRecipients: many(announcementRecipients),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  enrollments: many(enrollments),
  classes: many(classes),
  assessments: many(assessments),
  comboSubjects: many(comboSubjects),
  announcements: many(announcements),
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

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
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
  billingSchedules: many(billingSchedules),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  items: many(invoiceItems),
  paymentAllocations: many(paymentAllocations),
  adjustments: many(invoiceAdjustments),
  parentInvoice: one(invoices, {
    fields: [invoices.parentInvoiceId],
    references: [invoices.id],
  }),
  childInvoices: many(invoices),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  allocations: many(paymentAllocations),
  receivedByUser: one(users, {
    fields: [payments.receivedBy],
    references: [users.id],
  }),
  refundedByUser: one(users, {
    fields: [payments.refundedBy],
    references: [users.id],
  }),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentAllocations.paymentId],
    references: [payments.id],
  }),
  invoice: one(invoices, {
    fields: [paymentAllocations.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoiceAdjustmentsRelations = relations(invoiceAdjustments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceAdjustments.invoiceId],
    references: [invoices.id],
  }),
  appliedByUser: one(users, {
    fields: [invoiceAdjustments.appliedBy],
    references: [users.id],
  }),
}));

export const billingSchedulesRelations = relations(billingSchedules, ({ one }) => ({
  student: one(students, {
    fields: [billingSchedules.studentId],
    references: [students.id],
  }),
  enrollment: one(enrollments, {
    fields: [billingSchedules.enrollmentId],
    references: [enrollments.id],
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
  announcements: many(announcements),
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

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [announcements.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [announcements.classId],
    references: [classes.id],
  }),
  recipients: many(announcementRecipients),
}));

export const announcementRecipientsRelations = relations(announcementRecipients, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementRecipients.announcementId],
    references: [announcements.id],
  }),
  student: one(students, {
    fields: [announcementRecipients.studentId],
    references: [students.id],
  }),
}));

export const classSchedulesRelations = relations(classSchedules, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classSchedules.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [classSchedules.subjectId],
    references: [subjects.id],
  }),
  scheduleChanges: many(scheduleChanges),
}));

export const scheduleChangesRelations = relations(scheduleChanges, ({ one, many }) => ({
  schedule: one(classSchedules, {
    fields: [scheduleChanges.scheduleId],
    references: [classSchedules.id],
  }),
  teacher: one(users, {
    fields: [scheduleChanges.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [scheduleChanges.subjectId],
    references: [subjects.id],
  }),
  createdByUser: one(users, {
    fields: [scheduleChanges.createdBy],
    references: [users.id],
  }),
  notifications: many(studentNotifications),
}));

export const studentNotificationsRelations = relations(studentNotifications, ({ one }) => ({
  student: one(students, {
    fields: [studentNotifications.studentId],
    references: [students.id],
  }),
  scheduleChange: one(scheduleChanges, {
    fields: [studentNotifications.scheduleChangeId],
    references: [scheduleChanges.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  classLevels: z.array(z.string()).min(1, "At least one class level is required"),
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
  receiptNumber: true, // Auto-generated
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

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementRecipientSchema = createInsertSchema(announcementRecipients).omit({
  id: true,
  createdAt: true,
});

export const insertClassScheduleSchema = createInsertSchema(classSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleChangeSchema = createInsertSchema(scheduleChanges).omit({
  id: true,
  createdAt: true,
});

export const insertStudentNotificationSchema = createInsertSchema(studentNotifications).omit({
  id: true,
  createdAt: true,
});

// Teacher and Staff schemas
export const insertTeacherSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  teacherSubjects: z.array(z.string()).optional(),
  teacherClassLevels: z.array(z.string()).optional(),
  payoutPercentage: z.number().min(0).max(100).optional(),
});

export const insertStaffSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  position: z.string().min(1, "Position is required"),
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
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
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementRecipient = typeof announcementRecipients.$inferSelect;
export type InsertAnnouncementRecipient = z.infer<typeof insertAnnouncementRecipientSchema>;
export type ClassSchedule = typeof classSchedules.$inferSelect;
export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;
export type ScheduleChange = typeof scheduleChanges.$inferSelect;
export type InsertScheduleChange = z.infer<typeof insertScheduleChangeSchema>;
export type StudentNotification = typeof studentNotifications.$inferSelect;
export type InsertStudentNotification = z.infer<typeof insertStudentNotificationSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

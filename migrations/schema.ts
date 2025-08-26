import { pgTable, foreignKey, varchar, integer, boolean, timestamp, numeric, text, date, unique, index, jsonb, check, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const attendanceStatus = pgEnum("attendance_status", ['present', 'absent', 'late'])
export const classLevel = pgEnum("class_level", ['o-level', 'a-level'])
export const feeStatus = pgEnum("fee_status", ['paid', 'pending', 'overdue', 'partial'])
export const gender = pgEnum("gender", ['male', 'female'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'sent', 'paid', 'overdue'])
export const paymentMethod = pgEnum("payment_method", ['cash', 'bank_transfer', 'card', 'cheque'])


export const classes = pgTable("classes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	subjectId: varchar("subject_id").notNull(),
	teacherId: varchar("teacher_id").notNull(),
	startTime: varchar("start_time").notNull(),
	endTime: varchar("end_time").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "classes_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "classes_teacher_id_users_id_fk"
		}),
]);

export const cashDrawRequests = pgTable("cash_draw_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	teacherId: varchar("teacher_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	reason: text().notNull(),
	status: varchar().default('pending'),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow(),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "cash_draw_requests_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "cash_draw_requests_reviewed_by_users_id_fk"
		}),
]);

export const assessments = pgTable("assessments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	subjectId: varchar("subject_id").notNull(),
	teacherId: varchar("teacher_id").notNull(),
	totalMarks: integer("total_marks").notNull(),
	assessmentDate: date("assessment_date").notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "assessments_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "assessments_teacher_id_users_id_fk"
		}),
]);

export const grades = pgTable("grades", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	assessmentId: varchar("assessment_id").notNull(),
	studentId: varchar("student_id").notNull(),
	marksObtained: integer("marks_obtained").notNull(),
	grade: varchar(),
	comments: text(),
	enteredBy: varchar("entered_by").notNull(),
	enteredAt: timestamp("entered_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "grades_assessment_id_assessments_id_fk"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "grades_student_id_students_id_fk"
		}),
	foreignKey({
			columns: [table.enteredBy],
			foreignColumns: [users.id],
			name: "grades_entered_by_users_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	receiptNumber: varchar("receipt_number").notNull(),
	studentId: varchar("student_id").notNull(),
	invoiceId: varchar("invoice_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	receivedBy: varchar("received_by"),
	paymentDate: timestamp("payment_date", { mode: 'string' }).defaultNow(),
	notes: text(),
	isRefunded: boolean("is_refunded").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	transactionNumber: varchar("transaction_number"),
	status: varchar().default('completed'),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	refundedBy: varchar("refunded_by"),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "payments_student_id_students_id_fk"
		}),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payments_invoice_id_invoices_id_fk"
		}),
	foreignKey({
			columns: [table.receivedBy],
			foreignColumns: [users.id],
			name: "payments_received_by_users_id_fk"
		}),
	unique("payments_receipt_number_unique").on(table.receiptNumber),
]);

export const invoices = pgTable("invoices", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number").notNull(),
	studentId: varchar("student_id").notNull(),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	discount: numeric({ precision: 10, scale:  2 }).default('0'),
	lateFee: numeric("late_fee", { precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	status: invoiceStatus().default('draft'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	type: varchar().default('monthly'),
	billingPeriodStart: date("billing_period_start"),
	billingPeriodEnd: date("billing_period_end"),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).default('0'),
	balanceDue: numeric("balance_due", { precision: 10, scale:  2 }),
	adjustments: numeric({ precision: 10, scale:  2 }).default('0'),
	isRecurring: boolean("is_recurring").default(false),
	createdBy: varchar("created_by").default('system'),
	parentInvoiceId: varchar("parent_invoice_id"),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "invoices_student_id_students_id_fk"
		}),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const payoutRules = pgTable("payout_rules", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	teacherId: varchar("teacher_id").notNull(),
	isFixed: boolean("is_fixed").default(false),
	fixedPercentage: numeric("fixed_percentage", { precision: 5, scale:  2 }),
	tier1Percentage: numeric("tier1_percentage", { precision: 5, scale:  2 }),
	tier1Threshold: numeric("tier1_threshold", { precision: 10, scale:  2 }),
	tier2Percentage: numeric("tier2_percentage", { precision: 5, scale:  2 }),
	isActive: boolean("is_active").default(true),
	effectiveFrom: date("effective_from").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "payout_rules_teacher_id_users_id_fk"
		}),
]);

export const expenses = pgTable("expenses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	category: varchar().notNull(),
	description: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	expenseDate: date("expense_date").notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	enteredBy: varchar("entered_by").notNull(),
	receiptUrl: varchar("receipt_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	whoPaid: varchar("who_paid"),
}, (table) => [
	foreignKey({
			columns: [table.enteredBy],
			foreignColumns: [users.id],
			name: "expenses_entered_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.whoPaid],
			foreignColumns: [users.id],
			name: "expenses_who_paid_fkey"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const comboSubjects = pgTable("combo_subjects", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	comboId: varchar("combo_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.comboId],
			foreignColumns: [subjectCombos.id],
			name: "combo_subjects_combo_id_subject_combos_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "combo_subjects_subject_id_subjects_id_fk"
		}),
]);

export const dailyClose = pgTable("daily_close", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	closeDate: date("close_date").notNull(),
	totalCash: numeric("total_cash", { precision: 10, scale:  2 }).notNull(),
	totalBank: numeric("total_bank", { precision: 10, scale:  2 }).notNull(),
	variance: numeric({ precision: 10, scale:  2 }).default('0'),
	isLocked: boolean("is_locked").default(false),
	closedBy: varchar("closed_by").notNull(),
	closedAt: timestamp("closed_at", { mode: 'string' }).defaultNow(),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.closedBy],
			foreignColumns: [users.id],
			name: "daily_close_closed_by_users_id_fk"
		}),
	unique("daily_close_close_date_unique").on(table.closeDate),
]);

export const subjects = pgTable("subjects", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	code: varchar().notNull(),
	classLevel: classLevel("class_level").notNull(),
	baseFee: numeric("base_fee", { precision: 10, scale:  2 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("subjects_code_unique").on(table.code),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	role: varchar().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const attendance = pgTable("attendance", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	classId: varchar("class_id").notNull(),
	studentId: varchar("student_id").notNull(),
	attendanceDate: date("attendance_date").notNull(),
	status: attendanceStatus().notNull(),
	markedBy: varchar("marked_by").notNull(),
	markedAt: timestamp("marked_at", { mode: 'string' }).defaultNow(),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "attendance_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "attendance_student_id_students_id_fk"
		}),
	foreignKey({
			columns: [table.markedBy],
			foreignColumns: [users.id],
			name: "attendance_marked_by_users_id_fk"
		}),
]);

export const students = pgTable("students", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	rollNumber: varchar("roll_number").notNull(),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
	gender: gender().notNull(),
	classLevel: classLevel("class_level").notNull(),
	parentId: varchar("parent_id"),
	profileImageUrl: varchar("profile_image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [users.id],
			name: "students_parent_id_users_id_fk"
		}),
	unique("students_roll_number_unique").on(table.rollNumber),
]);

export const subjectCombos = pgTable("subject_combos", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	classLevel: classLevel("class_level").notNull(),
	discountedFee: numeric("discounted_fee", { precision: 10, scale:  2 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const billingSchedules = pgTable("billing_schedules", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	billingDay: integer("billing_day").default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "billing_schedules_student_id_fkey"
		}),
]);

export const paymentAllocations = pgTable("payment_allocations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	paymentId: varchar("payment_id").notNull(),
	invoiceId: varchar("invoice_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	allocatedAt: timestamp("allocated_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payment_allocations_payment_id_fkey"
		}),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payment_allocations_invoice_id_fkey"
		}),
]);

export const invoiceAdjustments = pgTable("invoice_adjustments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	invoiceId: varchar("invoice_id").notNull(),
	type: varchar().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	reason: text().notNull(),
	appliedBy: varchar("applied_by").notNull(),
	notes: text(),
	appliedAt: timestamp("applied_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_adjustments_invoice_id_fkey"
		}),
]);

export const invoiceItems = pgTable("invoiceItems", {
	id: varchar().primaryKey().notNull(),
	invoiceId: varchar().notNull(),
	type: varchar().notNull(),
	itemId: varchar().notNull(),
	name: varchar().notNull(),
	description: text().default('),
	quantity: integer().default(1),
	unitPrice: varchar().notNull(),
	totalPrice: varchar().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	check("invoiceItems_type_check", sql`(type)::text = ANY ((ARRAY['subject'::character varying, 'addon'::character varying])::text[])`),
]);

export const announcements = pgTable("announcements", {
	id: varchar().primaryKey().notNull(),
	title: varchar().notNull(),
	content: text().notNull(),
	type: varchar().notNull(),
	priority: varchar().notNull(),
	subjectId: varchar("subject_id"),
	classId: varchar("class_id"),
	dueDate: timestamp("due_date", { mode: 'string' }),
	createdBy: varchar("created_by").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const addOns = pgTable("add_ons", {
	id: varchar().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text().default('),
	price: varchar().notNull(),
	category: varchar().default('other'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const announcementRecipients = pgTable("announcement_recipients", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	announcementId: varchar("announcement_id").notNull(),
	studentId: varchar("student_id").notNull(),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const enrollments = pgTable("enrollments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	subjectId: varchar("subject_id"),
	comboId: varchar("combo_id"),
	teacherId: varchar("teacher_id"),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	discountType: varchar("discount_type").default('none'),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).default('0'),
	discountReason: varchar("discount_reason"),
	discountApprovedBy: varchar("discount_approved_by"),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "enrollments_student_id_students_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "enrollments_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.comboId],
			foreignColumns: [subjectCombos.id],
			name: "enrollments_combo_id_subject_combos_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "enrollments_teacher_id_users_id_fk"
		}),
]);

export const invoiceItems = pgTable("invoice_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	invoiceId: varchar("invoice_id").notNull(),
	description: text().notNull(),
	quantity: integer().default(1),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	subjectId: varchar("subject_id"),
	addOnId: varchar("add_on_id"),
	type: varchar().default('custom').notNull(),
	discountType: varchar("discount_type").default('none'),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0'),
	discountReason: varchar("discount_reason"),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_items_invoice_id_invoices_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "invoice_items_subject_id_fkey"
		}),
	foreignKey({
			columns: [table.addOnId],
			foreignColumns: [addOns.id],
			name: "invoice_items_add_on_id_fkey"
		}),
]);

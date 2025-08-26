import { relations } from "drizzle-orm/relations";
import { subjects, classes, users, cashDrawRequests, assessments, grades, students, payments, invoices, payoutRules, expenses, subjectCombos, comboSubjects, dailyClose, attendance, billingSchedules, paymentAllocations, invoiceAdjustments, enrollments, invoiceItems, addOns } from "./schema";

export const classesRelations = relations(classes, ({one, many}) => ({
	subject: one(subjects, {
		fields: [classes.subjectId],
		references: [subjects.id]
	}),
	user: one(users, {
		fields: [classes.teacherId],
		references: [users.id]
	}),
	attendances: many(attendance),
}));

export const subjectsRelations = relations(subjects, ({many}) => ({
	classes: many(classes),
	assessments: many(assessments),
	comboSubjects: many(comboSubjects),
	enrollments: many(enrollments),
	invoiceItems: many(invoiceItems),
}));

export const usersRelations = relations(users, ({many}) => ({
	classes: many(classes),
	cashDrawRequests_teacherId: many(cashDrawRequests, {
		relationName: "cashDrawRequests_teacherId_users_id"
	}),
	cashDrawRequests_reviewedBy: many(cashDrawRequests, {
		relationName: "cashDrawRequests_reviewedBy_users_id"
	}),
	assessments: many(assessments),
	grades: many(grades),
	payments: many(payments),
	payoutRules: many(payoutRules),
	expenses_enteredBy: many(expenses, {
		relationName: "expenses_enteredBy_users_id"
	}),
	expenses_whoPaid: many(expenses, {
		relationName: "expenses_whoPaid_users_id"
	}),
	dailyCloses: many(dailyClose),
	attendances: many(attendance),
	students: many(students),
	enrollments: many(enrollments),
}));

export const cashDrawRequestsRelations = relations(cashDrawRequests, ({one}) => ({
	user_teacherId: one(users, {
		fields: [cashDrawRequests.teacherId],
		references: [users.id],
		relationName: "cashDrawRequests_teacherId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [cashDrawRequests.reviewedBy],
		references: [users.id],
		relationName: "cashDrawRequests_reviewedBy_users_id"
	}),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	subject: one(subjects, {
		fields: [assessments.subjectId],
		references: [subjects.id]
	}),
	user: one(users, {
		fields: [assessments.teacherId],
		references: [users.id]
	}),
	grades: many(grades),
}));

export const gradesRelations = relations(grades, ({one}) => ({
	assessment: one(assessments, {
		fields: [grades.assessmentId],
		references: [assessments.id]
	}),
	student: one(students, {
		fields: [grades.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [grades.enteredBy],
		references: [users.id]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	grades: many(grades),
	payments: many(payments),
	invoices: many(invoices),
	attendances: many(attendance),
	user: one(users, {
		fields: [students.parentId],
		references: [users.id]
	}),
	billingSchedules: many(billingSchedules),
	enrollments: many(enrollments),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	student: one(students, {
		fields: [payments.studentId],
		references: [students.id]
	}),
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id]
	}),
	user: one(users, {
		fields: [payments.receivedBy],
		references: [users.id]
	}),
	paymentAllocations: many(paymentAllocations),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	payments: many(payments),
	student: one(students, {
		fields: [invoices.studentId],
		references: [students.id]
	}),
	paymentAllocations: many(paymentAllocations),
	invoiceAdjustments: many(invoiceAdjustments),
	invoiceItems: many(invoiceItems),
}));

export const payoutRulesRelations = relations(payoutRules, ({one}) => ({
	user: one(users, {
		fields: [payoutRules.teacherId],
		references: [users.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	user_enteredBy: one(users, {
		fields: [expenses.enteredBy],
		references: [users.id],
		relationName: "expenses_enteredBy_users_id"
	}),
	user_whoPaid: one(users, {
		fields: [expenses.whoPaid],
		references: [users.id],
		relationName: "expenses_whoPaid_users_id"
	}),
}));

export const comboSubjectsRelations = relations(comboSubjects, ({one}) => ({
	subjectCombo: one(subjectCombos, {
		fields: [comboSubjects.comboId],
		references: [subjectCombos.id]
	}),
	subject: one(subjects, {
		fields: [comboSubjects.subjectId],
		references: [subjects.id]
	}),
}));

export const subjectCombosRelations = relations(subjectCombos, ({many}) => ({
	comboSubjects: many(comboSubjects),
	enrollments: many(enrollments),
}));

export const dailyCloseRelations = relations(dailyClose, ({one}) => ({
	user: one(users, {
		fields: [dailyClose.closedBy],
		references: [users.id]
	}),
}));

export const attendanceRelations = relations(attendance, ({one}) => ({
	class: one(classes, {
		fields: [attendance.classId],
		references: [classes.id]
	}),
	student: one(students, {
		fields: [attendance.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [attendance.markedBy],
		references: [users.id]
	}),
}));

export const billingSchedulesRelations = relations(billingSchedules, ({one}) => ({
	student: one(students, {
		fields: [billingSchedules.studentId],
		references: [students.id]
	}),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({one}) => ({
	payment: one(payments, {
		fields: [paymentAllocations.paymentId],
		references: [payments.id]
	}),
	invoice: one(invoices, {
		fields: [paymentAllocations.invoiceId],
		references: [invoices.id]
	}),
}));

export const invoiceAdjustmentsRelations = relations(invoiceAdjustments, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceAdjustments.invoiceId],
		references: [invoices.id]
	}),
}));

export const enrollmentsRelations = relations(enrollments, ({one}) => ({
	student: one(students, {
		fields: [enrollments.studentId],
		references: [students.id]
	}),
	subject: one(subjects, {
		fields: [enrollments.subjectId],
		references: [subjects.id]
	}),
	subjectCombo: one(subjectCombos, {
		fields: [enrollments.comboId],
		references: [subjectCombos.id]
	}),
	user: one(users, {
		fields: [enrollments.teacherId],
		references: [users.id]
	}),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
	subject: one(subjects, {
		fields: [invoiceItems.subjectId],
		references: [subjects.id]
	}),
	addOn: one(addOns, {
		fields: [invoiceItems.addOnId],
		references: [addOns.id]
	}),
}));

export const addOnsRelations = relations(addOns, ({many}) => ({
	invoiceItems: many(invoiceItems),
}));
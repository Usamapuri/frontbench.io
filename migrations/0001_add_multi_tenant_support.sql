-- Migration: Add Multi-Tenant Support to Frontbench.io
-- This migration adds the tenants table and tenant_id columns to all existing tables
-- for complete data isolation between schools/tenants

-- Step 1: Create the tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL UNIQUE,
    "domain" varchar UNIQUE,
    "primary_color" varchar DEFAULT '#3B82F6',
    "secondary_color" varchar DEFAULT '#1E40AF',
    "logo_url" varchar,
    "favicon_url" varchar,
    "timezone" varchar DEFAULT 'Asia/Karachi',
    "currency" varchar DEFAULT 'PKR',
    "address" text,
    "phone" varchar,
    "email" varchar,
    "website" varchar,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Step 2: Create a default tenant for existing data
INSERT INTO "tenants" (
    "id", 
    "name", 
    "slug", 
    "primary_color", 
    "secondary_color",
    "timezone",
    "currency",
    "is_active"
) VALUES (
    'default-tenant-primax', 
    'Primax Academy', 
    'primax-academy',
    '#3B82F6',
    '#1E40AF',
    'Asia/Karachi',
    'PKR',
    true
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Add tenant_id columns to all existing tables
-- Users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on email and add per-tenant unique constraint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";
ALTER TABLE "users" ADD CONSTRAINT "users_email_tenant_unique" UNIQUE ("email", "tenant_id");

-- Students table
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on roll_number and add per-tenant unique constraint
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_roll_number_unique";
ALTER TABLE "students" ADD CONSTRAINT "students_roll_number_tenant_unique" UNIQUE ("roll_number", "tenant_id");

-- Subjects table
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on code and add per-tenant unique constraint
ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "subjects_code_unique";
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_code_tenant_unique" UNIQUE ("code", "tenant_id");

-- Subject combos table
ALTER TABLE "subject_combos" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "subject_combos" ADD CONSTRAINT "subject_combos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Combo subjects table
ALTER TABLE "combo_subjects" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "combo_subjects" ADD CONSTRAINT "combo_subjects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Enrollments table
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Invoices table
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on invoice_number and add per-tenant unique constraint
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_invoice_number_unique";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_number_tenant_unique" UNIQUE ("invoice_number", "tenant_id");

-- Add-ons table
ALTER TABLE "add_ons" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "add_ons" ADD CONSTRAINT "add_ons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Invoice items table
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on receipt_number and add per-tenant unique constraint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_receipt_number_unique";
ALTER TABLE "payments" ADD CONSTRAINT "payments_receipt_number_tenant_unique" UNIQUE ("receipt_number", "tenant_id");

-- Payment allocations table
ALTER TABLE "payment_allocations" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Invoice adjustments table
ALTER TABLE "invoice_adjustments" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "invoice_adjustments" ADD CONSTRAINT "invoice_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Billing schedules table
ALTER TABLE "billing_schedules" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "billing_schedules" ADD CONSTRAINT "billing_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Classes table
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "classes" ADD CONSTRAINT "classes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Attendance table
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Assessments table
ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Grades table
ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "grades" ADD CONSTRAINT "grades_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Payout rules table
ALTER TABLE "payout_rules" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "payout_rules" ADD CONSTRAINT "payout_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Cash draw requests table
ALTER TABLE "cash_draw_requests" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "cash_draw_requests" ADD CONSTRAINT "cash_draw_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Daily close table
ALTER TABLE "daily_close" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "daily_close" ADD CONSTRAINT "daily_close_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
-- Drop the old unique constraint on close_date and add per-tenant unique constraint
ALTER TABLE "daily_close" DROP CONSTRAINT IF EXISTS "daily_close_close_date_unique";
ALTER TABLE "daily_close" ADD CONSTRAINT "daily_close_close_date_tenant_unique" UNIQUE ("close_date", "tenant_id");

-- Expenses table
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Announcements table
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Announcement recipients table
ALTER TABLE "announcement_recipients" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Class schedules table
ALTER TABLE "class_schedules" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Schedule changes table
ALTER TABLE "schedule_changes" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "schedule_changes" ADD CONSTRAINT "schedule_changes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Student notifications table
ALTER TABLE "student_notifications" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
ALTER TABLE "student_notifications" ADD CONSTRAINT "student_notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Step 4: Update all existing records to use the default tenant
-- Update users
UPDATE "users" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update students
UPDATE "students" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update subjects
UPDATE "subjects" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update subject_combos
UPDATE "subject_combos" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update combo_subjects
UPDATE "combo_subjects" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update enrollments
UPDATE "enrollments" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update invoices
UPDATE "invoices" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update add_ons
UPDATE "add_ons" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update invoice_items
UPDATE "invoice_items" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update payments
UPDATE "payments" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update payment_allocations
UPDATE "payment_allocations" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update invoice_adjustments
UPDATE "invoice_adjustments" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update billing_schedules
UPDATE "billing_schedules" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update classes
UPDATE "classes" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update attendance
UPDATE "attendance" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update assessments
UPDATE "assessments" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update grades
UPDATE "grades" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update payout_rules
UPDATE "payout_rules" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update cash_draw_requests
UPDATE "cash_draw_requests" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update daily_close
UPDATE "daily_close" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update expenses
UPDATE "expenses" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update announcements
UPDATE "announcements" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update announcement_recipients
UPDATE "announcement_recipients" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update class_schedules
UPDATE "class_schedules" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update schedule_changes
UPDATE "schedule_changes" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Update student_notifications
UPDATE "student_notifications" SET "tenant_id" = 'default-tenant-primax' WHERE "tenant_id" IS NULL;

-- Step 5: Make tenant_id columns NOT NULL after data migration
ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "subjects" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "subject_combos" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "combo_subjects" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "add_ons" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "invoice_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payment_allocations" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "invoice_adjustments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "billing_schedules" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "classes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "attendance" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "grades" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payout_rules" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "cash_draw_requests" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "daily_close" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "announcements" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "announcement_recipients" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "class_schedules" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "schedule_changes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "student_notifications" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Create indexes for better performance on tenant_id columns
CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_students_tenant_id" ON "students" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_subjects_tenant_id" ON "subjects" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_enrollments_tenant_id" ON "enrollments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_tenant_id" ON "invoices" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_payments_tenant_id" ON "payments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_classes_tenant_id" ON "classes" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_tenant_id" ON "attendance" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_tenant_id" ON "assessments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_grades_tenant_id" ON "grades" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_announcements_tenant_id" ON "announcements" ("tenant_id");

-- Step 6: Create a test tenant for Siddeeq Public School
INSERT INTO "tenants" (
    "id", 
    "name", 
    "slug", 
    "primary_color", 
    "secondary_color",
    "timezone",
    "currency",
    "address",
    "phone",
    "email",
    "is_active"
) VALUES (
    'siddeeq-public-school', 
    'Siddeeq Public School', 
    'siddeeq-public-school',
    '#10B981',
    '#059669',
    'Asia/Karachi',
    'PKR',
    'Karachi, Pakistan',
    '+92-21-XXXXXXX',
    'info@siddeeqpublic.edu.pk',
    true
) ON CONFLICT (id) DO NOTHING;

-- Migration completed successfully
-- All existing data has been assigned to the default tenant 'Primax Academy'
-- A new tenant 'Siddeeq Public School' has been created for testing multi-tenant functionality

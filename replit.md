# Overview

Primax School Management System is a comprehensive web application designed to digitize school processes, replacing paper-based systems and Google Sheets. It provides tailored interfaces with advanced role-based access control supporting three user types: TEACHER (limited access), SUPER ADMIN TEACHER (full access including teaching), and SUPER ADMIN MANAGEMENT (full access excluding teaching). The system integrates enrollment, attendance, grade management, billing, payments, and financial reporting into a single platform. Its core vision is to streamline administrative tasks, enhance communication, and provide a unified digital environment for all stakeholders, with a strong focus on a flexible and auditable financial management system.

**RECENT UPDATE (Aug 26, 2025)**: Completed full data consistency alignment between New Student Enrollment form and Edit Student Information modal, ensuring both forms work with identical field structures for seamless data integrity.

**CRITICAL FEATURE**: Teacher Data Isolation - Regular teachers have their own isolated dashboard showing only data for subjects they teach, including earnings, gradebook, attendance, and Digital Diary messages restricted to their specific students. Super admins have full access across all areas while maintaining the same data integrity principles.

**NEW FEATURE**: Advanced Role-Based Access Control
- **TEACHER**: Access only to Teacher Dashboard with data isolation for assigned subjects
- **SUPER ADMIN (Teacher)**: Full access to Teacher, Finance, Management, and Parent dashboards with complete system oversight
- **SUPER ADMIN (Management)**: Access to Finance, Management, and Parent dashboards, excluding Teacher dashboard (for non-teaching administrators)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite. It employs a component-based architecture with:
- **UI Framework**: Custom library based on Radix UI primitives with shadcn/ui styling.
- **Styling**: Tailwind CSS with custom design tokens.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Offline Support**: Built-in offline detection with service worker capabilities.
It features role-based page structures and shared UI components. The Parent Portal has been recently redesigned with a focus on a clean two-column layout, purple gradient header, stat cards, visual academic performance, attendance overviews, fee status, upcoming events, and contact information.

## Backend Architecture
The backend uses Express.js with TypeScript and follows a RESTful API design:
- **Runtime**: Node.js with ESM modules.
- **Framework**: Express.js with middleware for authentication, logging, and error handling.
- **Database Layer**: Drizzle ORM for type-safe database operations.
- **Storage Interface**: Abstracted CRUD operations for all entities.
- **Authentication**: Replit-based OpenID Connect with session management.
It implements role-based access control and provides comprehensive API endpoints for student, attendance, grade, and financial management.

## Data Storage Solutions
PostgreSQL is the primary database, utilized with Neon Database as the serverless provider:
- **ORM**: Drizzle ORM for type-safe operations and migrations.
- **Schema Design**: Relational schema for students, subjects, classes, enrollments, attendance, grades, invoices, payments, and administrative functions.
- **Session Storage**: PostgreSQL-backed session storage.
- **Migration System**: Drizzle Kit for schema migrations.
The schema supports complex relationships crucial for features like multi-subject enrollment, per-class attendance, and detailed financial tracking.

## Authentication and Authorization
Authentication uses Replit's OpenID Connect:
- **Provider**: Replit OIDC with automatic user provisioning.
- **Session Management**: Express-session with PostgreSQL store.
- **Role-Based Access**: Four distinct user roles with different permission levels, enforced on both frontend and backend.
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling.

## Comprehensive Billing System
This system handles tuition management from invoice generation to payment processing.
- **Monthly Billing Cycle**: Automated invoice generation on the 1st of each month based on enrolled subjects.
- **Advance Payment Processing**: Supports multi-month payments with automatic credit allocation and credit balance management.
- **Partial Payment Support**: Accepts partial payments, tracks balances, and updates invoice statuses.
- **Mid-Month Enrollment Billing**: Automatically calculates pro-rated fees for mid-month enrollments with options for full-month billing.
- **Manual Adjustments & Exceptions**: Supports discounts, late fees, write-offs, and refunds with full audit trails, reasons, and user attribution.
- **Student Credit Management**: Tracks overpayments as credits for future invoice application.
- **Comprehensive Student Ledger**: Provides a complete transaction history, financial summaries, and payment allocations.
- **Supported Payment Methods**: Cash and Bank Transfer (requiring transaction numbers).
- **Payment Allocation Logic**: Prioritizes existing outstanding invoices (oldest first), aiming for full payment before partial allocation, with remaining amounts becoming student credit.
- **One-Click Portal Link Generation**: A feature for Finance staff to generate and manage parent portal access links, including email template generation.

# External Dependencies

## Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Authentication**: OpenID Connect provider.
- **Replit Development Tools**: Vite plugin integration.

## Key Libraries and Frameworks
- **Frontend**: React, TypeScript, Vite, TanStack React Query, Wouter, React Hook Form, Zod.
- **UI Components**: Radix UI primitives, Tailwind CSS, Lucide React, Font Awesome.
- **Backend**: Express.js, Drizzle ORM, Passport.js.
- **Database**: PostgreSQL with Neon serverless driver.
- **Development**: ESBuild, TSX.
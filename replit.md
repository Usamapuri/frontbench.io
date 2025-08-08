# Overview

This is Primax School Management System, a comprehensive web application designed to replace paper processes and Google Sheets with a unified digital workspace. The system supports four distinct user roles - Finance/Front Desk, Teachers, Parents, and Management - each with tailored interfaces for their specific responsibilities. The application handles enrollment, attendance tracking, grade management, billing, payments, and financial reporting in one integrated platform.

## Recent Changes
- **August 8, 2025**: Enhanced Invoices page with dynamic search and filtering capabilities:
  - Comprehensive search across invoice numbers, student names, and notes
  - Multi-criteria filtering: Status, Student, Date Range, and Amount Range
  - Real-time filter count display and clear filters functionality
  - Enhanced empty states with contextual messaging and clear filter actions
  - Loading states with skeleton placeholders for better user experience
- **August 8, 2025**: Implemented comprehensive tuition billing system with advanced features:
  - Monthly invoice generation on 1st of each month for all active students
  - Advance payment processing with automatic credit allocation to future invoices
  - Partial payment tracking with accurate balance management
  - Mid-month enrollment support with pro-rated billing options (full or partial month)
  - Manual invoice adjustments with complete audit trails (discounts, late fees, write-offs, refunds)
  - Student credit balance tracking and automatic future invoice application
  - Comprehensive student ledger with transaction history and summaries
- **August 8, 2025**: Enhanced database schema with flexible billing architecture:
  - Invoice types (monthly, pro-rated, adjustment, custom)
  - Payment allocation system for flexible payment-to-invoice linking
  - Invoice adjustments table for complete audit trails
  - Billing schedules and comprehensive enrollment tracking
- **August 8, 2025**: Added complete billing API endpoints for all financial operations
- **August 8, 2025**: Implemented accurate financial calculations in Student Ledger using real invoice and payment data
- **August 8, 2025**: Fixed Student Ledger filters (class, fee status, attendance) to work properly with real data
- **August 8, 2025**: Updated payment methods to only accept Cash and Bank Transfer (removed Card/Cheque)
- **August 8, 2025**: Added transaction number requirement for Bank Transfer payments
- **August 8, 2025**: Converted all currency from Indian Rupees (₹) to Pakistani Rupees (Rs.) across the entire system

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing Vite as the build tool and development server. The application follows a modern component-based architecture with:

- **UI Framework**: Custom component library based on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Offline Support**: Built-in offline detection with service worker capabilities

The frontend is organized into role-based page structures, with shared UI components and utilities. Each role (finance, teacher, parent, management) has dedicated page routes and components.

## Backend Architecture
The backend uses Express.js with TypeScript, following a RESTful API design pattern:

- **Runtime**: Node.js with ESM modules
- **Framework**: Express.js with middleware for authentication, logging, and error handling
- **Database Layer**: Drizzle ORM providing type-safe database operations
- **Storage Interface**: Abstracted storage layer with comprehensive CRUD operations for all entities
- **Authentication**: Replit-based OpenID Connect authentication with session management

The server implements role-based access control and provides endpoints for all major operations including student management, attendance tracking, grade management, financial operations, and reporting.

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Neon Database as the serverless provider:

- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Comprehensive relational schema covering students, subjects, classes, enrollments, attendance, grades, invoices, payments, and administrative functions
- **Session Storage**: PostgreSQL-backed session storage for authentication
- **Migration System**: Drizzle Kit for database schema migrations

The database schema supports complex relationships between entities, enabling features like student enrollment across multiple subjects, attendance tracking per class period, grade management with assessments, and comprehensive financial tracking.

## Authentication and Authorization
Authentication is handled through Replit's OpenID Connect integration:

- **Provider**: Replit OIDC with automatic user provisioning
- **Session Management**: Express-session with PostgreSQL store
- **Role-Based Access**: Four distinct user roles with different permission levels
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

User roles determine access to specific features and data, with proper authorization checks on both frontend routes and backend endpoints.

# External Dependencies

## Third-Party Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Replit Authentication**: OpenID Connect provider for user authentication and session management
- **Replit Development Tools**: Vite plugin integration for development environment features

## Key Libraries and Frameworks
- **Frontend**: React, TypeScript, Vite, TanStack React Query, Wouter, React Hook Form, Zod
- **UI Components**: Radix UI primitives, Tailwind CSS, Lucide React icons, Font Awesome
- **Backend**: Express.js, Drizzle ORM, Passport.js for authentication
- **Database**: PostgreSQL with Neon serverless driver, connection pooling
- **Development**: ESBuild for production builds, TSX for development server

# Comprehensive Billing System

## Overview
The Primax Billing System is a comprehensive tuition management solution that handles all aspects of school billing, from monthly invoice generation to complex payment scenarios. Built with flexibility and audit compliance in mind, it supports various billing cycles, payment methods, and financial adjustments.

## Core Features

### 1. Monthly Billing Cycle
- **Automated Invoice Generation**: Generates invoices on the 1st of each month for all active students
- **Subject-Based Billing**: Calculates fees based on enrolled subjects and their individual rates
- **Billing Period Tracking**: Maintains clear billing periods with start/end dates for accuracy
- **Duplicate Prevention**: Prevents generating duplicate invoices for the same billing period

### 2. Advance Payment Processing
- **Multi-Month Coverage**: Processes advance payments covering multiple billing periods
- **Automatic Credit Allocation**: Intelligently allocates payments to existing outstanding invoices
- **Credit Balance Management**: Maintains student credit balances for future invoice application
- **Payment Prioritization**: Applies payments to oldest invoices first

### 3. Partial Payment Support
- **Flexible Payment Amounts**: Accepts partial payments against specific invoices
- **Balance Tracking**: Maintains accurate balance due calculations after each payment
- **Status Management**: Updates invoice status (sent, partial, paid, overdue) based on payment history
- **Payment Allocation**: Links payments to specific invoices with detailed allocation records

### 4. Mid-Month Enrollment Billing
- **Pro-Rated Calculations**: Automatically calculates pro-rated fees for mid-month enrollments
- **Full Month Option**: Provides option for full month billing regardless of enrollment date
- **Enrollment Date Tracking**: Uses actual enrollment date for accurate pro-ration calculations
- **Flexible Billing Logic**: Supports both pro-rated and full month billing strategies

### 5. Manual Adjustments & Exceptions
- **Multiple Adjustment Types**: Supports discounts, late fees, write-offs, and refunds
- **Audit Trail**: Maintains complete audit trails for all manual adjustments
- **Reason Tracking**: Requires and stores reasons for all manual adjustments
- **User Attribution**: Tracks which user applied each adjustment with timestamp

### 6. Student Credit Management
- **Overpayment Tracking**: Automatically tracks student credit balances from overpayments
- **Future Application**: Applies available credits to new invoices automatically
- **Credit History**: Maintains detailed history of credit applications and usage
- **Balance Calculations**: Provides real-time credit balance calculations

### 7. Comprehensive Student Ledger
- **Complete Transaction History**: Shows all invoices, payments, and adjustments
- **Financial Summary**: Provides totals for invoiced amounts, payments, and outstanding balances
- **Payment Allocations**: Details how payments were allocated across invoices
- **Adjustment History**: Complete record of all manual adjustments with reasons

## API Endpoints

### Billing Operations
- `POST /api/billing/generate-monthly` - Generate monthly invoices for all students
- `POST /api/billing/advance-payment` - Process advance payments with credit allocation
- `POST /api/billing/partial-payment` - Process partial payments against specific invoices
- `POST /api/billing/prorated-invoice` - Generate pro-rated invoices for mid-month enrollments
- `POST /api/billing/adjustment` - Apply manual adjustments with audit trails

### Information Retrieval
- `GET /api/billing/student-credit/:studentId` - Get student credit balance
- `GET /api/billing/student-ledger/:studentId` - Get comprehensive student ledger
- `PATCH /api/billing/invoice-status/:invoiceId` - Update invoice status

### Testing & Demo
- `POST /api/billing/run-demo` - Run comprehensive billing system demonstration

## Database Schema

### Core Tables
- **invoices**: Main billing records with amounts, dates, and status tracking
- **payments**: Payment records with method, amounts, and receipt tracking
- **payment_allocations**: Links payments to specific invoices with allocation amounts
- **invoice_adjustments**: Manual adjustments with reasons and audit information
- **billing_schedules**: Student-specific billing preferences and schedules

### Key Features
- **Flexible Invoice Types**: monthly, prorated, custom, multi_month, adjustment
- **Payment Methods**: cash, bank_transfer (with transaction numbers required)
- **Status Tracking**: Comprehensive status management for invoices and payments
- **Audit Compliance**: Complete audit trails for all financial transactions

## Payment Processing

### Supported Payment Methods
- **Cash Payments**: Direct cash payments with receipt generation
- **Bank Transfer**: Electronic transfers with mandatory transaction number tracking
- **Payment Validation**: Ensures payment amounts don't exceed invoice balances
- **Receipt Generation**: Automatic receipt number generation for all payments

### Payment Allocation Logic
1. **Existing Invoice Priority**: Payments first applied to existing outstanding invoices
2. **Oldest First**: Payments applied to oldest invoices first
3. **Full Payment Priority**: Attempts to fully pay invoices before partial allocation
4. **Credit Balance**: Remaining amounts become student credit for future use

## Financial Reporting & Tracking

### Invoice Management
- **Comprehensive Calculations**: Subtotals, discounts, late fees, adjustments, and final totals
- **Balance Tracking**: Real-time balance due calculations considering all payments
- **Status Automation**: Automatic status updates based on payment activity
- **Billing Periods**: Clear billing period definitions for accurate accounting

### Audit & Compliance
- **Complete Audit Trails**: Every adjustment, payment, and change is logged
- **User Attribution**: All actions attributed to specific users with timestamps
- **Reason Tracking**: Mandatory reasons for all manual interventions
- **Transaction Integrity**: Maintains referential integrity across all financial records

The billing system is designed for scalability, accuracy, and compliance with educational institution financial management requirements.

## Build and Development Tools
- **Build System**: Vite for frontend bundling, ESBuild for backend compilation
- **Type Checking**: TypeScript with strict configuration across all modules
- **Code Quality**: ESLint and Prettier configurations (implied by project structure)
- **Package Management**: npm with lockfile for dependency management

The application is designed for deployment on Replit with environment-specific configuration handling and proper production build processes.
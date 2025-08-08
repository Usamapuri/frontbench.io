# Overview

This is Primax School Management System, a comprehensive web application designed to replace paper processes and Google Sheets with a unified digital workspace. The system supports four distinct user roles - Finance/Front Desk, Teachers, Parents, and Management - each with tailored interfaces for their specific responsibilities. The application handles enrollment, attendance tracking, grade management, billing, payments, and financial reporting in one integrated platform.

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

## Build and Development Tools
- **Build System**: Vite for frontend bundling, ESBuild for backend compilation
- **Type Checking**: TypeScript with strict configuration across all modules
- **Code Quality**: ESLint and Prettier configurations (implied by project structure)
- **Package Management**: npm with lockfile for dependency management

The application is designed for deployment on Replit with environment-specific configuration handling and proper production build processes.
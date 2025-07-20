
# Teacher Management System (TMS)

Welcome to the Teacher Management System (TMS), a comprehensive web application designed to streamline the administration of educational institutions. This application provides a centralized platform for managing teacher profiles, school information, student enrollment data, leave requests, and user access control.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Supabase Setup](#supabase-setup)
  - [Running the Application](#running-the-application)
- [Core Functionality](#core-functionality)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Teacher Management](#teacher-management)
  - [School & Enrollment Management](#school--enrollment-management)
  - [Leave Management](#leave-management)
  - [User Management](#user-management)
  - [Data Management](#data-management)

## Key Features

- **Centralized Dashboard**: An at-a-glance overview of key metrics, including total teachers, students on leave, enrollment statistics, and important notifications like upcoming retirements.
- **Detailed Teacher Profiles**: Comprehensive records for each teacher, including personal information, academic qualifications, work history, bank details, and document uploads.
- **School and Enrollment Tracking**: Manage a list of schools and track student enrollment numbers for each class level, broken down by gender.
- **Leave Request System**: A complete workflow for submitting, approving, and tracking teacher leave requests.
- **Role-Based Access Control**: Secure user management with three distinct roles (Admin, Supervisor, Viewer) to control access to sensitive information and features.
- **Data Import/Export**: Backup the entire application's data to a JSON file and restore it when needed.

## Technology Stack

This project is built with a modern, robust, and scalable tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.io/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Application Structure

The project follows a standard Next.js App Router structure:

- `src/app/`: Contains all the pages and layouts.
  - `(auth)/`: The main application entry point with the login page.
  - `dashboard/`: The main authenticated section of the application.
  - `actions/`: Houses all Next.js Server Actions for secure backend operations.
- `src/components/`: Reusable React components.
  - `auth/`: Components related to authentication (e.g., `login-form`).
  - `dashboard/`: Components used within the dashboard pages.
  - `ui/`: Core UI components from ShadCN.
- `src/context/`: Contains the `DataContext` for global state management.
- `src/lib/`: Core utilities and helper functions.
  - `supabase.ts`: Client-side Supabase helper functions.
  - `supabase-admin.ts`: Secure, server-side Supabase client for admin tasks.
  - `types.ts`: TypeScript type definitions for the application's data models.
- `src/hooks/`: Custom React hooks.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Supabase account

### Supabase Setup

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Database Schema**: You will need to create the following tables in your Supabase SQL Editor to match the application's data structure:
    - `teachers`
    - `schools`
    - `leave_requests`
    - `users`
    The specific schemas can be inferred from `src/lib/types.ts`. Your `users` table should have a `FOREIGN KEY` relationship with `auth.users` on an `auth_id` column.
3.  **Environment Variables**: Create a `.env.local` file in the root of the project and add your Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
    - `ANON_KEY` is the public key, safe to be exposed in the browser.
    - `SERVICE_ROLE_KEY` is a secret key with full admin privileges and must **never** be exposed to the browser. It is used exclusively in Server Actions.

### Running the Application

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Core Functionality

### Authentication

Users log in with an email/username and password. The system uses role-based access control, managed through the `users` table. The initial user(s) must be created directly in Supabase or through the application by another admin.

### Dashboard

The main landing page after login, providing a high-level summary of important institutional data.

### Teacher Management

- **View Teachers**: A searchable list of all teachers with key details.
- **Add/Edit Teachers**: A comprehensive form to create or update teacher profiles.
- **View Details**: A detailed view of a single teacher's complete profile.
- **Delete Teachers**: Remove teacher records from the system.

### School & Enrollment Management

- **View Schools**: A list of all schools with a summary of their total enrollment.
- **Add/Edit Schools**: A simple form to manage school names.
- **Manage Enrollment**: A detailed interface to add and update student enrollment numbers for each class level within a school.

### Leave Management

- **View Requests**: A table of all leave requests with their status.
- **Add Request**: A form to submit a new leave request on behalf of a teacher.
- **Update Status**: Admins can approve, reject, or mark requests as pending.

### User Management

- **View Users**: A list of all application users and their roles.
- **Add/Edit Users**: Create new users or modify existing user details and roles.
- **Reset Password**: Admins can set a new password for any user.
- **Delete Users**: Permanently remove a user's access to the application.

### Data Management

- **Export**: Create a full backup of all application data (teachers, schools, leave requests, users) into a single JSON file.
- **Import**: Restore the application's state from a JSON backup file. This will overwrite existing data.
- **Danger Zone**: A feature to clear all application data, preserving only Admin and Supervisor accounts.

---
*This README was generated to provide a clear and comprehensive overview of the Teacher Management System.*

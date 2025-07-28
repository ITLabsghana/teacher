
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
2.  **Database Schema**: Go to the `SQL Editor` in your Supabase dashboard and run the following script to create all the necessary tables and policies.

    ```sql
    -- Custom Enum Types for Roles and Leave Status
    CREATE TYPE user_role AS ENUM ('Admin', 'Supervisor', 'Viewer');
    CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Rejected');
    CREATE TYPE leave_type_enum AS ENUM ('Study Leave (with pay)', 'Study Leave (without pay)', 'Sick', 'Maternity', 'Paternity', 'Casual', 'Other');

    -- TEACHERS TABLE
    CREATE TABLE public.teachers (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        staff_id text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        date_of_birth date,
        gender text,
        registered_no text,
        ghana_card_no text,
        ssnit_no text,
        tin_no text,
        phone_no text,
        home_town text,
        email text,
        address text,
        academic_qualification text,
        professional_qualification text,
        other_professional_qualification text,
        rank text,
        job text,
        subjects text,
        leadership_position text,
        other_leadership_position text,
        area_of_specialization text,
        last_promotion_date date,
        previous_school text,
        school_id uuid,
        date_posted_to_current_school date,
        licensure_no text,
        first_appointment_date date,
        date_confirmed date,
        teacher_union text,
        photo text,
        bank_name text,
        bank_branch text,
        account_number text,
        salary_scale text,
        documents jsonb
    );
    ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated users to manage teachers" ON public.teachers FOR ALL TO authenticated USING (true);


    -- SCHOOLS TABLE
    CREATE TABLE public.schools (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        enrollment jsonb
    );
    ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated users to manage schools" ON public.schools FOR ALL TO authenticated USING (true);

    -- LEAVE REQUESTS TABLE
    CREATE TABLE public.leave_requests (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        teacher_id uuid NOT NULL,
        leave_type leave_type_enum NOT NULL,
        start_date date NOT NULL,
        return_date date NOT NULL,
        status leave_status NOT NULL DEFAULT 'Pending'::leave_status
    );
    ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated users to manage leave requests" ON public.leave_requests FOR ALL TO authenticated USING (true);
    ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


    -- USERS TABLE
    CREATE TABLE public.users (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        auth_id uuid UNIQUE,
        username text NOT NULL,
        email text NOT NULL,
        "role" user_role NOT NULL DEFAULT 'Viewer'::user_role,
        CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = auth_id);
    CREATE POLICY "Allow admin/supervisor to manage users" ON public.users FOR ALL TO authenticated USING (
      (get_my_claim('user_role'::text)) = '"Admin"'::jsonb OR
      (get_my_claim('user_role'::text)) = '"Supervisor"'::jsonb
    );

    -- Function to get custom user claims (role)
    create or replace function get_my_claim(claim text)
    returns jsonb
    language sql
    stable
    set search_path = ''
    as $$
      select nullif(current_setting('request.jwt.claims', true), '')::jsonb -> claim
    $$;

    -- Function to get role for a given user
    create or replace function get_role(user_id uuid)
    returns text
    language plpgsql
    security definer
    set search_path = public
    as $$
    declare
      user_role text;
    begin
      select role into user_role from users where auth_id = user_id;
      return user_role;
    end;
    $$;
    ```
    
    > **Note:** This schema enables Row Level Security (RLS) for all tables, ensuring users can only access data they are permitted to. This is a crucial security practice for any multi-user application.

3.  **Environment Variables**: Create a `.env.local` file in the root of the project and add your Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
    - `ANON_KEY` is the public key, safe to be exposed in the browser.
    - `SERVICE_ROLE_KEY` is a secret key with full admin privileges and must **never** be exposed to the browser. It is used exclusively in Server Actions. You can find this key in your Supabase project settings under `API` -> `Project API Keys`.

4.  **Create Initial Admin User**: After running the schema script, you need to create your first user directly in Supabase.
    - Go to `Authentication` -> `Users` and click `Add User`.
    - After the user is created in `auth.users`, go to your `public.users` table (via the `Table Editor`).
    - Add a new row:
        - `auth_id`: The ID of the user you just created in `auth.users`.
        - `username`: A username for the user.
        - `email`: The same email as the user.
        - `role`: Set this to `Admin`.
    - You can now log in with this user.

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
Made with ❤️ by ITLabs Ghana, Contact 0248362847

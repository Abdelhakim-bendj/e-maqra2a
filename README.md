# Quran Learning Platform

An online educational system for Quran schools, teachers, and students. Built with React, Tailwind CSS, Node.js, Express, Prisma, and Supabase.

## Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Router v6
- **Backend:** Node.js, Express.js, TypeScript, Zod
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **ORM:** Prisma
- **Media Storage:** Supabase Storage (Planned)
- **Push Notifications:** Firebase Cloud Messaging (Planned)

## Setup Instructions

### Prerequisites
- Node.js 20 LTS
- Local PostgreSQL Database (or a cloud provider like Supabase)
- Supabase account/project for Auth

### 1. Database & Environment Setup
Create a `.env` file in your `Backend/` directory and configure your Database URL and Supabase credentials.

```bash
cd Backend
cp .env.example .env
```

Open `.env` and configure:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/quran_learning?schema=public"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server. The dev server will automatically generate Prisma client and sync the database.

```bash
cd Backend
npm install

# Start the development server (automatically prepares Prisma)
npm run dev
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies.
```bash
cd Frontend
npm install

# Start the frontend development server
npm run dev
```

## Features Implemented in Phase 1 (Core)
- **Database Schema:** Full `schema.prisma` implemented matching the SRS Section 6 data models.
- **Authentication API:** Integration with Supabase Auth, JWT verification via HTTP-only cookies, and role-based access control (Admin, Teacher, Student).
- **Backend Architecture:** Express.js setup with Helmet, CORS, and Zod validation. Unit tests configured with Vitest.
- **Frontend Architecture:** Vite + React + TypeScript setup. Tailwind CSS customized with an Islamic Green color palette, and global CSS enforcing Right-to-Left (RTL) layout for Arabic text display.

i give you the logo image is in racine folder (/e-maqra2a)
make this logo in all the places it need to be


make return button in the places they need in the exam generating and in all places that need in the mobile app for the user need to go back to the previous screen but don't replace the navigation bar


when the new user log he will see list of the teachers and search bar for search and when he click to teacher he can choose him and have the messages side to message them
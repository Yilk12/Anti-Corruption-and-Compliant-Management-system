# Ethics & Anti-Corruption Module - Implementation Guide

## Overview

This module implements a comprehensive Ethics & Anti-Corruption Management System for FCSC based on the provided requirements specification.

## Completed Components

### Frontend (Next.js)

1. **Dashboard** (`app/dashboard/Ethics_Anti_Corruption/page.tsx`) ✅
   - Comprehensive statistics cards (Total Complaints, Under Investigation, Overdue Cases, Training Completion, Pending Declarations, High Risk Items)
   - Quick action buttons for common tasks
   - Integration with existing feedback system

2. **Complaints Management** (`app/ethics/complaints/page.tsx`) ✅
   - Complaint listing with filters (status, category, priority, search)
   - Export functionality
   - View and edit actions
   - Status and priority badges with color coding

3. **New Complaint Form** (`app/ethics/complaints/new/page.tsx`) ✅
   - Full complaint submission form with all required fields
   - Anonymous reporting support
   - Evidence file upload
   - Consent and declaration checkboxes
   - Form validation
   - Draft save functionality

4. **Investigations Management** (`app/ethics/investigations/page.tsx`) ✅
   - Case listing with tabs (All, Active, Overdue, Closed)
   - Investigation lifecycle tracking
   - Overdue case highlighting
   - Assignee and supervisor information

5. **Sidebar Navigation** (`app/components/dashboard-layout.tsx`) ✅
   - Added Ethics Dashboard, Complaints, and Investigations navigation items
   - Role-based visibility (ethics_anti_corruption, admin, commissioner)

### Backend (NestJS)

1. **DTOs** (`backend/src/ethics/dto/create-complaint.dto.ts`) ✅
   - CreateComplaintDto with validation
   - Enums for ReportingChannel, ComplaintCategory, ComplaintPriority

2. **Service** (`backend/src/ethics/ethics.service.ts`) ✅
   - Complaint CRUD operations
   - Investigation management
   - Statistics aggregation
   - Reference number generation

3. **Controller** (`backend/src/ethics/ethics.controller.ts`) ✅
   - RESTful API endpoints
   - Swagger documentation
   - JWT authentication integration

4. **Module** (`backend/src/ethics/ethics.module.ts`) ✅
   - Module configuration
   - Prisma dependency

5. **App Module Registration** (`backend/src/app.module.ts`) ✅
   - EthicsModule imported and registered

### Database Schema

1. **Ethics Schema** (`backend/prisma/schema.prisma`) ✅
   - Complaint model
   - Investigation model
   - InvestigationActivity model
   - Evidence model
   - Policy model
   - PolicyAcknowledgment model
   - Declaration model
   - Training model
   - TrainingRegistration model
   - RiskAssessment model
   - MitigationPlan model
   - User model updated with ethics relations

## Remaining Integration Steps

### 1. Run Prisma Generate (IMPORTANT)

The schema has been merged into `schema.prisma`, but Prisma client needs to be regenerated.

**Steps:**

1. Stop the backend server if it's running
2. Run `npx prisma generate` in the backend directory
3. This will resolve the TypeScript errors in `ethics.service.ts`

### 2. Fix Auth Guard Import

The ethics controller imports JWT auth guard from a path that may not exist in your project structure.

**Steps:**

1. Check the actual path to your JWT auth guard (likely in `backend/src/auth/` or similar)
2. Update the import in `backend/src/ethics/ethics.controller.ts`:
   ```typescript
   import { JwtAuthGuard } from "../auth/jwt-auth.guard"; // Adjust path as needed
   ```

### 3. Create Database Migration

After running `npx prisma generate`, create the database migration.

**Steps:**

1. Run `npx prisma migrate dev --name add_ethics_module` to create the migration
2. This will add the ethics tables to your database

### 4. Create Frontend API Proxy Routes

Create Next.js API routes to proxy requests to the backend.

**Steps:**

1. Create `app/api/ethics/complaints/route.ts`
2. Create `app/api/ethics/investigations/route.ts`
3. Create `app/api/ethics/statistics/route.ts`
4. Use the existing `forwardToBackend` pattern from other API routes

## Pending Components (Medium Priority)

The following pages are defined in the requirements but not yet implemented:

1. **Ethics & Policies** (`/ethics/policies`)
   - Policy management
   - Document upload
   - Approval workflow
   - Employee acknowledgments

2. **Declarations** (`/ethics/declarations`)
   - Conflict of Interest declarations
   - Gift and hospitality reporting
   - Review and mitigation
   - Recusal tracking

3. **Training & Awareness** (`/ethics/training`)
   - Course management
   - Schedule creation
   - Registration
   - Attendance tracking
   - Completion reports

4. **Risk Assessment** (`/ethics/risk-assessment`)
   - Risk register
   - Risk scoring
   - Mitigation plans
   - Control monitoring

5. **Reports & Analytics** (`/ethics/reports`)
   - Complaint summary reports
   - Investigation performance
   - Case aging reports
   - Export functionality

6. **Notifications** (`/ethics/notifications`)
   - Alert management
   - Deadline reminders
   - Assignment notifications

7. **Settings** (`/ethics/settings`)
   - Module configuration
   - Reference data management
   - Workflow configuration

## API Endpoints

### Complaints

- `POST /api/ethics/complaints` - Create complaint
- `GET /api/ethics/complaints` - List complaints (with filters)
- `GET /api/ethics/complaints/:id` - Get complaint details
- `PATCH /api/ethics/complaints/:id` - Update complaint
- `POST /api/ethics/complaints/:id/assign` - Assign complaint

### Investigations

- `POST /api/ethics/investigations` - Create investigation
- `GET /api/ethics/investigations` - List investigations (with filters)
- `GET /api/ethics/investigations/:id` - Get investigation details

### Statistics

- `GET /api/ethics/statistics` - Get dashboard statistics

## Security Considerations

1. **Role-Based Access Control**: Ensure proper role checks for ethics_anti_corruption role
2. **Anonymous Complaints**: Protect complainant identities in anonymous reports
3. **Evidence Integrity**: Implement file hashing and chain of custody tracking
4. **Audit Logging**: Log all state changes and access to sensitive data
5. **Data Encryption**: Encrypt sensitive data at rest and in transit

## Testing Checklist

- [ ] Schema migration runs successfully
- [ ] Backend module registers without errors
- [ ] Frontend pages render without errors
- [ ] Complaint submission works end-to-end
- [ ] Investigation creation works end-to-end
- [ ] Statistics API returns correct data
- [ ] Role-based access control works correctly
- [ ] File upload for evidence works
- [ ] Export functionality works
- [ ] Navigation links work correctly

## Notes

- The current implementation uses sample data in the frontend. Once the backend is integrated, update the frontend to fetch real data from the API.
- The JWT auth guard path needs to be adjusted based on your project structure.
- The User model relations in the schema need to be merged carefully to avoid conflicts with existing relations.
- Consider adding database indexes for frequently queried fields as shown in the schema.

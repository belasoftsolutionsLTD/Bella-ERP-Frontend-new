# Bella ERP — Comprehensive Technical Documentation

> **Generated:** 2026-07-02  
> **System:** Bella ERP — HR / School ERP Platform  
> **Codebase:** `/home/carole/Downloads/LMS-NODE`

---

## TABLE OF CONTENTS

1. [Architecture & Tech Stack](#1-architecture--tech-stack)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Implemented Modules](#3-implemented-modules)
4. [API Endpoint Reference](#4-api-endpoint-reference)
5. [Database Collections & Schemas](#5-database-collections--schemas)
6. [Frontend Pages & Components](#6-frontend-pages--components)
7. [Gap Analysis — What Is Missing](#7-gap-analysis--what-is-missing)
8. [Security Assessment](#8-security-assessment)
9. [Performance & Scalability](#9-performance--scalability)
10. [Recommendations & Priority Roadmap](#10-recommendations--priority-roadmap)

---

## 1. Architecture & Tech Stack

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Next.js 14 (App Router) · TypeScript · Tailwind CSS        │
│  React Hook Form · Zod · Recharts · next-intl (i18n)        │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTPS / REST JSON
┌───────────────────────▼─────────────────────────────────────┐
│                       API LAYER                              │
│  Node.js 18+ · Express 4 · JWT Bearer Auth                  │
│  Rate limiting · Audit logging · MongoDB sanitization        │
│  Multer (file uploads) · PDFKit · Nodemailer · Speakeasy     │
└───────────────────────┬─────────────────────────────────────┘
                        │  MongoDB Native Driver v6
┌───────────────────────▼─────────────────────────────────────┐
│                     DATA LAYER                               │
│  MongoDB (single instance, localhost:27017)                  │
│  65+ collections · No ODM (raw driver queries)              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 14.2.x |
| Frontend Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | Custom + Radix UI primitives | — |
| Charts | Recharts | 3.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| HTTP Client | Axios | 1.7.x |
| Toasts | Sonner | 1.5.x |
| i18n | next-intl | 3.15.x |
| Icons | Lucide React | 0.400.x |
| Backend Framework | Node.js + Express | 18+ / 4.x |
| Database | MongoDB (Native Driver) | 6.7.x |
| Authentication | JWT (jsonwebtoken) | 9.x |
| MFA | Speakeasy (TOTP) + QRCode | 2.x / 1.5.x |
| Password Hashing | bcryptjs | 2.x |
| File Upload | Multer | 1.4.x |
| PDF Generation | PDFKit | 0.15.x |
| Email | Nodemailer | 8.x |
| Logging | Winston | 3.x |
| Cron Jobs | node-cron | 4.x |
| Rate Limiting | express-rate-limit | 8.x |
| Input Sanitization | express-mongo-sanitize | 2.x |

### 1.3 Project Structure

```
LMS-NODE/
├── backend/
│   ├── server.js                    # Entry point
│   ├── app.js                       # Express app + route registration
│   ├── .env                         # Environment config
│   └── src/
│       ├── configs/                 # DB connection, constants
│       ├── functions/               # Shared utilities (DB helpers, tax calc, notifiers)
│       ├── lib/                     # Logger, cron tasks, index initializer, validators
│       ├── middleware/              # Auth, roles, scope, rate limit, audit, error handler
│       ├── routes/                  # 35 route modules (each has router + functions file)
│       └── services/                # Email service, PDF service
└── frontend/
    ├── src/
    │   ├── app/[locale]/            # Next.js App Router pages (44 pages)
    │   ├── features/                # 32 feature modules (Pages + Components + Hooks)
    │   ├── functions/               # apiCallFunction, shared utils
    │   ├── configs/                 # API_BASE_URL, constants
    │   ├── i18n/                    # next-intl routing config
    │   └── middleware.ts            # next-intl i18n routing middleware
    └── public/
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

```
1. POST /api/auth/login
   → Validates email + password (bcrypt compare)
   → If MFA enabled: returns { requiresMfa: true, tempToken }
   → If MFA disabled: returns { accessToken, refreshToken, user }

2. POST /api/auth/mfa/complete   (if MFA required)
   → Validates TOTP code via speakeasy
   → Returns { accessToken, refreshToken, user }

3. Every protected request:
   → Authorization: Bearer <accessToken>
   → decodeToken middleware: verifies JWT
   → getUserData middleware: loads full user from DB, attaches to req.user
```

### 2.2 JWT Token Details

| Property | Value |
|----------|-------|
| Algorithm | HS256 (jsonwebtoken default) |
| Expiry | 7 days (JWT_EXPIRES_IN=7d) |
| Secret | `JWT_SECRET` env var |
| Refresh Token | Stored in DB, invalidated on logout |
| `req.user` shape | `{ _id, email, role, employeeId, companyId, name, notificationsEnabled }` |

### 2.3 Role-Based Access Control

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access |
| `hr_manager` | All HR operations, payroll, reports |
| `department_head` | Team leave approval, team expenses, dept reports |
| `staff` | Self-service portal only (scoped to own data) |

**Middleware chain for protected routes:**
```
decodeToken → getUserData → [allowRoles(['super_admin','hr_manager'])] → handler
```

**Scope protection:**
- `scopeBodyToSelf` — for staff, overwrites `req.body.employeeId` with their own
- `scopeParamToSelf` — blocks staff from accessing URL params for another employee

### 2.4 MFA (Multi-Factor Authentication)

- TOTP-based via `speakeasy`
- Setup: `POST /api/auth/mfa/setup` returns QR code URI
- Verify: `POST /api/auth/mfa/verify` validates the code and enables MFA
- Disable: `POST /api/auth/mfa/disable`
- Recovery codes: Not yet implemented

### 2.5 Password Management

- `POST /api/auth/forgot-password` — sends reset email
- `POST /api/auth/reset-password` — validates token, updates password
- `PATCH /api/auth/change-password` — authenticated self-service change
- `POST /api/auth/accounts/:id/reset-password` — admin force-reset

---

## 3. Implemented Modules

### 3.1 Employee Management

**What it does:** Complete employee lifecycle management — creation, profile management, document storage, status tracking, org chart.

**Key Features:**
- Employee creation with full profile (personal info, job info, contact, emergency contacts, banking, contract)
- Profile updates with field-level tracking
- Employee status management (`active`, `on_leave`, `terminated`, `probation`)
- Document upload and download (contracts, IDs, certificates)
- Bulk status revert for expired leave statuses (cron job)
- Org chart generation (hierarchical, by reportsTo)
- Staff number auto-generation
- Employee search, filter (by department, status, designation)
- Paginated listing with sort

**Employee Detail Tabs (frontend):** Profile, Work, Leave, Payroll, Performance, Documents, Assets, Notes

---

### 3.2 HR Dashboard

**What it does:** Real-time KPI overview for HR managers.

**Widgets:**
- Headcount (total, by department)
- New hires (this month/quarter)
- Attendance rate (today)
- Pending leave requests
- Expiring contracts (next 30/60/90 days)
- Onboarding progress
- Performance concerns (overdue reviews, low-scoring employees)
- Department breakdown chart
- Open job positions summary
- Live attendance feed
- Upcoming celebrations (birthdays, work anniversaries)
- Pending action items from inbox
- Today's schedule

---

### 3.3 Recruitment Module

**What it does:** End-to-end applicant tracking system (ATS).

**Key Features:**
- Job positions board (open, filled, closed, paused)
- Kanban board for applicant stages: `applied → shortlisted → interview_scheduled → offer_sent → hired → rejected`
- Add applicants manually or via public portal
- CV upload and download
- Stage progression with approval timestamps
- Interview scheduling (interviewer, date, time, location)
- Offer letter generation and email delivery
- Bulk stage patching
- One-click hire: creates employee record, generates staff number, initializes leave balances, creates onboarding tasks
- Applicant notes
- HR inbox notification on new application (both portal and manual)

---

### 3.4 Onboarding & Offboarding

**What it does:** Structured task-based onboarding and offboarding checklists.

**Key Features:**
- Onboarding templates (reusable task sets by department)
- Auto-assign default tasks on hire
- Per-employee task list with due dates, sections, assignedDepartment
- Task completion tracking (by HR or employee self-service)
- JD (Job Description) PDF generation and serving
- HR notified when all tasks complete (inbox + bell)
- Offboarding: 10 default tasks across before_last_day / last_day / after_departure
- Offboarding task management and completion
- Frontend completion screens ("Successfully Onboarded / Offboarded")
- Staff portal shows their own onboarding/offboarding checklists

---

### 3.5 Leave Management

**What it does:** Full leave lifecycle including balances, requests, approval, calendar, and analytics.

**Key Features:**
- Leave types: `annual`, `sick`, `maternity`, `paternity`, `unpaid`, `emergency`
- Leave balance tracking per employee per type
- Balance adjustment by HR
- Leave request creation (HR-side and staff portal)
- Approval / rejection / revocation workflow
- Dispute resolution
- Leave calendar view (by month)
- Conflict detection (overlapping requests)
- Today's absences widget
- Upcoming leaves list
- Leave export to CSV and PDF
- Leave policies management
- HR inbox action item on new request
- Staff notified on approval/rejection (bell)
- Department head can approve their team's leave

---

### 3.6 Attendance & Time Tracking

**What it does:** Daily attendance recording, clock-in/out, timesheets, shifts, and absence alerts.

**Key Features:**
- Clock-in / clock-out (with break start/break end)
- Today's status widget (clocked in, on break, clocked out)
- Manual attendance marking by HR
- Bulk import via CSV
- Monthly attendance grid (color-coded by status)
- Absence alerts (employees absent without leave record)
- Team status card (who's in, who's out today)
- Weekly timesheets (create, save, submit, approve, reject)
- Shifts management (create shifts, assign employees)
- Shift applications (open shifts employees can apply for)
- Attendance reports
- Staff portal: My Attendance, Timesheets, My Shifts tabs

---

### 3.7 Payroll Module

**What it does:** Multi-cycle payroll processing with Kenyan tax calculations, payslip generation, and disbursement tracking.

**Key Features:**
- Payroll cycles (open → review → locked → closed)
- Bulk payroll generation per cycle
- Per-employee payroll computation:
  - Basic pay from job group
  - Fixed allowances (housing, transport, etc.)
  - Deductions (loans, advances, etc.)
  - Kenyan statutory deductions: PAYE (progressive tax bands), NSSF, SHA (NHIF successor)
  - Net pay calculation
- Exception tracking (missing gross pay, bank details, etc.)
- "Fix Issues" link before approving employees with errors
- Approve individual employees within a cycle
- Lock and close cycles
- Bank disbursement file export (CSV)
- Payslip PDF generation and download
- Employee payslip history
- Payroll concepts (recurring pay components)
- Employee compensation management (add/update allowances per employee)
- Payroll analytics (gross, net, deductions totals)
- Staff portal: My Payslips tab

---

### 3.8 Performance Management

**What it does:** Goal setting, performance reviews, appraisal cycles, 360-degree feedback, and calibration.

**Key Features:**
- Performance goals: create, update, delete, check-ins, comments
- Goal Kanban board (not started / in progress / completed)
- Goal detail drawer with progress tracking
- Appraisal cycles: create, launch, close
- Reviews: upsert review scores and comments per employee per cycle
- 360 feedback: give feedback, view received feedback
- Calibration tab (across-cycle score normalization)
- Performance analytics (avg scores, trend charts)
- Performance alerts (employees below threshold, overdue reviews)
- Staff portal: Set goals, view goals, view appraisal history

---

### 3.9 Training & Development

**What it does:** LMS-style course management with enrollment, progress tracking, and certificate generation.

**Key Features:**
- Course catalogue: list, create, update, delete
- Course types: `self_paced`, `instructor_led`
- Learning objectives checklist per course
- Self-enrollment and HR bulk-assign to employees
- Progress tracking (% complete, objectives toggled)
- Course start / completion tracking
- Certificate PDF generation (landscape A4, with name, course, date)
- Team training view for managers
- HR assignment sends bell notification to each enrolled employee
- Staff portal: Training tab with enroll/start/continue

---

### 3.10 Awards & Recognition

**What it does:** Employee awards, peer kudos, recognition programs, leaderboard.

**Key Features:**
- Award types (templates with category, repeat interval, schedule)
- Grant individual awards to employees
- Bulk grant same award to multiple employees
- Revoke awards
- Award stats (by type, department, top recipients)
- Upcoming scheduled awards (within 60 days)
- Schedule advancement after granting
- Kudos (peer-to-peer recognition):
  - Send kudos to one or multiple recipients
  - Link to company values
  - GIF support
  - Visibility (public/private)
  - Points system
  - Reactions and comments on kudos
  - Daily kudos limit enforcement
- Leaderboard (by month / quarter / year, by department)
- My Rank widget
- Recognition settings (points, limits, minimum message length)
- Company values management (create, reorder, emoji/color)
- Award programs: create programs, accept nominations, select winner
- Nomination submission by any user
- Winner announcement posted to community feed
- Bell notifications: on award grant, on kudos received

---

### 3.11 Expense Claims

**What it does:** Employee expense claim submission, approval, dispute, and reimbursement tracking.

**Key Features:**
- Three expense types: `regular`, `per_diem`, `mileage`
- Per-diem: auto-calculate from destination rates and days
- Mileage: auto-calculate from distance and rate per km
- Receipt file upload
- Policy violation detection (per-category limits)
- Claim status: `draft → submitted → approved / rejected → disputed → reimbursed`
- HR and manager notified on submission (inbox + bell)
- Employee notified on approval, rejection, reimbursement (bell)
- HR dispute inbox item on dispute submission
- HR cannot edit staff claims (removed)
- Rejection via modal (not browser prompt)
- Dispute flow: employee can dispute rejected claims, HR re-reviews
- Expense analytics (by category, month, department, top spenders)
- Expense policy management (category limits, per-diem rates, mileage rate)
- CSV export
- Mark as reimbursed

---

### 3.12 Projects & Tasks

**What it does:** Project management with team assignment, time tracking, budget, and task management.

**Key Features:**
**Projects:**
- Create, update, delete projects
- Project detail tabs: Overview, Team, Time Tracking, Budget, Expenses
- Team member management (add/remove)
- Time entry logging
- Project budget tracking
- Project expense logging

**Tasks:**
- Create tasks with assignees, priority, due date, type
- Task statuses: not_started / in_progress / review / completed
- Subtask support
- Task comments
- Task templates (reusable task sets with trigger events and due offsets)
- Team task view and individual task list
- Task analytics (by status, priority, assignee)
- Employee task load overview
- CSV export
- Staff portal: My Tasks tab (tasks assigned to me)

---

### 3.13 Communication & Announcements

**What it does:** Company-wide communication hub — feed, announcements, 1:1 meetings, communities, trust channel.

**Key Features:**
- Company feed (posts, reactions, comments)
- Community/group creation, join, leave
- Community-specific feeds
- Announcements: create, publish, target by department or all-staff
- Announcement read-tracking per employee
- Staff portal announcements view
- 1:1 meeting series management
- Meeting notes (create, update, view per series)
- Upcoming celebrations (birthdays/anniversaries)
- Trust channel: anonymous report submission (public, no auth)
- Trust report tracking code for status check
- Admin view of trust reports (protected)
- Clap reactions on posts
- Communication settings (who can post, channels enabled)

---

### 3.14 IT Asset Management

**What it does:** Device and software inventory with assignment tracking and request management.

**Key Features:**
- Device inventory (laptop, computer, mobile, monitor, storage, etc.)
- Device details: brand, model, serial number, condition, asset tag
- Assign/unassign devices to employees
- Device summary stats (total, assigned, unassigned, in-repair)
- Expiring assets detection
- Software app inventory
- Software assignment and revocation
- IT request management (create, update, resolve)
- Employee profile Assets tab shows assigned devices
- IT requests tracking

---

### 3.15 Finance & Spending

**What it does:** Corporate card management, invoice tracking, procurement (purchase requests).

**Key Features:**
- Corporate card management (create, update, list)
- Card transaction logging
- Invoice management (accounts_payable / accounts_receivable)
- Invoice approval/rejection/mark-paid workflow
- Bell notification to submitter on invoice payment
- Purchase requests (create, approve, reject)
- Bell notification to requester on approval/rejection
- Financial workspace: compensation by job group, cost centers, workforce history, trends
- Spending analytics page

---

### 3.16 Notifications & Inbox

**What it does:** Two-layer notification system — bell notifications (quick alerts) and inbox (actionable items).

**Bell Notifications:**
- Per-user, stored in `notifications` collection
- Fields: `recipientId`, `userId`, `title`, `body`, `subtitle`, `type`, `isRead`, `read`, `navigateTo`, `link`
- `notifyUser(userId, payload)` — direct to user ID
- `notifyEmployee(employeeId, payload)` — lookup user by employeeId then notify
- `notifyByRoles(roles[], payload)` — broadcast to all users of given roles
- `notifyStaffByAudience(audience, department, payload)` — notify all/department staff

**Inbox (Action Items):**
- Stored in `inbox_items` collection
- Fields: `type`, `subType`, `title`, `subtitle`, `referenceId`, `referenceModel`, `requiresAction`, `isRead`, `isDismissed`, `actionTaken`
- `notifyHR(itemData)` — creates inbox item for all HR managers
- `notifyManager(employeeId, itemData)` — creates inbox item for the employee's manager
- `createInboxItem(recipientUserId, itemData)` — direct inbox item
- Bulk actions (mark all read, dismiss)
- Count badge in navigation

**Modules with full notification wiring (as of documentation date):**
Leave, Payroll, Expenses, Awards, Kudos, Onboarding, Recruitment, Training assignment, Spending (invoices, purchase requests), Offboarding completion, Trust channel, Announcements

---

### 3.17 Reports Module

**What it does:** Cross-module analytics and exportable reports.

**Available Reports:**
| Report | Details |
|--------|---------|
| Overview Report | Headcount, new hires, active employees |
| Attendance Report | Daily/monthly, rates, absences |
| Payroll Report | Gross/net totals, deductions by month |
| Leave Report | By type, by department, utilization |
| Recruitment Report | Applications, pipeline, time-to-hire |
| Onboarding Report | Completion rates, overdue tasks |
| Performance Report | Avg scores, goal completion, reviews |
| Expense Claims Report | By type, policy violations, totals |
| Awards Report | By type, by department, recognition activity |
| IT Assets Report | Device utilization, unassigned, in-repair |
| Spending Report | Invoices, purchase requests, card spend |
| CSV Export | Attendance CSV, Leave CSV |

---

### 3.18 Staff Portal (Employee Self-Service)

**What it does:** Single-page employee self-service portal with 21 sections.

**Sections:**
| Section | Capability |
|---------|-----------|
| Profile | View & edit personal info, emergency contacts, banking |
| Notifications | Bell notification feed |
| Inbox | Action items requiring response |
| Attendance | Daily records, clock-in/out widget |
| Timesheets | Weekly timesheet submission |
| Shifts | View assigned shifts, apply for open shifts |
| Leave | Balance cards, apply for time off, dispute |
| Tasks | Tasks assigned to me |
| Projects | Projects I'm a member of |
| Job Description | Role & responsibilities PDF |
| Payslips | Monthly payslip download |
| Expenses | Submit and track expense claims |
| Payment Methods | Bank & M-Pesa details |
| Training | Enroll in courses, track progress |
| Performance | Goals (view + set), appraisal history |
| Awards | Kudos received, leaderboard, certifications |
| Communication | Company feed, announcements, 1:1 meetings |
| Events | Upcoming training & team events |
| Documents | My documents (upload/download) |
| Onboarding | My onboarding checklist |
| Offboarding | My offboarding checklist |
| Terms | Company policies and agreements |

---

### 3.19 Configuration & Settings

**What it does:** System-wide HR configuration.

**Configuration Panels:**
- Company settings (name, logo, address, terms PDF)
- Job groups (salary bands)
- Fixed allowances (housing, transport, etc.)
- Deductions (loan types, etc.)
- Designations
- Job description templates
- Tax configuration (PAYE bands, NSSF rates, SHA rates)
- Communication settings (channels, posting permissions)
- Scheduled events (holidays, training days)
- Recognition settings
- User account management (create, update, reset password)

---

### 3.20 Org Chart

- Hierarchical visualization of employee reporting lines
- Built from `reportsTo` field on employee records
- Interactive org chart page

---

### 3.21 Documents Module

- Company-wide document storage
- Employee-specific document upload/download
- Self-service document upload in staff portal
- Document categories (certificate, contract, ID, etc.)

---

### 3.22 Middleware Layer

| Middleware | Purpose |
|-----------|---------|
| `AsyncHandler` | Wraps async route handlers, forwards errors to Express error handler |
| `AuthMiddleware` (`decodeToken` + `getUserData`) | JWT decode → full user load from DB |
| `RolesMiddleware` (`allowRoles`) | Role-based route gating |
| `ScopeMiddleware` (`scopeBodyToSelf`, `scopeParamToSelf`) | Prevents staff accessing other employees' data |
| `AuditMiddleware` | Logs all POST/PUT/PATCH/DELETE to `audit_logs` collection |
| `ErrorHandler` | Global Express error handler with Winston logging |
| `LocaleMiddleware` | i18n — reads Accept-Language header, attaches locale strings to `req.locale` |
| `RateLimitMiddleware` | Auth: 5 req/15min; Writes: 60 req/min per IP |

---

## 4. API Endpoint Reference

### 4.1 Authentication (`/api/auth`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | First-time system setup |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| PATCH | `/api/auth/change-password` | Authenticated self-service change |
| POST | `/api/auth/mfa/setup` | Generate TOTP QR code |
| POST | `/api/auth/mfa/verify` | Enable MFA |
| POST | `/api/auth/mfa/disable` | Disable MFA |
| POST | `/api/auth/mfa/complete` | Complete MFA login |

### 4.2 Employees (`/api/employees`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/employees` | List all employees (paginated, filterable) |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get single employee |
| PUT | `/api/employees/:id` | Update employee |
| PATCH | `/api/employees/:id/status` | Change status |
| DELETE | `/api/employees/:id` | Soft delete / terminate |
| POST | `/api/employees/:id/documents` | Upload document |
| GET | `/api/employees/:id/documents/:filename` | Download document |
| GET | `/api/employees/org-chart` | Org chart hierarchy |

### 4.3 Recruitment (`/api/hr`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/hr/positions` | List job positions |
| POST | `/api/hr/positions` | Create position |
| PUT | `/api/hr/positions/:id` | Update position |
| DELETE | `/api/hr/positions/:id` | Delete position |
| PATCH | `/api/hr/positions/:id/status` | Open/close/fill position |
| GET | `/api/hr/applicants` | List applicants (with filters) |
| POST | `/api/hr/applicants` | Add applicant |
| PUT | `/api/hr/applicants/:id` | Update applicant |
| PATCH | `/api/hr/applicants/:id/stage` | Move pipeline stage |
| PATCH | `/api/hr/applicants/bulk-stage` | Bulk stage update |
| POST | `/api/hr/applicants/:id/notes` | Add note |
| POST | `/api/hr/applicants/:id/offer` | Send offer letter |
| DELETE | `/api/hr/applicants/:id` | Delete applicant |
| GET | `/api/hr/interviews` | List interviews |
| POST | `/api/hr/interviews` | Schedule interview |
| PUT | `/api/hr/interviews/:id` | Update interview |
| DELETE | `/api/hr/interviews/:id` | Cancel interview |

### 4.4 Leave (`/api/leave`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leave/balances` | All employees' balances (HR) |
| GET | `/api/leave/balances/:employeeId` | Single employee balance |
| PATCH | `/api/leave/balances/:employeeId` | Adjust balance |
| GET | `/api/leave/requests` | List all requests |
| POST | `/api/leave/requests` | Create request (HR) |
| GET | `/api/leave/requests/:id` | Get single request |
| PATCH | `/api/leave/requests/:id/approve` | Approve |
| PATCH | `/api/leave/requests/:id/reject` | Reject |
| PATCH | `/api/leave/requests/:id/revoke` | Revoke approved leave |
| PATCH | `/api/leave/requests/:id/cancel` | Cancel (employee) |
| DELETE | `/api/leave/requests/:id` | Delete draft |
| GET | `/api/leave/calendar` | Calendar entries |
| GET | `/api/leave/conflicts` | Detect overlaps |
| GET | `/api/leave/today-absences` | Who's absent today |
| GET | `/api/leave/upcoming` | Upcoming leaves |
| GET | `/api/leave/export` | CSV export |
| GET | `/api/leave/policies` | List leave policies |
| POST | `/api/leave/policies` | Create policy |

### 4.5 Attendance (`/api/attendance`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/attendance` | List records (paginated) |
| POST | `/api/attendance/mark` | Mark attendance (HR) |
| POST | `/api/attendance/bulk-import` | CSV bulk import |
| POST | `/api/attendance/clock-in` | Employee clock in |
| POST | `/api/attendance/clock-out` | Employee clock out |
| POST | `/api/attendance/break-start` | Break start |
| POST | `/api/attendance/break-end` | Break end |
| GET | `/api/attendance/today-status` | My today's status |
| GET | `/api/attendance/my-records` | My attendance history |
| GET | `/api/attendance/team-status` | Team live status |
| GET | `/api/attendance/absence-alerts` | Absence alerts |
| GET | `/api/attendance/timesheets` | All timesheets (HR) |
| GET | `/api/attendance/timesheets/current` | My current timesheet |
| POST | `/api/attendance/timesheets` | Save timesheet |
| PATCH | `/api/attendance/timesheets/:id/submit` | Submit timesheet |
| PATCH | `/api/attendance/timesheets/:id/approve` | Approve timesheet |
| PATCH | `/api/attendance/timesheets/:id/reject` | Reject timesheet |
| GET | `/api/attendance/shifts` | List shifts |
| POST | `/api/attendance/shifts` | Create shift |
| PUT | `/api/attendance/shifts/:id` | Update shift |

### 4.6 Payroll (`/api/payroll`, `/api/me/payslips`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payroll` | List payroll summaries |
| GET | `/api/payroll/:employeeId` | Employee payroll history |
| POST | `/api/payroll/generate` | Generate payslip |
| POST | `/api/payroll/bulk-generate` | Bulk generate for cycle |
| GET | `/api/payroll/:id/download` | Download payslip PDF |
| POST | `/api/payroll/disburse` | Record disbursement |
| GET | `/api/payroll/cycles` | List cycles |
| POST | `/api/payroll/cycles` | Create cycle |
| GET | `/api/payroll/cycles/:id` | Get cycle details |
| PATCH | `/api/payroll/cycles/:id/status` | Advance status |
| GET | `/api/payroll/cycles/:id/results` | All results in cycle |
| GET | `/api/payroll/cycles/:id/exceptions` | Exceptions in cycle |
| POST | `/api/payroll/cycles/:id/approve` | Approve employees in cycle |
| POST | `/api/payroll/cycles/:id/lock` | Lock cycle |
| POST | `/api/payroll/cycles/:id/close` | Close cycle |
| GET | `/api/payroll/cycles/:id/export` | Export CSV |
| GET | `/api/payroll/cycles/:id/bank-file` | Bank disbursement file |
| GET | `/api/payroll/concepts` | List payroll concepts |
| POST | `/api/payroll/concepts` | Create concept |
| PUT | `/api/payroll/concepts/:id` | Update concept |
| DELETE | `/api/payroll/concepts/:id` | Delete concept |
| GET | `/api/payroll/compensations/:employeeId` | Employee compensation |
| POST | `/api/payroll/compensations` | Add compensation |
| PUT | `/api/payroll/compensations/:id` | Update compensation |
| DELETE | `/api/payroll/compensations/:id` | Remove compensation |

### 4.7 Performance (`/api/performance`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/performance/employees/:id` | Employee performance summary |
| POST | `/api/performance/appraisals` | Create appraisal |
| PUT | `/api/performance/appraisals/:id` | Update appraisal |
| GET | `/api/performance/alerts` | Performance alerts |
| GET | `/api/performance/goals` | List goals |
| POST | `/api/performance/goals` | Create goal |
| GET | `/api/performance/goals/:id` | Get goal |
| PUT | `/api/performance/goals/:id` | Update goal |
| DELETE | `/api/performance/goals/:id` | Delete goal |
| POST | `/api/performance/goals/:id/checkin` | Add check-in |
| POST | `/api/performance/goals/:id/comments` | Add comment |
| GET | `/api/performance/cycles` | List review cycles |
| POST | `/api/performance/cycles` | Create cycle |
| GET | `/api/performance/cycles/:id` | Get cycle |
| PUT | `/api/performance/cycles/:id` | Update cycle |
| POST | `/api/performance/cycles/:id/launch` | Launch cycle |
| POST | `/api/performance/cycles/:id/close` | Close cycle |
| GET | `/api/performance/reviews` | List reviews |
| GET | `/api/performance/reviews/:id` | Get review |
| PUT | `/api/performance/reviews/:id` | Upsert review |

### 4.8 Training (`/api/training`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/training/courses` | List courses |
| POST | `/api/training/courses` | Create course |
| GET | `/api/training/courses/:id` | Get course |
| PUT | `/api/training/courses/:id` | Update course |
| DELETE | `/api/training/courses/:id` | Delete course |
| POST | `/api/training/courses/:id/enroll` | Self-enroll |
| POST | `/api/training/courses/:id/assign` | Bulk assign employees |
| POST | `/api/training/courses/:id/start` | Start course |
| PATCH | `/api/training/enrollments/:id/objective` | Toggle objective |
| GET | `/api/training/my-training` | My enrollments |
| PATCH | `/api/training/enrollments/:id/progress` | Update progress |
| GET | `/api/training/team` | Team training view |
| GET | `/api/training/enrollments/:id/certificate` | Download certificate PDF |

### 4.9 Awards & Recognition (`/api/awards`, `/api/kudos`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/award-types` | List award types |
| POST | `/api/award-types` | Create award type |
| PUT | `/api/award-types/:id` | Update award type |
| DELETE | `/api/award-types/:id` | Delete award type |
| GET | `/api/employee-awards` | List employee awards |
| POST | `/api/employee-awards` | Grant award |
| POST | `/api/employee-awards/bulk` | Bulk grant |
| DELETE | `/api/employee-awards/:id` | Revoke award |
| GET | `/api/award-stats` | Award analytics |
| GET | `/api/upcoming-awards` | Due within 60 days |
| GET | `/api/kudos` | List kudos |
| POST | `/api/kudos` | Send kudos |
| DELETE | `/api/kudos/:id` | Delete kudos |
| POST | `/api/kudos/:id/react` | React to kudos |
| POST | `/api/kudos/:id/comments` | Comment on kudos |
| GET | `/api/leaderboard` | Recognition leaderboard |
| GET | `/api/my-rank` | My leaderboard rank |
| GET | `/api/company-values` | List company values |
| POST | `/api/company-values` | Create value |
| PUT | `/api/company-values/:id` | Update value |
| DELETE | `/api/company-values/:id` | Delete value |
| POST | `/api/company-values/reorder` | Reorder values |
| GET | `/api/award-programs` | List programs |
| POST | `/api/award-programs` | Create program |
| POST | `/api/award-programs/:id/nominate` | Nominate employee |
| GET | `/api/award-programs/:id/nominations` | List nominations |
| POST | `/api/award-programs/:id/winner` | Select winner |

### 4.10 Expense Claims (`/api/expenses`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/expenses/claims` | List claims |
| POST | `/api/expenses/claims` | Submit claim |
| GET | `/api/expenses/claims/:id` | Get claim |
| PUT | `/api/expenses/claims/:id` | Update claim |
| DELETE | `/api/expenses/claims/:id` | Delete draft/rejected |
| PATCH | `/api/expenses/claims/:id/approve` | Approve |
| PATCH | `/api/expenses/claims/:id/reject` | Reject |
| PATCH | `/api/expenses/claims/:id/dispute` | Dispute rejection |
| PATCH | `/api/expenses/claims/:id/reimburse` | Mark reimbursed |
| GET | `/api/expenses/claims/export` | CSV export |
| GET | `/api/expenses/analytics` | Analytics |
| GET | `/api/expenses/policy` | Get policy |
| PUT | `/api/expenses/policy` | Update policy |

### 4.11 Staff Self-Service (`/api/me`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/me/profile` | My profile |
| PUT | `/api/me/profile` | Update my profile |
| GET | `/api/me/leave-balance` | My leave balances |
| GET | `/api/me/leave-requests` | My leave history |
| POST | `/api/me/leave-requests` | Apply for leave |
| POST | `/api/me/leave-requests/:id/dispute` | Dispute rejection |
| GET | `/api/me/payslips` | My payslips |
| GET | `/api/me/attendance` | My attendance |
| GET | `/api/me/onboarding` | My onboarding tasks |
| POST | `/api/me/onboarding/:taskId/complete` | Complete task |
| GET | `/api/me/documents` | My documents |
| POST | `/api/me/documents` | Upload document |
| GET | `/api/me/documents/:filename` | Download document |
| DELETE | `/api/me/documents/:filename` | Delete document |
| GET | `/api/me/performance` | My performance/goals |
| GET | `/api/me/awards` | My awards and kudos |
| GET | `/api/me/events` | My events |
| GET | `/api/me/department` | Dept data (dept head) |
| PATCH | `/api/me/department/leave/:id` | Dept head approve/reject leave |
| GET | `/api/me/notification-preference` | Notification preferences |

### 4.12 Communication (`/api/communication`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/communication/feed` | Company feed |
| POST | `/api/communication/posts` | Create post |
| PUT | `/api/communication/posts/:id` | Update post |
| DELETE | `/api/communication/posts/:id` | Delete post |
| POST | `/api/communication/posts/:id/react` | React to post |
| GET | `/api/communication/posts/:id/comments` | Get comments |
| POST | `/api/communication/posts/:id/comments` | Add comment |
| GET | `/api/communication/communities` | List communities |
| POST | `/api/communication/communities` | Create community |
| GET | `/api/communication/communities/:id` | Get community |
| POST | `/api/communication/communities/:id/join` | Join |
| POST | `/api/communication/communities/:id/leave` | Leave |
| GET | `/api/communication/communities/:id/feed` | Community feed |
| GET | `/api/communication/celebrations` | Upcoming birthdays/anniversaries |
| POST | `/api/communication/meeting-series` | Create meeting series |
| GET | `/api/communication/meeting-series` | List meeting series |
| GET | `/api/communication/meeting-series/:id/notes` | Get meeting notes |
| POST | `/api/communication/meeting-series/:id/notes` | Add note |
| POST | `/api/communication/trust` | Submit anonymous trust report (public) |
| GET | `/api/communication/trust/:trackingCode` | Check trust report status (public) |
| GET | `/api/communication/trust/admin` | HR admin view of trust reports |

---

## 5. Database Collections & Schemas

### 5.1 Collection Index (65 collections)

| Collection | Module | Description |
|-----------|--------|-------------|
| `users` | Auth | User accounts with roles, credentials, MFA |
| `employees` | Employees | Employee profiles, contracts, contact info |
| `job_positions` | Recruitment | Open positions / job requisitions |
| `applicants` | Recruitment | Applicant records and pipeline stage |
| `interview_schedules` | Recruitment | Scheduled interviews |
| `onboarding_templates` | Onboarding | Reusable onboarding task templates |
| `onboarding_tasks` | Onboarding | Per-employee task assignments |
| `onboarding_details` | Onboarding | Onboarding metadata |
| `offboarding_tasks` | Offboarding | Per-employee offboarding tasks |
| `leave_requests` | Leave | Individual leave applications |
| `leave_balances` | Leave | Per-employee leave balance by type |
| `leave_policies` | Leave | Leave rules and accrual policies |
| `public_holidays` | Leave/Attendance | Official holidays |
| `attendance_records` | Attendance | Daily clock-in/out records |
| `attendance_settings` | Attendance | Work hours, grace periods |
| `timesheets` | Attendance | Weekly timesheet submissions |
| `shifts` | Attendance | Shift definitions |
| `shift_applications` | Attendance | Open shift applications |
| `work_schedules` | Attendance | Employee work schedule assignments |
| `payroll_cycles` | Payroll | Payroll cycle definitions |
| `payroll_results` | Payroll | Per-employee per-cycle computed results |
| `payroll_summaries` | Payroll | Payslip documents |
| `disbursements` | Payroll | Payment disbursement records |
| `tax_config` | Payroll/Config | PAYE bands, NSSF, SHA rates |
| `goals` | Performance | Employee performance goals |
| `review_cycles` | Performance | Performance review cycle definitions |
| `reviews` | Performance | Per-employee review scores/comments |
| `appraisal_records` | Performance | Appraisal history |
| `training_courses` | Training | Course catalogue |
| `training_enrollments` | Training | Enrollment and progress records |
| `award_types` | Awards | Award type templates |
| `employee_awards` | Awards | Granted awards |
| `kudos` | Awards | Peer recognition posts |
| `recognition_settings` | Awards | Recognition module configuration |
| `company_values` | Awards | Organizational values |
| `award_programs` | Awards | Nomination-based award programs |
| `award_nominations` | Awards | Nominations per program cycle |
| `expense_claims` | Expenses | Employee expense claim records |
| `expense_policies` | Expenses | Expense limits and rates |
| `expenses` | Expenses | General expense records |
| `tasks` | Tasks | Task definitions and assignments |
| `task_templates` | Tasks | Reusable task templates |
| `projects` | Projects | Project definitions |
| `project_members` | Projects | Project team membership |
| `project_time_entries` | Projects | Time logged against projects |
| `project_expenses` | Projects | Expenses logged against projects |
| `announcements` | Communication | Company announcements |
| `community_posts` | Communication | Feed posts |
| `post_comments` | Communication | Comments on posts |
| `communities` | Communication | Groups/channels |
| `trust_reports` | Communication | Anonymous trust/ethics reports |
| `meeting_notes` | Communication | 1:1 meeting notes |
| `one_on_ones` | Communication | 1:1 meeting series |
| `messages` | Messaging | Direct / group messages |
| `conversations` | Messaging | Conversation threads |
| `notifications` | Notifications | Bell notification records |
| `inbox_items` | Inbox | Action-required inbox items |
| `devices` | IT | IT device inventory |
| `software_apps` | IT | Software license inventory |
| `invoices` | Spending | Accounts payable/receivable invoices |
| `card_transactions` | Spending | Corporate card transactions |
| `purchase_requests` | Spending | Procurement requests |
| `staff_notes` | HR | Private HR notes on employees |
| `jd_templates` | Config | Job description templates |
| `audit_logs` | System | All mutating API action audit trail |

### 5.2 Key Schema Shapes

**`users` collection:**
```json
{
  "_id": ObjectId,
  "email": String,
  "password": String (bcrypt),
  "role": "super_admin|hr_manager|department_head|staff",
  "employeeId": ObjectId (nullable),
  "companyId": ObjectId (nullable),
  "fullName": String,
  "notificationsEnabled": Boolean,
  "mfaEnabled": Boolean,
  "mfaSecret": String,
  "refreshToken": String,
  "resetToken": String,
  "resetTokenExpiry": Date,
  "lastLogin": Date,
  "createdAt": Date
}
```

**`employees` collection:**
```json
{
  "_id": ObjectId,
  "staffNumber": String,
  "fullName": String,
  "email": String,
  "phone": String,
  "department": String,
  "designation": String,
  "jobGroupId": ObjectId,
  "grossPay": Number,
  "status": "active|on_leave|terminated|probation",
  "hireDate": Date,
  "contractEndDate": Date,
  "reportsTo": ObjectId,
  "bankName": String,
  "bankAccountNumber": String,
  "nationalId": String,
  "emergencyContact": { name, phone, relationship },
  "documents": [{ filename, originalName, uploadedAt }],
  "createdAt": Date
}
```

**`payroll_results` collection:**
```json
{
  "_id": ObjectId,
  "cycleId": ObjectId,
  "employeeId": ObjectId,
  "grossPay": Number,
  "allowances": [{ name, amount }],
  "deductions": { paye, nssf, sha, loan, other },
  "netPay": Number,
  "employerCost": Number,
  "status": "pending|approved|paid",
  "exceptions": [{ field, message, severity }],
  "approvedAt": Date,
  "approvedBy": ObjectId
}
```

---

## 6. Frontend Pages & Components

### 6.1 App Router Pages (44 pages)

| Route | Page | Module |
|-------|------|--------|
| `/[locale]/login` | LoginPage | Auth |
| `/[locale]/register` | RegisterPage | Auth |
| `/[locale]/apply` | Public job application | Recruitment |
| `/[locale]/dashboard` | HR Dashboard | Dashboard |
| `/[locale]/employees` | Employee list | Employees |
| `/[locale]/employees/new` | Create employee | Employees |
| `/[locale]/employees/[id]` | Employee detail | Employees |
| `/[locale]/recruitment` | Recruitment ATS | Recruitment |
| `/[locale]/onboarding` | Onboarding list | Onboarding |
| `/[locale]/onboarding/[employeeId]` | Employee checklist | Onboarding |
| `/[locale]/offboarding` | Offboarding list | Offboarding |
| `/[locale]/offboarding/[employeeId]` | Employee checklist | Offboarding |
| `/[locale]/leave` | Leave overview | Leave |
| `/[locale]/leave-management` | Leave management | Leave |
| `/[locale]/attendance` | Attendance | Attendance |
| `/[locale]/payroll` | Payroll cycles | Payroll |
| `/[locale]/payroll/concepts` | Pay concepts | Payroll |
| `/[locale]/payroll/employees` | Employee payroll | Payroll |
| `/[locale]/payroll/payslips` | Payslip history | Payroll |
| `/[locale]/performance` | Performance | Performance |
| `/[locale]/training` | Training LMS | Training |
| `/[locale]/certifications` | Certifications | Training |
| `/[locale]/communications` | Announcements (HR) | Announcements |
| `/[locale]/communication` | Staff comms | Communication |
| `/[locale]/tasks` | Task management | Tasks |
| `/[locale]/projects` | Projects list | Projects |
| `/[locale]/projects/[id]` | Project detail | Projects |
| `/[locale]/expenses` | Expense claims | Expenses |
| `/[locale]/spending` | Finance/spending | Spending |
| `/[locale]/finance/workspace` | Financial workspace | Finance |
| `/[locale]/accounts` | User accounts | Accounts |
| `/[locale]/org-chart` | Org chart | OrgChart |
| `/[locale]/documents` | Documents | Documents |
| `/[locale]/assets-management` | IT assets | IT |
| `/[locale]/it-management` | IT management | IT |
| `/[locale]/notifications` | Notifications | Notifications |
| `/[locale]/inbox` | Inbox | Inbox |
| `/[locale]/events` | Events | Communication |
| `/[locale]/reports` | Reports | Reports |
| `/[locale]/config` | HR configuration | Config |
| `/[locale]/settings` | User settings | Settings |
| `/[locale]/staff-portal` | Staff portal (HR view) | Staff Portal |

### 6.2 HR Dashboard Widgets (9 components)

AttendanceRateWidget, DepartmentBreakdownWidget, ExpiringContractsWidget, HeadcountWidget, NewHiresWidget, OnboardingProgressWidget, PendingLeaveWidget, PerformanceConcernsWidget, PositionsSummaryWidget

### 6.3 Employee Detail Tabs (14 component files)

ProfileTab, WorkTab, LeaveTab, PayrollTab, PerformanceTab, DocumentsTab, AssetsTab, NotesTab, EmployeeDetailTabs, EmployeeCard, EmployeeFilters, EmployeeTable, EmployeeSchema, AddEmployeeDrawer

---

## 7. Gap Analysis — What Is Missing

### 7.1 Missing Modules (Standard in Production HR Systems)

| Module | Priority | Notes |
|--------|----------|-------|
| **Succession Planning** | High | Identifying and developing internal candidates for key roles — standard in Workday, SAP |
| **Compensation Benchmarking** | High | Market salary comparison, pay equity analysis — core in BambooHR, Factorial |
| **Benefits Administration** | High | Health insurance, pension enrollment, benefit elections — missing entirely |
| **Employee Wellness Module** | Medium | Mental health resources, wellness challenges, EAP links |
| **Compliance & Policy Acknowledgements** | High | Digital policy sign-off with audit trail (GDPR, labor law) |
| **Disciplinary Management** | High | Warning letters, PIPs (Performance Improvement Plans), hearing records |
| **Grievance Management** | High | Formal grievance submission and tracking |
| **Contract Management** | Medium | Contract generation from templates, e-signatures, expiry alerts |
| **Time-Off Accrual Engine** | High | Automatic balance accrual by tenure, policy rules (currently manual) |
| **Advanced Scheduling** | Medium | Roster/schedule builder with shift swapping, drag-and-drop |
| **Multi-company / Multi-tenant** | Medium | Single instance serving multiple organizations |
| **Survey & Engagement** | Medium | Pulse surveys, eNPS, engagement scoring (standard in Workday, Lattice) |
| **HR Helpdesk / Ticketing** | Medium | Employee queries with SLA tracking |
| **Job Requisition Approval Flow** | High | Multi-step approval before a position goes live |
| **Onboarding Portal (Candidate-facing)** | Medium | Pre-boarding experience before day 1 |

### 7.2 Partially Implemented Features

#### 7.2.1 Leave Module Gaps

> **Note:** Leave accrual (`runLeaveAccrual` at 1.75 days/month, idempotent) **IS implemented** as a backend function. Frontend trigger and scheduling should be verified.

| Missing Feature | Impact |
|----------------|--------|
| Accrual automation (cron scheduling for monthly run) | `runLeaveAccrual` exists but must be confirmed it runs automatically |
| Carry-forward rules and expiry | No enforcement of use-it-or-lose-it policies |
| Leave encashment calculation | Cannot pay out unused leave |
| Blackout periods (no-leave dates) | Not enforced |
| Minimum notice period enforcement | Leave can be applied for any start date |
| Comp-off leave (overtime compensation) | Missing leave type |
| Half-day leave | Only full-day requests |
| Public holiday exclusion from leave count | Unclear if implemented |
| Leave approval delegation | If manager is on leave, no substitute |
| Male vs. female-specific leave types | Paternity correctly separate, but no flexible assignment |

#### 7.2.2 Payroll Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| Overtime pay calculation | Manual only |
| Bonus and commission processing | Not in the cycle engine |
| Arrears and retroactive pay | Not supported |
| Off-cycle / supplemental payroll | One cycle per month only |
| Loan repayment deduction schedule | Deductions are flat, no amortization |
| Pension/provident fund (beyond NSSF) | NSSF only — no private pension |
| Kenya-specific: Housing Levy (Affordable Housing Levy) | Not in tax config |
| Fringe benefits tax | Not calculated |
| Employer P9 form generation | PAYE reconciliation form missing |
| P9A / P9B annual tax return | Not implemented |
| Pay slip email delivery | Payslips must be downloaded manually |
| Payroll approval workflow (multi-level) | Single-level HR approval only |
| Bank integration / direct payment | Bank file export only (manual upload) |
| Year-end processing | No annual reconciliation |

#### 7.2.3 Performance Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| 360-degree feedback from peers/reports | Only manager-to-employee |
| Self-assessment by employee | Not implemented |
| Weighted competency scoring | No competency framework |
| Performance improvement plan (PIP) | Missing |
| Forced ranking / bell curve | 9-box calibration grid IS implemented (`getCalibration`, `updateCalibrationBox`) — frontend `CalibrationTab` exists |
| OKR (Objectives & Key Results) framework | Goal types not clearly OKR-structured |
| Continuous feedback (daily/weekly) | Check-ins exist but no formal continuous feedback loop |
| Review reminders and escalation | No automated reminders |

#### 7.2.4 Recruitment Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| AI-powered candidate matching | Manual review only |
| Job posting to external boards | No integration (LinkedIn, Indeed) |
| Automated screening questions | Not present |
| Assessment/test scheduling | Not present |
| Reference check tracking | Not tracked |
| Background check integration | Not tracked |
| Offer letter e-signature | Email only, no e-sign |
| Careers page builder | Public application page is basic |
| Requisition approval workflow | Positions can be created without approval |
| Time-to-hire / cost-per-hire metrics | Basic recruitment report only |
| Candidate portal (self-serve status check) | Not present |

#### 7.2.5 Attendance Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| Geofencing / GPS check-in | Partially implemented (`GOOGLE_MAPS_API_KEY` used in `clockIn`) — needs frontend UI and configuration |
| Biometric integration | No fingerprint / facial recognition hooks |
| Overtime tracking and approval | Clock-in/out only, no overtime computation |
| Late arrival / early departure alerts | No threshold alerts |
| Work-from-home logging | No distinction from office attendance |
| Regularization requests (explain absence) | Not implemented |
| Holiday calendar integration | `public_holidays` collection exists but not enforced |
| Real-time attendance dashboard (live) | Team status exists but not real-time (no WebSocket) |

#### 7.2.6 Training Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| SCORM / xAPI support | External course content cannot be imported |
| Video/multimedia lesson content | Objectives checklist only |
| Quizzes and assessments | Not present |
| Course prerequisites | No sequential learning path |
| Learning paths / curricula | No bundles of courses |
| Compliance training tracking with mandatory deadlines | Basic due date only |
| Training budget tracking | Not in the module |
| Third-party LMS integration | Not present |

#### 7.2.7 Documents Module Gaps

| Missing Feature | Impact |
|----------------|--------|
| E-signature integration (DocuSign, HelloSign) | Not present |
| Document template generation | JD templates exist but no broader HR letter generation |
| Document expiry alerts | Contract expiry tracked in employee but not for documents |
| Document version control | Overwrite only, no history |
| Access control on documents | All HR can see all documents |
| Policy acknowledgement tracking | Not present |

#### 7.2.8 Communication Gaps

| Missing Feature | Impact |
|----------------|--------|
| Real-time messaging (WebSocket) | Messages are stored but no live push (no Socket.io) |
| Push notifications (browser/mobile) | Bell notifications are poll-based, not push |
| Email digests | No daily/weekly summary emails |
| Video/audio conferencing integration | No Zoom/Teams integration |
| Channel permissions | All communities are open |

---

### 7.3 Configuration Gaps

| Missing Config | Impact |
|---------------|--------|
| SMTP not fully configurable from UI | Must edit `.env` — email settings not in admin panel |
| No multi-language support for UI | `next-intl` routing exists but locale strings not user-configurable |
| Department management not a standalone module | Departments are free-text strings, not a managed collection |
| Location / branch management | No concept of physical office locations |
| Fiscal year configuration | Month-based payroll cycles only |
| Working days / week configuration | `attendance_settings` collection exists but limited |

---

## 8. Security Assessment

### 8.1 What Is In Place ✅

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt (rounds default ~10) |
| JWT authentication | Bearer token, 7-day expiry |
| MFA | TOTP via speakeasy |
| Rate limiting | Auth: 5/15min; Writes: 60/min per IP |
| MongoDB injection prevention | `express-mongo-sanitize` |
| Audit logging | All mutating requests logged with user, IP, body |
| Role-based access | `allowRoles` middleware per route |
| Scope enforcement | Staff cannot access other employees' data |
| Error masking | 500 errors return generic message, details logged server-side |
| File access control | `/uploads` requires JWT |

### 8.2 Security Gaps ❌

| Gap | Severity | Description |
|-----|----------|-------------|
| **JWT secret in `.env`** | Critical | `JWT_SECRET=school-erp-jwt-secret-key-2024-secure` — weak, predictable, must be rotated before production |
| **No HTTPS enforcement** | Critical | Backend runs HTTP on port 5000; no TLS configuration |
| **No CORS restriction** | High | `app.use(cors())` with no origin whitelist — accepts any origin |
| **No Content Security Policy** | High | No CSP headers set |
| **File upload validation** | High | Multer accepts files but no MIME type validation or virus scanning |
| **No input length limits** | Medium | Free-text fields (notes, descriptions) have no max length |
| **Refresh token storage** | Medium | Refresh token stored in plain text in DB — should be hashed |
| **No token rotation** | Medium | Refresh tokens are reused without rotation |
| **No account lockout** | Medium | Rate limiting is per-IP, not per-account — distributed brute force not blocked |
| **Password policy** | Medium | No minimum length, complexity, or history enforcement |
| **No RBAC for data fields** | Medium | All HR roles see all employee fields including salary |
| **No PII encryption at rest** | High | National ID, bank account numbers stored as plain text |
| **Missing security headers** | Medium | No Helmet.js — missing X-Frame-Options, HSTS, X-XSS-Protection |
| **Sensitive data in audit logs** | Medium | `req.body` is logged with `_redact()` but full coverage not verified |
| **No IP allowlisting for admin** | Low | Super admin accessible from any IP |
| **MFA recovery codes** | Medium | No backup codes generated if TOTP device is lost |
| **Session invalidation** | Medium | Token revocation only on explicit logout — no forced expiry on role change |

---

## 9. Performance & Scalability

### 9.1 Current Limitations

| Issue | Impact | Severity |
|-------|--------|----------|
| **No database indexes defined** | `initIndexes()` called but index definitions need verification — queries on `employeeId`, `cycleId`, `status`, `createdAt` will be slow at scale | High |
| **N+1 query patterns** | Several list endpoints fetch parent records in a `map()` loop (e.g. `enriched = await Promise.all(data.map(async c => findOne('employees'...)))`) | High |
| **No caching layer** | No Redis / in-memory cache — dashboard, reports, leaderboard recalculated on every request | Medium |
| **Single MongoDB instance** | No replica set, no read scaling, no automatic failover | High |
| **No connection pooling configuration** | Default MongoDB driver pool settings | Medium |
| **File storage on local disk** | `uploads/` on the server — won't work on multi-server or cloud deployments | High |
| **Payroll bulk generation** | `bulkGeneratePayroll` runs sequentially for all employees in the cycle — will timeout for large headcounts | Medium |
| **No pagination on some endpoints** | Some endpoints fetch up to 5000 records (CSV export, analytics) without streaming | Medium |
| **Real-time features are polling** | Notifications, messages, and team status are fetched on request, not pushed | Medium |
| **No job queue** | Long-running tasks (bulk payroll, bulk email, PDF generation) run synchronously in the request thread | Medium |
| **Frontend bundle size** | No lazy loading analysis documented; 44 pages with full import | Low |

### 9.2 Reliability Gaps

| Issue | Impact |
|-------|--------|
| No automated backups | Data loss risk — no backup schedule configured |
| No health check monitoring integration | `/health` endpoint exists but not wired to monitoring |
| No graceful shutdown handling | Process kill may lose in-flight writes |
| Email delivery failures are silent | Nodemailer errors are caught but not retried or alerted |
| Cron jobs have no dead-letter handling | Failed cron jobs don't alert |

---

## 10. Recommendations & Priority Roadmap

### 10.1 Immediate (Before Production Launch)

| # | Action | Why |
|---|--------|-----|
| 1 | **Rotate JWT secret** | Current secret is too predictable; generate a 256-bit random secret |
| 2 | **Add CORS origin whitelist** | Replace `cors()` with `cors({ origin: ['https://yourapp.com'] })` |
| 3 | **Add Helmet.js** | One-line fix for 8+ security headers |
| 4 | **Validate file upload MIME types** | Prevent malicious file uploads via Multer `fileFilter` |
| 5 | **Configure MongoDB indexes** | Ensure `initIndexes()` covers all high-traffic query patterns |
| 6 | **Fix payslip email delivery** | Employees should receive payslips by email, not just download |
| 7 | **Add password policy enforcement** | Minimum 8 chars, complexity, prevent reuse of last 5 passwords |
| 8 | **Deploy behind HTTPS** | TLS termination via Nginx or cloud load balancer |
| 9 | **Hash refresh tokens in DB** | Store `bcrypt(refreshToken)` instead of plain text |
| 10 | **Add Kenya Housing Levy** | Affordable Housing Levy is currently a statutory deduction in Kenya |

### 10.2 Short-Term (Next 4–8 Weeks)

| # | Module | Feature |
|---|--------|---------|
| 1 | Leave | Auto-accrual engine (cron job: add `X days/month` per policy) |
| 2 | Leave | Carry-forward rules with expiry dates |
| 3 | Payroll | P9 form generation for KRA compliance |
| 4 | Payroll | Email payslips to employees on cycle close |
| 5 | Payroll | Employer contribution breakdown in payslip |
| 6 | Attendance | Overtime calculation and approval |
| 7 | Performance | Employee self-assessment form |
| 8 | Performance | 360-degree peer feedback |
| 9 | Recruitment | Multi-step job requisition approval |
| 10 | Notifications | Browser push notifications (Web Push API) |
| 11 | Documents | Document expiry alerts (contracts, IDs) |
| 12 | Disciplinary | Warning letters and disciplinary records module |
| 13 | Infrastructure | Move file storage to S3-compatible object storage |
| 14 | Infrastructure | Add Redis caching for dashboard and reports |

### 10.3 Medium-Term (2–4 Months)

| # | Module | Feature |
|---|--------|---------|
| 1 | Benefits | Benefits enrollment module (health, pension, group life) |
| 2 | Succession | Succession planning with talent pool identification |
| 3 | Training | SCORM content support, quizzes, learning paths |
| 4 | Survey | Pulse survey and eNPS module |
| 5 | Payroll | Off-cycle / supplemental payroll run |
| 6 | Payroll | Loan amortization schedule with auto-deductions |
| 7 | Communication | WebSocket-based real-time messaging and notifications |
| 8 | Compliance | Digital policy acknowledgement with audit trail |
| 9 | Contract | Contract template generation and e-signature integration |
| 10 | Recruitment | Integration with LinkedIn/job boards for posting |
| 11 | Reports | Custom report builder (drag-and-drop field selection) |
| 12 | Multi-tenancy | Company isolation for SaaS deployment |

### 10.4 Architecture Improvements

| Improvement | Recommendation |
|-------------|---------------|
| **Queue system** | Add BullMQ (Redis-backed) for async processing of payroll, emails, PDF generation |
| **MongoDB replica set** | At minimum 3-node replica set for production reliability |
| **Object storage** | AWS S3 or MinIO for file uploads — decouple from server disk |
| **API versioning** | Add `/api/v1/` prefix to allow non-breaking future changes |
| **Database ODM** | Consider Mongoose for schema validation at the DB layer (currently none) |
| **Monitoring** | Integrate Sentry for error tracking; Datadog or Grafana for metrics |
| **CI/CD** | Add GitHub Actions pipeline with lint, test, and deploy stages |
| **Testing** | Zero automated tests currently — add Jest unit tests and Supertest API integration tests |
| **Environment management** | Use separate `.env.development`, `.env.staging`, `.env.production` — never commit secrets |
| **Docker** | Add `docker-compose.yml` for consistent dev environments |

### 10.5 Code Quality Recommendations

| Issue | Recommendation |
|-------|---------------|
| Inconsistent notification field names (`message` vs `body`, `read` vs `isRead`) | Fixed in July 2026 — enforce via a single `notifyUser` helper (done) |
| N+1 query patterns in list endpoints | Replace `map + findOne` with `$lookup` aggregations |
| No input validation beyond `validateRequiredFields` | Add Zod or Joi schema validation on all POST/PUT body fields |
| No automated tests | Start with API integration tests covering auth, leave, payroll cycles |
| Magic strings for roles/statuses | Extract to constants file (`ROLES.HR_MANAGER`, `LEAVE_STATUS.APPROVED`) |
| Direct `global.dbo.collection()` calls mixed with helper functions | Standardize to one pattern (either always use helpers or always use raw) |
| `JWT_SECRET` in `.env` committed to repo | Add `.env` to `.gitignore`, use `.env.example` with placeholder values |

---

*Documentation generated from codebase analysis as of 2026-07-02. Reflects the state of all implemented and audited modules.*

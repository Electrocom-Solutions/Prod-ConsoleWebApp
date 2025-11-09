# Electrocom ERP Console

## Overview
A comprehensive Next.js admin console frontend for the Electrocom ERP system. This is a full-featured admin panel for managing electrical contracting business operations including clients, AMCs, tenders, projects, tasks, employees, payroll, and more.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Form Management**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Date Utilities**: date-fns
- **Excel Processing**: xlsx (for import/export functionality)

## Project Structure
```
electrocom-console/
├── app/                          # Next.js App Router pages
│   ├── dashboard/                # Dashboard overview
│   ├── documents/                # Document management
│   ├── clients/                  # Client master
│   ├── amcs/                     # AMC management
│   ├── tenders/                  # Tender management
│   ├── projects/                 # Project management
│   ├── tasks/                    # Task tracking
│   ├── employees/                # Employee management
│   ├── contract-workers/         # Contract worker management
│   ├── attendance/               # Attendance tracking
│   ├── payroll/                  # Payroll management
│   ├── resources/                # Resource inventory
│   ├── task-resources/           # Task resource consumption
│   ├── reports/                  # Reports & analytics
│   ├── notifications/            # Notification center
│   ├── email-templates/          # Email template management
│   ├── bank-accounts/            # Bank account management
│   ├── holiday-calendar/         # Holiday calendar
│   └── settings/                 # System settings
├── components/
│   ├── layout/                   # Layout components (Sidebar, Header, DashboardLayout)
│   ├── providers/                # Context providers (ThemeProvider)
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility functions
└── types/                        # TypeScript type definitions

## Features

### Global Layout
- **Collapsible Sidebar**: 19 module links organized by category
- **Header**: Page title, breadcrumbs, global search, notification bell (with unread count), theme toggle, user avatar dropdown
- **Theme Support**: Light/dark mode with persistent storage
- **Responsive Design**: Mobile-optimized with collapsible sidebar

### Core Modules (Implemented)
1. **Dashboard**: Overview cards, quick actions, AMC expiry alerts, recent activity
2. **Documents**: Complete document management with upload, version control, preview, bulk operations, grid/table views, full state management
3. **Clients**: Comprehensive client management with:
   - Full CRUD operations with slide-over form modal
   - Search and multiple filters (city, state, AMC status, tags)
   - Grid and table view toggle
   - Bulk actions (Export CSV, Send Email, Delete)
   - Quick stats dashboard
   - Full state management and validation
4. **AMCs**: AMC management with status tracking, billing cycle support
5. **Tenders**: Tender pipeline with EMD tracking
6. **Projects**: Project listing with status badges
7. **Tasks, Employees, Contract Workers, Attendance, Payroll, Resources, Task Resources, Reports, Notifications, Email Templates, Bank Accounts, Holiday Calendar, Settings**: Placeholder pages ready for implementation

### UI Components
- Button (multiple variants and sizes)
- Card (with header, content, footer)
- Badge (status indicators)
- Input (form inputs)
- Label (form labels)
- Theme toggle (light/dark mode)

## Database Schema Reference
The frontend is designed to match the database schema provided in the requirements. All data structures align with the Django backend schema including:
- Client, AMC, AMCBilling, Tender, TenderDeposit
- Employee, ContractWorker, Project, Task, TaskResource
- Attendance, PayrollRecord, Resource
- Notification, EmailTemplate, DocumentTemplate, BankAccount, HolidayCalendar

## Current Status
- ✅ Project setup with Next.js 15, TypeScript, and Tailwind CSS
- ✅ Global layout with collapsible sidebar and header
- ✅ Dark theme as default with pre-hydration script (no flash, no hydration errors)
- ✅ Theme provider with light/dark mode toggle
- ✅ Reusable UI components
- ✅ Dashboard with overview cards and quick actions
- ✅ **Document Management**: Complete with CRUD, version control, bulk operations, PDF preview, full dark theme, category filters, search, date range
- ✅ **Client Management**: Comprehensive with CRUD, search, multi-filters, grid/table views, bulk actions, full dark theme
- ✅ **AMC Module**: Data tables with billing status toggle and filters
- ✅ **Tender Module**: Complete with EMD tracking, Security Deposits (SD1/SD2), DD details, auto-calculation guards, financial reorganization
- ✅ **Task Module**: Status and priority filters, CSV export
- ✅ **Project Module**: Client dropdown integration
- ✅ **Contract Workers**: Complete contract worker management with:
  - Designation dropdown (Electrician, Helper, Fitter, Technician, Supervisor) instead of skill text field
  - Monthly Salary field instead of daily rate
  - Project dropdown for assignment (from mockProjects array)
  - UAN Number and Aadhar Card Number fields
  - Bank details (Account Number, IFSC Code, Bank Name, Branch Name)
  - Status tracking (Available, Assigned, Inactive)
  - Bulk import via Excel with updated field names
  - Stats: Total Workers, Active, Assigned, Total of All Salaries
  - Full dark theme support across all form labels
  - CRUD operations with slide-over modal
  - Search and filtering capabilities
- ✅ **Attendance Module**: Complete employee attendance management with:
  - Employees only (not contract workers)
  - Approval workflow: Pending → Approved/Rejected with reason
  - Date filter with current date default, "Today" and "Clear" buttons
  - Month navigation for viewing historical records
  - Search by employee name
  - Approval status filter (All, Pending, Approved, Rejected)
  - List and Calendar view toggle
  - Manual attendance marking with employee dropdown
  - Replace logic: if record exists for employee+date, it replaces
  - Edit button for each record (owner can modify any attendance)
  - Bulk selection with checkboxes for employees
  - Bulk "Mark as Present" action with date selection
  - BulkMarkPresentModal creates records with "Pending" status
  - Stats: Working Days (26 default), Employees Present, Absent, On Leave, Pending Approval
  - Export Report modal with month/year selection
  - CSV export with all attendance data
  - Full dark theme and SweetAlert2 integration
  - Proper approval metadata (only set when actually approved)
- ✅ **Payment Tracking Module**: Complete contract worker payment tracking with:
  - Month and year filters (defaults to current month/year)
  - Upload Excel sheet feature for bulk payment records
  - Excel parsing for worker data (place of work, name, mobile, salary, bank details)
  - Bulk selection with checkboxes
  - Export selected workers to Excel
  - Bulk "Mark as Paid" with date picker and payment mode selection
  - Payment completion date, payment mode, and payment status columns
  - Full dark theme with xlsx library integration
- ✅ **Payroll Module**: Streamlined employee payroll management with:
  - Month and year filters (defaults to current month/year)
  - Employees only (contract workers excluded)
  - Simplified columns: Employee, Net Amount, Status, Payment Date, Payment Mode
  - Actions: Eye icon (view breakdown) and Mark as Paid button
  - Simplified payslip showing only: Base Salary - Leave Deduction = Net Payable
  - Mark as Paid modal with payment date and payment mode only
  - Bulk selection and bulk Mark as Paid functionality
  - CSV export with relevant columns
  - Full dark theme support
- ✅ All 20 module pages created with 30 feature enhancements across 9 core modules
- ✅ Responsive design ready
- ✅ SweetAlert2 dark theme integration for all alerts and confirmations

## Next Steps
1. Integrate Django REST API endpoints for all CRUD operations
2. Implement detailed forms for creating/editing records
3. Add advanced filtering, sorting, and export functionality
4. Create data visualizations and charts for reports
5. Implement real-time notifications using WebSocket
6. Add authentication with role-based access control
7. Complete all placeholder modules with full functionality

## Development
- **Dev Server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Start Production**: `npm start`

## Design Tokens
- **Theme**: Dark mode is default
- **Primary Accent**: sky-500 (for interactive elements, buttons, links)
- **Card Style**: 
  - Light: White background with `rounded-lg border border-gray-200 shadow-sm`, hover effect with `hover:shadow-md`
  - Dark: `dark:bg-gray-800 dark:border-gray-700` with `dark:hover:shadow-md`
- **Icon Containers**: 
  - Light: `bg-gray-50 border border-gray-200` with `text-gray-500`
  - Dark: `dark:bg-gray-700 dark:border-gray-700` with `dark:text-gray-400`
- **Category Badges**: 
  - Light: `bg-gray-100 text-gray-700`
  - Dark: `dark:bg-gray-700 dark:text-gray-300`
- **Background**: 
  - Light: white cards on gray background
  - Dark: gray-800 cards on gray-900 background (default)
- **Typography**: System fonts with clear hierarchy, use `dark:text-white` and `dark:text-gray-400` variants
- **Color Philosophy**: Clean, minimal aesthetic with proper dark theme support across all components. All new pages MUST include dark theme variants using Tailwind's dark: prefix

## Technical Implementation Notes

### Dark Theme Default
The dark theme is applied as default through a multi-layered approach to prevent hydration mismatches:
1. **Static SSR**: HTML element has `className="dark"` for server-side rendering
2. **Pre-hydration Script**: Inline script in layout reads localStorage and applies theme class before React hydrates
3. **Theme Provider**: Client-side provider defaults to "dark" and synchronizes with localStorage
4. **No Flash**: Users never see a light theme flash when loading the app

This implementation eliminates hydration errors and ensures consistent dark mode across page loads.

## Notes
- All forms and data structures match the provided database schema
- Frontend uses mock data and is ready for Django API integration
- Theme preference persists in localStorage
- Mobile navigation collapses sidebar to icons

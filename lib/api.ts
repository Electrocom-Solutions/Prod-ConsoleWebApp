/**
 * API Client for Django REST Framework
 * Handles authentication, CSRF tokens, and session cookies
 */

// Get API URL from environment variable or use default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log API URL for debugging (in both development and production if needed)
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Client] Base URL:', API_BASE_URL);
  }
  // In production, log if API URL is still localhost (indicates misconfiguration)
  if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
    console.error('[API Client] WARNING: Using localhost URL in production! Check NEXT_PUBLIC_API_URL environment variable.');
  }
}

export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
    is_staff: boolean;
  };
  session_expiry?: string;
}

export interface ExpiringAMC {
  client_name: string;
  amc_expiry_date: string; // ISO date string
  expiry_count_days: number;
  amc_number: string;
}

export interface RecentActivity {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  created_at: string; // ISO datetime string
  created_by: number | null;
  created_by_username: string | null;
}

export interface DashboardStatsResponse {
  total_clients: number;
  active_amcs_count: number;
  active_tenders_count: number;
  in_progress_tasks_count: number;
  expiring_amcs: ExpiringAMC[];
  recent_activities: RecentActivity[];
}

/**
 * Client Management Interfaces
 */

export interface ClientStatisticsResponse {
  total_clients: number;
  active_amcs_count: number;
  open_projects_count: number;
  outstanding_amount: number;
}

export interface BackendClientListItem {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  has_active_amc: boolean;
  city: string | null;
  state: string | null;
  primary_contact_name: string | null;
  created_at: string;
}

export interface BackendClientListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendClientListItem[];
}

export interface BackendClientDetail {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  photo?: string;
  photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  aadhar_number?: string;
  pan_number?: string;
  aadhar_card_url?: string;
  pan_card_url?: string;
  primary_contact_name?: string;
  notes?: string;
  profile?: number;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

/**
 * AMC Management Interfaces
 */

export interface AMCStatisticsResponse {
  total_amcs: number;
  active_amcs: number;
  expiring_soon: number;
  pending_bills: number;
}

export interface AMCExpiringCountResponse {
  count: number;
}

export interface BackendAMCListItem {
  id: number;
  amc_number: string;
  client: number;
  client_id: number;
  client_name: string;
  amount: string; // Decimal as string
  start_date: string;
  end_date: string;
  status: 'Active' | 'Expired' | 'Canceled';
  billing_cycle: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
  days_until_expiry: number | null;
  created_at: string;
}

export interface BackendAMCListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendAMCListItem[];
}

export interface BackendAMCDetail {
  id: number;
  amc_number: string;
  client: number;
  client_id: number;
  client_name: string;
  amount: string; // Decimal as string
  start_date: string;
  end_date: string;
  status: 'Active' | 'Expired' | 'Canceled';
  billing_cycle: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
  notes?: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  billings: BackendAMCBilling[];
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface BackendAMCBilling {
  id: number;
  bill_number: string;
  period: string;
  amount: string; // Decimal as string
  status: 'Paid' | 'Pending';
  payment_details?: {
    payment_date: string;
    payment_mode: string;
  };
  bill_date: string;
  period_from: string;
  period_to: string;
  paid: boolean;
  payment_date?: string;
  payment_mode?: 'Cash' | 'Cheque' | 'Bank Transfer' | 'UPI';
  notes?: string;
}

/**
 * Tender Management Interfaces
 */

export interface TenderStatisticsResponse {
  total_tenders: number;
  tenders_filed: number;
  tenders_awarded: number;
  total_value_awarded: number;
  pending_emds: number;
  pending_emd_amount: number;
}

export interface BackendTenderDeposit {
  id: number;
  dd_date: string;
  dd_number: string;
  dd_amount: string; // Decimal as string
  dd_beneficiary_name: string;
  bank_name: string;
  deposit_type: 'EMD_Security1' | 'EMD_Security2';
  is_refunded: boolean;
  refund_date?: string;
}

export interface BackendTenderDocument {
  id: number;
  file: string; // File path
  file_url: string; // Full URL
  file_name: string;
  created_at: string;
  created_by?: number;
  created_by_username?: string;
}

export interface BackendTenderActivity {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  created_at: string;
  created_by?: number;
  created_by_username?: string;
}

export interface BackendTenderListItem {
  id: number;
  name: string;
  reference_number: string;
  firm?: number | null;
  firm_name?: string | null;
  filed_date?: string;
  start_date: string;
  end_date: string;
  estimated_value: string; // Decimal as string
  status: 'Draft' | 'Filed' | 'Awarded' | 'Lost' | 'Closed';
  emd_collected: boolean;
  emd_collected_date?: string;
  total_emd_cost: number;
  security_deposit_1: number;
  security_deposit_2: number;
  pending_emd_amount: number;
  has_pending_emd: boolean;
  created_at: string;
}

export interface BackendTenderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTenderListItem[];
}

export interface BackendTenderDetail {
  id: number;
  name: string;
  reference_number: string;
  description?: string;
  firm?: number | null;
  filed_date?: string;
  start_date: string;
  end_date: string;
  estimated_value: string; // Decimal as string
  status: 'Draft' | 'Filed' | 'Awarded' | 'Lost' | 'Closed';
  emd_collected: boolean;
  emd_collected_date?: string;
  emd_collected_by?: number;
  total_emd_cost: number;
  security_deposit_1: number;
  security_deposit_2: number;
  pending_emd_amount: number;
  deposits: BackendTenderDeposit[];
  documents: BackendTenderDocument[];
  activity_feed: BackendTenderActivity[];
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

/**
 * Project Management Interfaces
 */

export interface ProjectStatisticsResponse {
  total_projects: number;
  planned_projects: number;
  in_progress_projects: number;
  completed_projects: number;
  on_hold_projects: number;
  canceled_projects: number;
}

export interface BackendProjectListItem {
  id: number;
  name: string;
  tender: number;
  tender_name: string;
  start_date: string;
  end_date: string;
  status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
  created_at: string;
}

export interface BackendProjectListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProjectListItem[];
}

export interface BackendProjectDetail {
  id: number;
  name: string;
  description?: string;
  tender: number;
  tender_name: string;
  start_date: string;
  end_date: string;
  status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

/**
 * Task Management Interfaces
 */

export interface TaskStatisticsResponse {
  total_tasks: number;
  in_progress: number;
  pending_approval: number;
  approved_tasks: number;
  total_resource_cost: number;
}

export interface BackendTaskListItem {
  id: number;
  task_name: string;
  task_date: string;
  location: string;
  time_taken_minutes: number;
  time_taken_hours: number;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Canceled';
  approval_status: 'pending' | 'approved' | 'rejected';
  employee: number | null;
  employee_name: string | null;
  project: number;
  project_name: string;
  tender_name: string;
  created_at: string;
}

export interface BackendTaskListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTaskListItem[];
}

export interface BackendTaskResource {
  id: number;
  resource_name: string;
  quantity: string; // Decimal as string
  unit_cost: string; // Decimal as string
  total_cost: string; // Decimal as string
  created_at: string;
}

export interface BackendTaskAttachment {
  id: number;
  file: string; // File path
  file_url: string; // Full URL
  file_name: string;
  notes?: string;
  created_at: string;
  created_by?: number;
  created_by_username?: string;
}

export interface BackendTaskActivity {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  created_at: string;
  created_by?: number;
  created_by_username?: string;
}

export interface BackendTaskDetail {
  id: number;
  task_name: string;
  task_description?: string;
  task_date: string;
  location: string;
  time_taken_minutes: number;
  time_taken_hours: number;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Canceled';
  approval_status: 'pending' | 'approved' | 'rejected';
  internal_notes?: string;
  employee: number | null;
  employee_name: string | null;
  project: number;
  project_name: string;
  tender_name: string;
  attachments: BackendTaskAttachment[];
  resources: BackendTaskResource[];
  activity_feed: BackendTaskActivity[];
  created_at: string;
  updated_at: string;
  created_by?: number;
  created_by_username?: string;
  updated_by?: number;
  updated_by_username?: string;
}

// Document Management Interfaces
export interface DocumentTemplateVersion {
  id: number;
  version_number: number;
  file: string; // File path
  file_url: string; // Full URL
  file_type: 'pdf' | 'docx';
  is_published: boolean;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface DocumentTemplate {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  firm: number | null;
  firm_name: string | null;
  versions: DocumentTemplateVersion[];
  published_version: DocumentTemplateVersion | null;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface DocumentTemplateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentTemplate[];
}

export interface DocumentUploadResponse {
  message: string;
  template: DocumentTemplate;
  version: DocumentTemplateVersion;
}

export interface BackendFirmListItem {
  id: number;
  firm_name: string;
  firm_type: 'Proprietorship' | 'Partnership' | 'Pvt Ltd' | 'LLP' | null;
  type_display: string;
  firm_owner_profile: number | null;
  firm_owner_name: string | null;
  official_email: string | null;
  official_mobile_number: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface FirmListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendFirmListItem[];
}

export interface FirmDetail {
  id: number;
  firm_name: string;
  firm_type: 'Proprietorship' | 'Partnership' | 'Pvt Ltd' | 'LLP' | null;
  type_display: string;
  firm_owner_profile: number | null;
  firm_owner_name: string | null;
  firm_owner_email: string | null;
  firm_owner_phone: string | null;
  official_email: string | null;
  official_mobile_number: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
  updated_by: number | null;
  updated_by_username: string | null;
}

export interface FirmCreateData {
  firm_name: string;
  firm_type?: 'Proprietorship' | 'Partnership' | 'Pvt Ltd' | 'LLP' | null;
  firm_owner_profile?: number | null;
  official_email?: string | null;
  official_mobile_number?: string | null;
  address?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
}

// Legacy Firm interface for backward compatibility
export interface Firm {
  id: number;
  firm_name: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Profile Management Interfaces
 */

export interface CurrentUserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  photo: string | null;
  photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;
  aadhar_number: string | null;
  pan_number: string | null;
  aadhar_card: string | null;
  aadhar_card_url: string | null;
  pan_card: string | null;
  pan_card_url: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurrentUserProfileUpdateData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  photo?: File | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pin_code?: string | null;
  country?: string | null;
  aadhar_number?: string | null;
  pan_number?: string | null;
  aadhar_card?: File | null;
  pan_card?: File | null;
  phone_number?: string | null;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export interface ProfileCreateData {
  first_name: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  photo?: File;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  aadhar_number?: string;
  pan_number?: string;
  aadhar_card?: File;
  pan_card?: File;
}

export interface BackendProfileListItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  created_at: string;
}

export interface ProfileListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProfileListItem[];
}

export interface BulkDownloadRequest {
  version_ids?: number[];
  template_ids?: number[];
}

// Employee Management Interfaces
export interface EmployeeStatisticsResponse {
  total_employees: number;
  total_present: number;
  total_absent: number;
  monthly_payroll: number;
}

export interface BackendEmployeeListItem {
  id: number;
  employee_code: string;
  profile_id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  photo_url: string | null;
  designation: 'Technician' | 'Field Staff' | 'Computer Operator' | 'Other';
  availability_status: string | null; // 'Present' or 'Absent' or null
  created_at: string;
}

export interface EmployeeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendEmployeeListItem[];
}

export interface EmployeeDetail {
  id: number;
  employee_code: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;
  aadhar_number: string | null;
  pan_number: string | null;
  aadhar_card_url: string | null;
  pan_card_url: string | null;
  designation: 'Technician' | 'Field Staff' | 'Computer Operator' | 'Other';
  joining_date: string;
  monthly_salary: string; // Decimal as string
  profile: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface EmployeeCreateData {
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
  designation: 'Technician' | 'Field Staff' | 'Computer Operator' | 'Other';
  joining_date: string; // YYYY-MM-DD
  monthly_salary: number;
  phone_number?: string;
  photo?: File;
  date_of_birth?: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  aadhar_number?: string;
  pan_number?: string;
  aadhar_card?: File;
  pan_card?: File;
}

// Contract Worker Management Interfaces
export interface ContractWorkerStatisticsResponse {
  total_workers: number;
  total_available: number;
  total_assigned: number;
  total_monthly_payroll: number;
}

export interface BackendContractWorkerListItem {
  id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  worker_type: 'Unskilled' | 'Semi-Skilled' | 'Skilled';
  availability_status: string | null; // 'assigned' or 'available'
  project: number | null;
  project_name: string | null;
  monthly_salary: string; // Decimal as string
  department: string | null;
  created_at: string;
}

export interface ContractWorkerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendContractWorkerListItem[];
}

export interface ContractWorkerDetail {
  id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;
  worker_type: 'Unskilled' | 'Semi-Skilled' | 'Skilled';
  monthly_salary: string; // Decimal as string
  aadhar_no: string;
  uan_number: string | null;
  department: string | null;
  project: number | null;
  project_name: string | null;
  bank_account: {
    id: number;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
  } | null;
  profile: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface ContractWorkerCreateData {
  first_name: string;
  last_name: string;
  email: string;
  worker_type: 'Unskilled' | 'Semi-Skilled' | 'Skilled';
  monthly_salary: number;
  aadhar_no: string;
  phone_number?: string;
  date_of_birth?: string; // YYYY-MM-DD
  gender?: 'male' | 'female';
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  uan_number?: string;
  department?: string;
  project?: number;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_branch?: string;
}

export interface BulkUploadContractWorkerResponse {
  success_count: number;
  failed_count: number;
  errors: string[];
}

/**
 * Attendance Management Interfaces
 */

export interface AttendanceStatisticsResponse {
  total_working_days: number;
  total_employees_present: number;
  total_employees_absent: number;
  total_pending_approvals: number;
}

export interface BackendAttendanceListItem {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  attendance_date: string;
  attendance_status: 'Present' | 'Absent' | 'Half-Day' | 'Leave';
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface AttendanceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendAttendanceListItem[];
}

export interface AttendanceDetail {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  attendance_date: string;
  attendance_status: 'Present' | 'Absent' | 'Half-Day' | 'Leave';
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  rejection_reason: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  check_in_location_latitude: string | null;
  check_in_location_longitude: string | null;
  check_out_location_latitude: string | null;
  check_out_location_longitude: string | null;
  check_in_selfie: string | null;
  check_in_selfie_url: string | null;
  check_out_selfie: string | null;
  check_out_selfie_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface AttendanceCreateData {
  employee: number;
  attendance_date: string; // YYYY-MM-DD
  attendance_status: 'Present' | 'Absent' | 'Half-Day' | 'Leave';
  check_in_time?: string; // YYYY-MM-DD HH:MM:SS
  check_out_time?: string; // YYYY-MM-DD HH:MM:SS
  notes?: string;
}

export interface BulkApproveAttendanceRequest {
  attendance_ids: number[];
  approval_status: 'Approved' | 'Rejected';
  rejection_reason?: string;
}

export interface BulkApproveAttendanceResponse {
  updated_count: number;
  skipped_count: number;
  errors: string[] | null;
}

/**
 * Payroll Management Interfaces
 */

export interface PayrollStatisticsResponse {
  total_payroll: number;
  employees_count: number;
  total_payment_pending: number;
  total_payment_paid: number;
}

export interface BackendPayrollListItem {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  payroll_status: 'Paid' | 'Pending';
  period_from: string;
  period_to: string;
  working_days: number;
  days_present: number;
  net_amount: string;
  payment_date: string | null;
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | null;
  created_at: string;
}

export interface PayrollListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendPayrollListItem[];
}

export interface PayrollDetail {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  payroll_status: 'Paid' | 'Pending';
  period_from: string;
  period_to: string;
  working_days: number;
  days_present: number;
  net_amount: string;
  payment_date: string | null;
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | null;
  bank_transaction_reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface PayrollCreateData {
  employee: number;
  payroll_status: 'Paid' | 'Pending';
  period_from: string; // YYYY-MM-DD
  period_to: string; // YYYY-MM-DD
  working_days: number;
  days_present: number;
  net_amount: number;
  payment_date?: string; // YYYY-MM-DD (required if payroll_status is "Paid")
  payment_mode?: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS'; // required if payroll_status is "Paid"
  bank_transaction_reference_number?: string;
  notes?: string;
}

export interface PayrollMarkPaidRequest {
  payment_date: string; // YYYY-MM-DD
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS';
  bank_transaction_reference_number?: string;
}

export interface BulkMarkPayrollPaidRequest {
  payroll_ids: number[];
  payment_date: string; // YYYY-MM-DD
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS';
  bank_transaction_reference_number?: string;
}

export interface BulkMarkPayrollPaidResponse {
  updated_count: number;
  skipped_count: number;
  errors: string[] | null;
}

/**
 * Payment Tracker (Contract Worker Payment Tracking) Interfaces
 */

export interface PaymentTrackerStatisticsResponse {
  total_payable: number;
  pending_payment_count: number;
  pending_payment_amount: number;
  total_paid: number;
}

export interface BackendPaymentTrackerListItem {
  id: number;
  worker_name: string;
  mobile_number: string;
  place_of_work: string;
  net_salary: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  payment_status: 'Paid' | 'Pending';
  payment_date: string | null;
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | null;
  sheet_period: string; // YYYY-MM-DD (first day of month)
  created_at: string;
}

export interface PaymentTrackerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendPaymentTrackerListItem[];
}

export interface PaymentTrackerDetail {
  id: number;
  worker_name: string;
  mobile_number: string;
  place_of_work: string;
  net_salary: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  payment_status: 'Paid' | 'Pending';
  payment_date: string | null;
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | null;
  sheet_period: string;
  sheet_attachment: string | null;
  sheet_attachment_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface PaymentTrackerUploadRequest {
  month: number; // 1-12
  year: number; // YYYY
  excel_file: File;
}

export interface PaymentTrackerUploadResponse {
  message: string;
  records_created: number;
  records_replaced: number;
  errors: string[] | null;
}

export interface PaymentTrackerMarkPaidRequest {
  payment_date: string; // YYYY-MM-DD
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS';
}

export interface BulkMarkPaymentTrackerPaidRequest {
  payment_ids: number[];
  payment_date: string; // YYYY-MM-DD
  payment_mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT/RTGS';
}

export interface BulkMarkPaymentTrackerPaidResponse {
  updated_count: number;
  skipped_count: number;
  errors: string[] | null;
}

/**
 * Stock Management (Inventory) Interfaces
 */

export interface StockStatisticsResponse {
  total_resources: number;
  total_inventory_value: number;
  low_stock_items: number;
}

export interface BackendStockListItem {
  id: number;
  name: string;
  unit_of_measure: string;
  quantity: string;
  price: string;
  min_threshold: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendStockListItem[];
}

export interface StockDetail {
  id: number;
  name: string;
  unit_of_measure: string;
  quantity: string;
  price: string;
  min_threshold: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface StockCreateData {
  name: string;
  unit_of_measure: string;
  quantity: number;
  price: number;
  min_threshold?: number;
  description?: string;
}

/**
 * Task Resources Dashboard Interfaces
 */

export interface TaskResourcesStatisticsResponse {
  total_tasks: number;
  total_resources: number;
  total_cost: number;
  avg_cost_per_task: number;
}

export interface BackendTaskResourceBreakdown {
  id: number;
  resource_name: string;
  quantity: string;
  unit_cost: string;
  total_cost: string;
}

export interface BackendTaskResourceListItem {
  id: number;
  task_name: string;
  employee: number;
  employee_name: string | null;
  project: number;
  project_name: string;
  tender_name: string | null;
  task_date: string;
  resources_count: number;
  grand_total: number;
  resource_breakdown: BackendTaskResourceBreakdown[];
}

export interface TaskResourcesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTaskResourceListItem[];
}

export interface TaskResourceDetail {
  id: number;
  task_name: string;
  employee: number;
  employee_name: string | null;
  project: number;
  project_name: string;
  tender_name: string | null;
  task_date: string;
  resources_count: number;
  grand_total: number;
  resource_breakdown: BackendTaskResourceBreakdown[];
}

/**
 * Notifications Interfaces
 */

export interface NotificationStatisticsResponse {
  total_notifications: number;
  unread_count: number;
  read_count: number;
}

export interface BackendNotificationListItem {
  id: number;
  title: string;
  message: string;
  type: string;
  type_display: string;
  channel: string;
  channel_display: string;
  is_read: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count?: number | null;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
  recipient: number | null;
  recipient_username: string | null;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendNotificationListItem[];
}

export interface NotificationDetail {
  id: number;
  recipient: number;
  recipient_username: string;
  title: string;
  message: string;
  type: string;
  type_display: string;
  channel: string;
  channel_display: string;
  is_read: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
  updated_by: number | null;
}

export interface NotificationCreateData {
  title: string;
  message: string;
  type: string;
  channel?: string;
  scheduled_at?: string | null;
}

export interface BulkMarkReadRequest {
  notification_ids?: number[];
  mark_all?: boolean;
}

export interface BulkMarkReadResponse {
  marked_count: number;
  skipped_count: number;
  errors: string[] | null;
}

/**
 * Email Templates Interfaces
 */

export interface BackendEmailTemplateListItem {
  id: number;
  name: string;
  subject: string;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface EmailTemplateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendEmailTemplateListItem[];
}

export interface EmailTemplateDetail {
  id: number;
  name: string;
  subject: string;
  body: string;
  placeholders: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
  updated_by: number | null;
  updated_by_username: string | null;
}

export interface EmailTemplateCreateData {
  name: string;
  subject: string;
  body: string;
  placeholders?: string | null;
}

export interface EmailTemplateSendRequest {
  recipients: string;
  scheduled_at?: string | null;
  placeholder_values?: Record<string, any>;
}

export interface EmailTemplateSendResponse {
  status: string;
  message: string;
  recipients_count: number;
  scheduled_at?: string | null;
  sent_at?: string | null;
  errors?: string[];
  warning?: string;
}

/**
 * Bank Accounts Interfaces
 */

export interface BackendBankAccountListItem {
  id: number;
  profile_id: number;
  profile_name: string | null;
  account_holder_name: string | null;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string | null;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface BankAccountListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendBankAccountListItem[];
}

export interface BankAccountDetail {
  id: number;
  profile_id: number;
  profile_name: string | null;
  account_holder_name: string | null;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
  updated_by: number | null;
  updated_by_username: string | null;
}

export interface BankAccountCreateData {
  profile_id: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch?: string | null;
}

/**
 * Holiday Calendar Interfaces
 */

export interface HolidayCalendarStatisticsResponse {
  total_holidays: number;
  public_holidays: number;
  optional_holidays: number;
}

export interface BackendHolidayCalendarListItem {
  id: number;
  name: string;
  date: string;
  type: 'National' | 'Festival' | 'Company';
  type_display: string;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface HolidayCalendarListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendHolidayCalendarListItem[];
}

export interface HolidayCalendarDetail {
  id: number;
  name: string;
  date: string;
  type: 'National' | 'Festival' | 'Company';
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
  updated_by: number | null;
  updated_by_username: string | null;
}

export interface HolidayCalendarCreateData {
  name: string;
  date: string; // YYYY-MM-DD
  type: 'National' | 'Festival' | 'Company';
}

/**
 * Learning / Training Videos Interfaces
 */

export interface BackendTrainingVideoListItem {
  id: number;
  title: string;
  youtube_video_id: string;
  rank: number;
  created_at: string;
}

export interface BackendTrainingVideoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTrainingVideoListItem[];
}

export interface BackendTrainingVideoDetail {
  id: number;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  rank: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface TrainingVideoCreateData {
  title: string;
  youtube_url: string;
  rank?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get CSRF token from cookies
   * Django automatically sets csrftoken cookie on first request
   */
  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') {
      // Server-side rendering - no cookies available
      return null;
    }
    
    try {
      // Get CSRF token from cookies
      // Django sets it as 'csrftoken' (lowercase) with domain '.electrocomsolutions.in' in production
      // document.cookie only shows cookies accessible to the current page's domain
      // If cookie is set with domain=.electrocomsolutions.in, it should be readable from console.electrocomsolutions.in
      
      const cookieString = document.cookie;
      
      // If no cookies at all, return null
      if (!cookieString || cookieString.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[API] No cookies found in document.cookie');
        }
        return null;
      }
      
      const cookies = cookieString.split(';');
      
      // Try to find csrftoken cookie (case-insensitive search)
      // Django sets it as 'csrftoken' (lowercase), but we search case-insensitively
      let csrfCookie = cookies.find(cookie => {
        const trimmed = cookie.trim();
        return trimmed.toLowerCase().startsWith('csrftoken=');
      });
      
      if (csrfCookie) {
        // Extract the token value
        const trimmed = csrfCookie.trim();
        const equalIndex = trimmed.indexOf('=');
        
        if (equalIndex !== -1 && equalIndex < trimmed.length - 1) {
          // Get everything after the first '=' sign
          // This handles tokens that might contain '=' characters
          const tokenValue = trimmed.substring(equalIndex + 1).trim();
          
          // Decode URI component in case the token is URL-encoded
          let token: string;
          try {
            token = decodeURIComponent(tokenValue);
          } catch (e) {
            // If decoding fails, use the raw value
            token = tokenValue;
          }
          
          if (token && token.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              // Log token info for debugging (first 10 chars only for security)
              console.debug('[API] Found CSRF token, length:', token.length, 'first 10 chars:', token.substring(0, 10));
            }
            return token;
          }
        }
      }
      
      // Debug: Log available cookies (names only) if token not found
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API] CSRF token not found in cookies');
        const cookieNames = cookies.map(c => c.trim().split('=')[0]).filter(Boolean);
        console.warn('[API] Available cookie names:', cookieNames);
        console.warn('[API] Current domain:', window.location.hostname);
        console.warn('[API] Current protocol:', window.location.protocol);
        console.warn('[API] Cookie string length:', cookieString.length);
        console.warn('[API] Expected cookie domain: .electrocomsolutions.in');
        console.warn('[API] Expected cookie name: csrftoken');
        console.warn('[API] Full cookie string (first 200 chars):', cookieString.substring(0, 200));
      }
      
      return null;
    } catch (error) {
      console.error('[API] Error getting CSRF token:', error);
      return null;
    }
  }
  
  /**
   * Extract CSRF token from Set-Cookie header
   */
  private extractCsrfTokenFromHeaders(response: Response): string | null {
    // Note: Browsers don't allow reading Set-Cookie headers from JavaScript for security reasons
    // We have to rely on the browser setting the cookie and then reading it from document.cookie
    // However, we can check if the response indicates the cookie should be set
    return null;
  }

  /**
   * Ensure CSRF token is available by making a request if needed
   * This will ALWAYS fetch a fresh token to ensure it matches the current session
   */
  private async ensureCsrfToken(): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }
    
    // Always fetch a fresh token to ensure it matches the current session
    // This is critical after login when a new session is created
    try {
      // CRITICAL: Make a GET request with credentials: 'include' to receive cookies
      // Django will set the CSRF token cookie in the Set-Cookie header
      // The cookie will be set with domain=.electrocomsolutions.in in production
      // This allows the cookie to be accessible from both console.electrocomsolutions.in and consoleapi.electrocomsolutions.in
      
      // Try /api/user/ first (requires auth) - this ensures we get a token for the current session
      const response = await fetch(`${this.baseURL}/api/user/`, {
        method: 'GET',
        credentials: 'include', // CRITICAL: Required to receive cookies
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      }).catch(async () => {
        // If /api/user/ fails (401/403), try the API root
        // Even unauthenticated requests should set CSRF cookie
        return fetch(`${this.baseURL}/api/`, {
          method: 'GET',
          credentials: 'include', // CRITICAL: Required to receive cookies
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
        });
      });
      
      // Check response status - even 401/403/404 should set CSRF cookie
      // Django sets CSRF cookie on any request, regardless of auth status
      if (response && (response.status === 200 || response.status === 401 || response.status === 403 || response.status === 404)) {
        // Django sets the CSRF token cookie in the Set-Cookie header
        // The browser automatically processes this and stores it
        // CRITICAL: In production with cross-subdomain cookies (.electrocomsolutions.in),
        // the cookie might take longer to be available in document.cookie
        // We need to wait longer and retry more times
        
        // Initial wait for browser to process the Set-Cookie header
        // In production with cross-subdomain, this can take 500-1000ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try multiple times to read the token (cookie might not be immediately available)
        // In production with cross-subdomain cookies, it might take longer
        let token: string | null = null;
        const maxRetries = 10; // Increased from 5 to 10 for production reliability
        for (let i = 0; i < maxRetries; i++) {
          token = this.getCsrfToken();
          if (token) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[API] CSRF token obtained on attempt', i + 1, 'length:', token.length);
            }
            break;
          }
          // Wait progressively longer between retries (100ms, 200ms, 300ms, etc.)
          // Total max wait: 500ms initial + 100+200+...+1000ms = ~6 seconds
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
        
        if (process.env.NODE_ENV === 'development') {
          if (token) {
            console.debug('[API] CSRF token successfully obtained, length:', token.length);
          } else {
            console.warn('[API] CSRF token not found after fetch');
            console.warn('[API] Response status:', response.status);
            console.warn('[API] Response URL:', response.url);
            // Only log cookie names, not values
            if (typeof document !== 'undefined') {
              const cookieString = document.cookie;
              if (cookieString) {
                const cookieNames = cookieString.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
                console.warn('[API] Available cookie names:', cookieNames);
                console.warn('[API] Cookie string length:', cookieString.length);
              } else {
                console.warn('[API] No cookies found in document.cookie');
              }
              console.warn('[API] Current domain:', window.location.hostname);
              console.warn('[API] API base URL:', this.baseURL);
            }
            console.warn('[API] Possible causes:');
            console.warn('[API] 1. Cookie domain mismatch - check CSRF_COOKIE_DOMAIN in Django (should be .electrocomsolutions.in)');
            console.warn('[API]    Current frontend domain:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
            console.warn('[API]    Expected cookie domain: .electrocomsolutions.in');
            console.warn('[API] 2. Cookie path mismatch - check CSRF_COOKIE_PATH in Django (should be /)');
            console.warn('[API] 3. Cookie Secure flag - if HTTPS, CSRF_COOKIE_SECURE must be True');
            console.warn('[API]    Current protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A');
            console.warn('[API] 4. Cookie SameSite restrictions - check CSRF_COOKIE_SAMESITE (should be Lax)');
            console.warn('[API] 5. CORS not allowing credentials - check CORS_ALLOW_CREDENTIALS in Django (should be True)');
            console.warn('[API] 6. Cookie HttpOnly flag - check CSRF_COOKIE_HTTPONLY (should be False for JavaScript access)');
            console.warn('[API] 7. Browser blocking third-party cookies - check browser settings');
          }
        }
        
        if (!token) {
          console.error('[API] CRITICAL: Could not obtain CSRF token after fetch');
          console.error('[API] This will cause CSRF errors on state-changing requests');
          console.error('[API] Frontend domain:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
          console.error('[API] Backend URL:', this.baseURL);
          console.error('[API] Check Django settings:');
          console.error('[API] - CSRF_COOKIE_DOMAIN should be .electrocomsolutions.in');
          console.error('[API] - CSRF_COOKIE_SECURE should match HTTPS (True for HTTPS, False for HTTP)');
          console.error('[API] - CSRF_COOKIE_HTTPONLY should be False (to allow JavaScript access)');
          console.error('[API] - CORS_ALLOW_CREDENTIALS should be True');
        }
      } else {
        console.warn('[API] Unexpected response status when fetching CSRF token:', response?.status);
        console.warn('[API] Response URL:', response?.url);
      }
    } catch (error) {
      console.error('[API] Error fetching CSRF token:', error);
      if (error instanceof Error) {
        console.error('[API] Error message:', error.message);
        console.error('[API] Error stack:', error.stack);
      }
      // Don't throw - we'll try to use existing token if available
    }
  }
  
  /**
   * Refresh CSRF token by making a GET request
   * Used when we get a CSRF error to retry with a fresh token
   */
  private async refreshCsrfToken(): Promise<string | null> {
    if (typeof document === 'undefined') {
      return null;
    }
    
    try {
      // Make a GET request to get a fresh CSRF token
      // Use the get_current_user endpoint as it's reliable
      await fetch(`${this.baseURL}/api/user/`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Wait longer for cookie to be set in production with cross-subdomain cookies
      // Django sets cookie with domain=.electrocomsolutions.in which might take longer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try multiple times to read the refreshed token
      let token: string | null = null;
      for (let i = 0; i < 5; i++) {
        token = this.getCsrfToken();
        if (token) break;
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
      if (process.env.NODE_ENV === 'development') {
        if (token) {
          console.debug('[API] CSRF token refreshed:', token.substring(0, 10) + '...');
        } else {
          console.warn('[API] Failed to get CSRF token after refresh');
        }
      }
      return token;
    } catch (error) {
      console.error('[API] Failed to refresh CSRF token:', error);
      return null;
    }
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Log the request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${method} ${url}`);
    }
    
    // CRITICAL: Get CSRF token for POST, PUT, DELETE, PATCH requests
    // Django requires CSRF token for all state-changing requests
    // The token is stored in a cookie (csrftoken) and must be sent in X-CSRFToken header
    // In production, the cookie is set with domain=.electrocomsolutions.in
    // This allows the cookie to be accessible from both console.electrocomsolutions.in and consoleapi.electrocomsolutions.in
    let csrfToken: string | null = null;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // CRITICAL: Always fetch a fresh CSRF token for state-changing requests
      // This ensures the token matches the current session, especially after login
      // In production with cross-subdomain cookies, stale tokens can cause CSRF errors
      // Even if we have a token, we fetch a fresh one to ensure it's valid
      if (process.env.NODE_ENV === 'development') {
        const existingToken = this.getCsrfToken();
        if (existingToken) {
          console.debug('[API] Found existing CSRF token, but fetching fresh one to ensure it matches session...');
        } else {
          console.debug('[API] No CSRF token found in cookies, fetching one...');
        }
      }
      
      // Always fetch a fresh token to ensure it matches the current session
      // This is especially important after login when a new session is created
      await this.ensureCsrfToken();
      csrfToken = this.getCsrfToken();
      
      // If we still don't have a token after fetching, this is a critical error
      // The request will fail with a CSRF error
      if (!csrfToken) {
        console.error('[API] CRITICAL ERROR: No CSRF token available for', method, 'request to', endpoint);
        console.error('[API] This request will fail with a CSRF error');
        console.error('[API] Frontend domain:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
        console.error('[API] Backend URL:', this.baseURL);
        console.error('[API] Check Django settings:');
        console.error('[API] - CSRF_COOKIE_DOMAIN should be .electrocomsolutions.in');
        console.error('[API] - CSRF_COOKIE_SECURE should match HTTPS (True for HTTPS, False for HTTP)');
        console.error('[API] - CSRF_COOKIE_HTTPONLY should be False (to allow JavaScript access)');
        console.error('[API] - CORS_ALLOW_CREDENTIALS should be True');
        // Never log full cookies as they may contain sensitive session data
        if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
          // Only log cookie names, not values
          const cookieString = document.cookie;
          if (cookieString) {
            const cookieNames = cookieString.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
            console.error('[API] Available cookie names:', cookieNames);
            console.error('[API] Cookie string length:', cookieString.length);
          } else {
            console.error('[API] No cookies found in document.cookie');
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[API] Using CSRF token (length:', csrfToken.length, ') for', method, 'request to', endpoint);
        }
      }
    }

    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {};
    
    // Only set Content-Type if it's not FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Merge with any custom headers from options
    // Handle different header types: Record<string, string>, Headers object, or string[][]
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // Convert Headers object to Record
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        // Handle string[][] format
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        // Handle Record<string, string>
        Object.assign(headers, options.headers);
      }
    }

    // CRITICAL: Add CSRF token header for ALL state-changing requests
    // This MUST be added AFTER merging custom headers to ensure it's never overridden
    // Django requires CSRF token for POST, PUT, DELETE, PATCH requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      if (csrfToken) {
        // Always set CSRF token - this takes precedence over any token in options.headers
        headers['X-CSRFToken'] = csrfToken;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[API] Adding CSRF token header for', method, 'request to', endpoint);
          console.debug('[API] CSRF token length:', csrfToken.length, 'first 10 chars:', csrfToken.substring(0, 10));
        }
      } else {
        // This is a critical error - we need a token for state-changing requests
        console.error('[API] ERROR: Making', method, 'request to', endpoint, 'without CSRF token. This will fail.');
        console.error('[API] All state-changing requests (POST, PUT, DELETE, PATCH) require CSRF token.');
        // Never log full cookies as they may contain sensitive session data
        if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
          const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0]);
          console.error('[API] Available cookie names:', cookieNames);
        }
      }
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
      // CRITICAL: Always include credentials to send cookies (sessionid, csrftoken)
      // This is required for Django session authentication and CSRF protection
      // Must be set after spreading options to ensure it's never overridden
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          // Try to parse as JSON anyway for error messages
          try {
            const errorData = await response.json();
            throw errorData;
          } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        // Extract error information from Django response
        // Django typically returns errors in these formats:
        // - { detail: "Error message" }
        // - { error: "Error message" }
        // - { field_name: ["error1", "error2"] } (validation errors)
        const error: ApiError = {
          error: data.error || 'Error',
          message: data.detail || data.message || data.error || 'An error occurred',
          detail: data.detail,
          response: data,
          status: response.status,
        };
        
        // Log the error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Request failed:', {
            url,
            method,
            status: response.status,
            error: error,
            data: data,
          });
        }
        
        // Check if it's a CSRF error (403 or 400 with CSRF in the message)
        const isCsrfError = response.status === 403 || 
                           (response.status === 400 && 
                            (error.detail?.toLowerCase().includes('csrf') || 
                             error.message?.toLowerCase().includes('csrf') ||
                             error.error?.toLowerCase().includes('csrf')));
        
        // If it's a CSRF error and we haven't retried yet, refresh token and retry once
        if (isCsrfError && method !== 'GET' && !(options as any)._csrfRetried) {
          console.warn('[API] CSRF token error detected, refreshing token and retrying...');
          console.warn('[API] Original error:', error);
          console.warn('[API] Current CSRF token from cookie:', this.getCsrfToken()?.substring(0, 20) + '...');
          
          // Clear any existing token cookie (might be stale)
          // CRITICAL: In production with domain=.electrocomsolutions.in, we need to clear with the domain
          if (typeof document !== 'undefined') {
            const currentDomain = window.location.hostname;
            const rootDomain = currentDomain.includes('.') 
              ? '.' + currentDomain.split('.').slice(-2).join('.') 
              : currentDomain;
            
            // Clear with root domain (for production: .electrocomsolutions.in)
            if (rootDomain.startsWith('.')) {
              document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
            }
            // Clear without domain (for current domain)
            document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            // Clear with empty domain
            document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;';
          }
          
          // Wait a bit before fetching new token
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Refresh the CSRF token by making a GET request
          // This will get a fresh token that matches the current session
          try {
            const tokenResponse = await fetch(`${this.baseURL}/api/user/`, {
              method: 'GET',
              credentials: 'include', // CRITICAL: Required to receive cookies
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              },
            });
            
            // Wait longer for cookie to be set in production with cross-subdomain cookies
            // Django sets cookie with domain=.electrocomsolutions.in which might take longer
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try multiple times to read the new token
            let newToken: string | null = null;
            for (let i = 0; i < 5; i++) {
              newToken = this.getCsrfToken();
              if (newToken) break;
              await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
            
            if (newToken) {
              console.warn('[API] New CSRF token obtained:', newToken.substring(0, 20) + '...');
              
              // Retry the request with the new token
              const retryHeaders = { ...headers };
              retryHeaders['X-CSRFToken'] = newToken;
              
              const retryConfig: RequestInit = {
                ...config,
                headers: retryHeaders,
                credentials: 'include', // CRITICAL: Always include credentials for cookies
              };
              
              // Mark that we've retried to avoid infinite loops
              (retryConfig as any)._csrfRetried = true;
              
              try {
                const retryResponse = await fetch(url, retryConfig);
                const retryContentType = retryResponse.headers.get('content-type');
                
                if (!retryContentType || !retryContentType.includes('application/json')) {
                  if (!retryResponse.ok) {
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                  }
                  return {} as T;
                }
                
                const retryData = await retryResponse.json();
                
                if (!retryResponse.ok) {
                  // Check if it's still a CSRF error
                  const isStillCsrfError = retryResponse.status === 403 || 
                                         (retryResponse.status === 400 && 
                                          (retryData.detail?.toLowerCase().includes('csrf') || 
                                           retryData.error?.toLowerCase().includes('csrf')));
                  
                  if (isStillCsrfError) {
                    console.error('[API] CSRF error persists after token refresh. This indicates a deeper issue:');
                    console.error('[API] 1. Session cookie and CSRF cookie might have different domains/paths');
                    console.error('[API] 2. CSRF cookie might not be accessible due to SameSite restrictions');
                    console.error('[API] 3. Session might be changing between requests');
                    console.error('[API] 4. Cookie domain/path configuration might be incorrect');
                  }
                  
                  // Format retry error the same way
                  const retryError: ApiError = {
                    error: retryData.error || 'Error',
                    message: retryData.detail || retryData.message || retryData.error || 'An error occurred',
                    detail: retryData.detail,
                    response: retryData,
                    status: retryResponse.status,
                  };
                  throw retryError;
                }
                
                console.warn('[API] Request succeeded after CSRF token refresh');
                return retryData;
              } catch (retryError) {
                // If retry also fails, throw the original error
                console.error('[API] Retry after CSRF token refresh also failed:', retryError);
                throw error;
              }
            } else {
              console.error('[API] Could not get new CSRF token after refresh');
              console.error('[API] This might indicate a cookie access issue');
              throw error;
            }
          } catch (tokenError) {
            console.error('[API] Error while refreshing CSRF token:', tokenError);
            throw error;
          }
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      // Enhanced error handling
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error - API server might be down or CORS issue
        const networkError: ApiError = {
          error: 'Network Error',
          message: `Unable to connect to the API server. Please check:
1. Is the Django server running at ${this.baseURL}?
2. Are CORS settings correctly configured?
3. Is the API URL correct? (Current: ${this.baseURL})`,
        };
        console.error('[API Error]', networkError.message);
        throw networkError;
      }
      
      // Handle Error instances
      if (error instanceof Error) {
        console.error('[API Error]', error.message);
        console.error('[API Error] Full error:', error);
        throw error;
      }
      
      // Handle plain objects (like Django error responses)
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        // Check for common Django error formats
        if (errorObj.detail) {
          const detailError: ApiError = {
            error: errorObj.error || 'Error',
            message: errorObj.detail,
            detail: errorObj.detail,
          };
          console.error('[API Error] Django error:', detailError);
          throw detailError;
        }
        
        if (errorObj.message) {
          const messageError: ApiError = {
            error: errorObj.error || 'Error',
            message: errorObj.message,
          };
          console.error('[API Error] Error with message:', messageError);
          throw messageError;
        }
        
        if (errorObj.error) {
          const errorOnly: ApiError = {
            error: errorObj.error,
            message: typeof errorObj.error === 'string' ? errorObj.error : 'An error occurred',
          };
          console.error('[API Error] Error only:', errorOnly);
          throw errorOnly;
        }
        
        // If it's an object but we don't recognize the format, stringify it
        const stringifiedError: ApiError = {
          error: 'Error',
          message: JSON.stringify(errorObj),
        };
        console.error('[API Error] Unknown error format:', errorObj);
        throw stringifiedError;
      }
      
      // Handle string errors
      if (typeof error === 'string') {
        const stringError: ApiError = {
          error: 'Error',
          message: error,
        };
        console.error('[API Error] String error:', stringError);
        throw stringError;
      }
      
      // Last resort - unknown error type
      const unknownError: ApiError = {
        error: 'Unknown Error',
        message: `An unexpected error occurred: ${String(error)}`,
      };
      console.error('[API Error] Unknown error type:', typeof error, error);
      throw unknownError;
    }
  }

  /**
   * Login endpoint
   * Special handling for login - Django will set CSRF token on first request if needed
   */
  async login(loginIdentifier: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    const url = `${this.baseURL}/api/owner/login/`;
    
    // For login, try to get CSRF token but don't fail if we can't
    // Django will handle CSRF validation and set the token
    let csrfToken = this.getCsrfToken();
    
    // If we don't have CSRF token, try to get it (but don't block)
    if (!csrfToken) {
      try {
        // Make a quick GET request to get CSRF token
        await fetch(`${this.baseURL}/swagger/`, {
          method: 'GET',
          credentials: 'include',
        }).catch(() => {
          // If that fails, try API root
          return fetch(`${this.baseURL}/api/`, {
            method: 'GET',
            credentials: 'include',
          });
        });
        // Try to get token again
        csrfToken = this.getCsrfToken();
      } catch (error) {
        // Ignore - we'll proceed without CSRF token
        // Django might accept the request and set the token
        console.debug('[API] Could not pre-fetch CSRF token for login, proceeding anyway');
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    try {
      // CRITICAL: credentials: 'include' is required to send/receive cookies (sessionid, csrftoken)
      // Without this, Django won't receive the session cookie and CSRF validation will fail
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include', // Required for cookies and CSRF protection
        body: JSON.stringify({
          login_identifier: loginIdentifier,
          password,
          remember_me: rememberMe,
        }),
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error('Invalid response from server');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // If we get a 403, it might be CSRF - but also could be authorization
        if (response.status === 403 && data.error) {
          throw data;
        }
        const error: ApiError = data || { error: 'Login failed' };
        throw error;
      }
      
      // Login successful - Django has created a new session
      // We MUST get a fresh CSRF token that matches the new session
      // CRITICAL: In production with cross-subdomain cookies, we need to wait longer
      // Wait for the session cookie to be set, then fetch CSRF token
      if (typeof document !== 'undefined') {
        // Wait longer for session cookie to be set in production
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch a fresh CSRF token that matches the new session
        try {
          await fetch(`${this.baseURL}/api/user/`, {
            method: 'GET',
            credentials: 'include', // CRITICAL: Required to receive cookies
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          // Wait longer for cookie to be set in production with cross-subdomain cookies
          // Django sets cookie with domain=.electrocomsolutions.in which might take longer
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try multiple times to read the new token
          let newToken: string | null = null;
          for (let i = 0; i < 5; i++) {
            newToken = this.getCsrfToken();
            if (newToken) break;
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
          }
          
          if (newToken) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[API] CSRF token refreshed after login:', newToken.substring(0, 10) + '...');
            }
          } else {
            console.warn('[API] WARNING: Could not get CSRF token after login. Future requests may fail.');
            console.warn('[API] This might be due to:');
            console.warn('[API] 1. Cookie domain mismatch - check CSRF_COOKIE_DOMAIN in Django');
            console.warn('[API] 2. Cookie Secure flag - if HTTPS, CSRF_COOKIE_SECURE must be True');
            console.warn('[API] 3. Cookie HttpOnly flag - CSRF_COOKIE_HTTPONLY must be False');
            if (typeof document !== 'undefined') {
              // Never log full cookies as they may contain sensitive session data
              if (process.env.NODE_ENV === 'development') {
                const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
                console.warn('[API] Available cookie names:', cookieNames);
                console.warn('[API] Current domain:', window.location.hostname);
                console.warn('[API] Current protocol:', window.location.protocol);
              }
            }
          }
        } catch (error) {
          console.error('[API] Failed to refresh CSRF token after login:', error);
          // Continue anyway - the token might still work, or we'll retry on first request
        }
      }
      
      return data;
    } catch (error: any) {
      // Enhanced error handling for network issues
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) {
        // Get hostname safely
        let hostname = 'unknown';
        try {
          hostname = new URL(this.baseURL).hostname;
        } catch (e) {
          // Invalid URL, use baseURL as-is
          hostname = this.baseURL;
        }
        
        // Get current origin for CORS check
        const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'your frontend domain';
        
        const networkError: ApiError = {
          error: 'Network Error',
          message: `Cannot connect to API server at ${this.baseURL}.\n\nPossible causes:
- Backend server is not running or not accessible
- DNS cannot resolve the domain: ${hostname}
- SSL/TLS certificate issue (check if backend has valid SSL certificate)
- Firewall or network blocking the connection
- Backend is on a different port or path
- CORS preflight request is failing

Please verify:
1. Backend server is running and accessible
2. Backend URL is correct: ${this.baseURL}
3. DNS resolves correctly (try: ping ${hostname} or curl ${this.baseURL}/api/)
4. Backend has valid SSL certificate (for HTTPS)
5. CORS settings in backend .env include: ${frontendOrigin}
6. For production: NEXT_PUBLIC_API_URL is set in Vercel environment variables`,
        };
        throw networkError;
      }
      
      // Handle other fetch errors
      if (error instanceof Error) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Getting current user from:', `${this.baseURL}/api/user/`);
      }
      const response = await this.request<{ user: LoginResponse['user'] }>('/api/user/', {
        method: 'GET',
      });
      if (process.env.NODE_ENV === 'development' && response.user) {
        // Log only non-sensitive user information
        console.log('[API] Current user retrieved:', {
          id: response.user.id,
          username: response.user.username,
          is_staff: response.user.is_staff,
          is_superuser: response.user.is_superuser,
        });
      }
      return response.user;
    } catch (error: any) {
      // If it's a 403, user is not authorized (not staff/superuser)
      // If it's a 401, user is not authenticated
      // In both cases, return null
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] getCurrentUser error:', error);
        if (error?.status) {
          console.error('[API] Response status:', error.status);
        }
        if (error?.error || error?.message) {
          console.error('[API] Error message:', error.error || error.message);
        }
      }
      return null;
    }
  }

  /**
   * Logout endpoint
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to clear server-side session
      await this.request('/api/logout/', {
        method: 'POST',
      });
      
      // Clear CSRF token from cookies - need to clear with domain for production
      if (typeof document !== 'undefined') {
        const currentDomain = window.location.hostname;
        const rootDomain = currentDomain.includes('.') 
          ? '.' + currentDomain.split('.').slice(-2).join('.') 
          : currentDomain;
        
        // Clear with root domain (for production: .electrocomsolutions.in)
        if (rootDomain.startsWith('.')) {
          document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
          document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
        }
        // Clear without domain (for current domain)
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      // Even if logout fails, clear local state and cookies
      console.error('Logout error:', error);
      
      // Clear cookies even if request failed - need to clear with domain for production
      if (typeof document !== 'undefined') {
        const currentDomain = window.location.hostname;
        const rootDomain = currentDomain.includes('.') 
          ? '.' + currentDomain.split('.').slice(-2).join('.') 
          : currentDomain;
        
        // Clear with root domain (for production: .electrocomsolutions.in)
        if (rootDomain.startsWith('.')) {
          document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
          document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
        }
        // Clear without domain (for current domain)
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
  }

  /**
   * Profile Management APIs
   */

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<CurrentUserProfile> {
    return this.request<CurrentUserProfile>('/api/profile/', {
      method: 'GET',
    });
  }

  /**
   * Update current user profile
   */
  async updateCurrentUserProfile(data: CurrentUserProfileUpdateData): Promise<CurrentUserProfile> {
    const formData = new FormData();

    // User fields
    if (data.username !== undefined) formData.append('username', data.username);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.first_name !== undefined) formData.append('first_name', data.first_name);
    if (data.last_name !== undefined) formData.append('last_name', data.last_name);

    // Profile fields
    if (data.photo !== undefined) {
      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      } else if (data.photo === null) {
        formData.append('photo', ''); // Empty string to clear
      }
    }
    if (data.date_of_birth !== undefined) formData.append('date_of_birth', data.date_of_birth || '');
    if (data.gender !== undefined) formData.append('gender', data.gender || '');
    if (data.address !== undefined) formData.append('address', data.address || '');
    if (data.city !== undefined) formData.append('city', data.city || '');
    if (data.state !== undefined) formData.append('state', data.state || '');
    if (data.pin_code !== undefined) formData.append('pin_code', data.pin_code || '');
    if (data.country !== undefined) formData.append('country', data.country || '');
    if (data.aadhar_number !== undefined) formData.append('aadhar_number', data.aadhar_number || '');
    if (data.pan_number !== undefined) formData.append('pan_number', data.pan_number || '');
    
    if (data.aadhar_card !== undefined) {
      if (data.aadhar_card instanceof File) {
        formData.append('aadhar_card', data.aadhar_card);
      } else if (data.aadhar_card === null) {
        formData.append('aadhar_card', ''); // Empty string to clear
      }
    }
    
    if (data.pan_card !== undefined) {
      if (data.pan_card instanceof File) {
        formData.append('pan_card', data.pan_card);
      } else if (data.pan_card === null) {
        formData.append('pan_card', ''); // Empty string to clear
      }
    }

    // Phone number
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number || '');

    // Password change
    if (data.current_password !== undefined) formData.append('current_password', data.current_password || '');
    if (data.new_password !== undefined) formData.append('new_password', data.new_password || '');
    if (data.confirm_password !== undefined) formData.append('confirm_password', data.confirm_password || '');

    return this.request<CurrentUserProfile>('/api/profile/update/', {
      method: 'PATCH',
      body: formData,
    });
  }

  /**
   * List all profiles with optional search
   */
  async getProfiles(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ProfileListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const queryString = queryParams.toString();
    const url = `/api/profiles/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProfileListResponse>(url, {
      method: 'GET',
    });
  }

  /**
   * Create a new profile with user
   */
  async createProfile(data: ProfileCreateData): Promise<CurrentUserProfile> {
    const formData = new FormData();

    // Required fields
    formData.append('first_name', data.first_name);
    formData.append('email', data.email);

    // Optional fields
    if (data.last_name !== undefined) formData.append('last_name', data.last_name || '');
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number || '');
    if (data.photo) formData.append('photo', data.photo);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);
    if (data.aadhar_number) formData.append('aadhar_number', data.aadhar_number);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.aadhar_card) formData.append('aadhar_card', data.aadhar_card);
    if (data.pan_card) formData.append('pan_card', data.pan_card);

    return this.request<CurrentUserProfile>('/api/profile/create/', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return this.request<DashboardStatsResponse>('/api/dashboard/all-stats/', {
      method: 'GET',
    });
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(): Promise<ClientStatisticsResponse> {
    return this.request<ClientStatisticsResponse>('/api/clients/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get all clients with optional filters
   */
  async getClients(params?: {
    search?: string;
    has_active_amc?: boolean;
    page?: number;
  }): Promise<BackendClientListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.has_active_amc !== undefined) queryParams.append('has_active_amc', params.has_active_amc.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/clients/${queryString ? `?${queryString}` : ''}`;

    return this.request<BackendClientListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific client by ID
   */
  async getClient(id: number): Promise<BackendClientDetail> {
    return this.request<BackendClientDetail>(`/api/clients/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new client
   * Note: Client Name -> first_name in User model (NOT split into first_name and last_name)
   * last_name is always set to empty string on the backend
   */
  async createClient(data: {
    first_name: string;
    email?: string;
    phone_number?: string;
    photo?: File;
    date_of_birth?: string;
    gender?: string;
    aadhar_number?: string;
    pan_number?: string;
    aadhar_card?: File;
    pan_card?: File;
    designation?: string;
    joining_date?: string;
    monthly_salary?: number;
    notes?: string;
    profile?: number;
    primary_contact_name?: string;
    address?: string;
    city?: string;
    state?: string;
    pin_code?: string;
    country?: string;
  }): Promise<BackendClientDetail> {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    // last_name is not used - Client Name goes to first_name only
    // Backend will set last_name to empty string automatically
    if (data.email) formData.append('email', data.email);
    if (data.phone_number) formData.append('phone_number', data.phone_number);
    if (data.photo) formData.append('photo', data.photo);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.aadhar_number) formData.append('aadhar_number', data.aadhar_number);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.aadhar_card) formData.append('aadhar_card', data.aadhar_card);
    if (data.pan_card) formData.append('pan_card', data.pan_card);
    if (data.designation) formData.append('designation', data.designation);
    if (data.joining_date) formData.append('joining_date', data.joining_date);
    if (data.monthly_salary !== undefined) formData.append('monthly_salary', data.monthly_salary.toString());
    if (data.notes) formData.append('notes', data.notes);
    if (data.profile) formData.append('profile', data.profile.toString());
    if (data.primary_contact_name) formData.append('primary_contact_name', data.primary_contact_name);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);

    // Use the request method which handles CSRF tokens properly
    // The request method will handle errors and format them correctly
    return await this.request<BackendClientDetail>('/api/clients/', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update a client
   * Note: Client Name -> first_name in User model (NOT split into first_name and last_name)
   * last_name is always set to empty string on the backend
   */
  async updateClient(id: number, data: Partial<{
    first_name: string;
    email: string;
    phone_number: string;
    photo: File;
    date_of_birth: string;
    gender: string;
    aadhar_number: string;
    pan_number: string;
    aadhar_card: File;
    pan_card: File;
    designation: string;
    joining_date: string;
    monthly_salary: number;
    notes: string;
    profile: number;
    primary_contact_name: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
    country: string;
  }>): Promise<BackendClientDetail> {
    const formData = new FormData();
    if (data.first_name !== undefined) formData.append('first_name', data.first_name);
    // last_name is not used - Client Name goes to first_name only
    // Backend will set last_name to empty string automatically
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number);
    if (data.photo) formData.append('photo', data.photo);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.aadhar_number) formData.append('aadhar_number', data.aadhar_number);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.aadhar_card) formData.append('aadhar_card', data.aadhar_card);
    if (data.pan_card) formData.append('pan_card', data.pan_card);
    if (data.designation) formData.append('designation', data.designation);
    if (data.joining_date) formData.append('joining_date', data.joining_date);
    if (data.monthly_salary !== undefined) formData.append('monthly_salary', data.monthly_salary.toString());
    if (data.notes !== undefined) formData.append('notes', data.notes || '');
    if (data.profile) formData.append('profile', data.profile.toString());
    // CRITICAL: Send primary_contact_name even if empty string to allow clearing the field
    if (data.primary_contact_name !== undefined) formData.append('primary_contact_name', data.primary_contact_name || '');
    // CRITICAL: Send address fields even if empty strings to allow clearing/updating them
    if (data.address !== undefined) formData.append('address', data.address || '');
    if (data.city !== undefined) formData.append('city', data.city || '');
    if (data.state !== undefined) formData.append('state', data.state || '');
    if (data.pin_code !== undefined) formData.append('pin_code', data.pin_code || '');
    if (data.country !== undefined) formData.append('country', data.country || '');

    // Use the request method which handles CSRF tokens properly
    return this.request<BackendClientDetail>(`/api/clients/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  }

  /**
   * Delete a client
   */
  async deleteClient(id: number): Promise<void> {
    await this.request(`/api/clients/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * AMC Management APIs
   */

  /**
   * Get AMC statistics
   */
  async getAMCStatistics(): Promise<AMCStatisticsResponse> {
    return this.request<AMCStatisticsResponse>('/api/amcs/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get count of AMCs expiring in next 30 days
   */
  async getAMCExpiringCount(): Promise<AMCExpiringCountResponse> {
    return this.request<AMCExpiringCountResponse>('/api/amcs/expiring-count/', {
      method: 'GET',
    });
  }

  /**
   * Get all AMCs with optional filters
   */
  async getAMCs(params?: {
    search?: string;
    status?: 'Pending' | 'Active' | 'Expired' | 'Canceled';
    billing_cycle?: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
    expiring_days?: number; // 7, 15, or 30
    page?: number;
  }): Promise<BackendAMCListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.billing_cycle) queryParams.append('billing_cycle', params.billing_cycle);
    if (params?.expiring_days) queryParams.append('expiring_days', params.expiring_days.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/amcs/${queryString ? `?${queryString}` : ''}`;

    return this.request<BackendAMCListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific AMC by ID
   */
  async getAMC(id: number): Promise<BackendAMCDetail> {
    return this.request<BackendAMCDetail>(`/api/amcs/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new AMC
   */
  async createAMC(data: {
    client: number;
    amc_number: string;
    amount: number;
    start_date: string;
    end_date: string;
    billing_cycle: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
    status?: 'Active' | 'Expired' | 'Canceled';
    notes?: string;
  }): Promise<BackendAMCDetail> {
    return this.request<BackendAMCDetail>('/api/amcs/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an AMC
   */
  async updateAMC(id: number, data: Partial<{
    client: number;
    amc_number: string;
    amount: number;
    start_date: string;
    end_date: string;
    billing_cycle: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
    status: 'Active' | 'Expired' | 'Canceled';
    notes: string;
  }>): Promise<BackendAMCDetail> {
    return this.request<BackendAMCDetail>(`/api/amcs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an AMC
   */
  async deleteAMC(id: number): Promise<void> {
    await this.request(`/api/amcs/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Update AMC billing payment status
   */
  async updateAMCBilling(billingId: number, data: {
    paid: boolean;
    payment_date?: string;
    payment_mode?: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI';
    notes?: string;
  }): Promise<BackendAMCBilling> {
    return this.request<BackendAMCBilling>(`/api/amcs/billing/${billingId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Tender Management APIs
   */

  /**
   * Get tender statistics
   */
  async getTenderStatistics(): Promise<TenderStatisticsResponse> {
    return this.request<TenderStatisticsResponse>('/api/tenders/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get all tenders with optional filters
   */
  async getTenders(params?: {
    search?: string;
    status?: 'Draft' | 'Filed' | 'Awarded' | 'Lost' | 'Closed';
    pending_emds?: boolean;
    firm?: number;
    page?: number;
  }): Promise<BackendTenderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.pending_emds !== undefined) queryParams.append('pending_emds', params.pending_emds.toString());
    if (params?.firm) queryParams.append('firm', params.firm.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/tenders/${queryString ? `?${queryString}` : ''}`;

    return this.request<BackendTenderListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific tender by ID
   */
  async getTender(id: number): Promise<BackendTenderDetail> {
    return this.request<BackendTenderDetail>(`/api/tenders/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new tender
   */
  async createTender(data: {
    name: string;
    reference_number?: string;
    description?: string;
    firm?: number;
    filed_date?: string;
    start_date?: string;
    end_date?: string;
    estimated_value?: number;
    status?: 'Draft' | 'Filed' | 'Awarded' | 'Lost' | 'Closed';
    security_deposit_1_dd_date?: string;
    security_deposit_1_dd_number?: string;
    security_deposit_1_dd_amount?: number;
    security_deposit_1_dd_bank_name?: string;
    security_deposit_1_dd_beneficiary_name?: string;
    security_deposit_2_dd_date?: string;
    security_deposit_2_dd_number?: string;
    security_deposit_2_dd_amount?: number;
    security_deposit_2_dd_bank_name?: string;
    security_deposit_2_dd_beneficiary_name?: string;
  }): Promise<BackendTenderDetail> {
    const formData = new FormData();
    
    // Required fields
    formData.append('name', data.name);
    if (data.reference_number !== undefined && data.reference_number !== '') formData.append('reference_number', data.reference_number);
    if (data.description !== undefined && data.description !== '') formData.append('description', data.description);
    // Handle firm field: send it if it has a value
    if (data.firm !== undefined && data.firm !== null) {
      formData.append('firm', data.firm.toString());
    }
    if (data.filed_date !== undefined && data.filed_date !== '') formData.append('filed_date', data.filed_date);
    if (data.start_date !== undefined && data.start_date !== '') formData.append('start_date', data.start_date);
    if (data.end_date !== undefined && data.end_date !== '') formData.append('end_date', data.end_date);
    if (data.estimated_value !== undefined) formData.append('estimated_value', data.estimated_value.toString());
    if (data.status !== undefined) formData.append('status', data.status);
    
    // Security Deposit 1 fields (only append if provided and not empty)
    if (data.security_deposit_1_dd_date !== undefined && data.security_deposit_1_dd_date !== '') formData.append('security_deposit_1_dd_date', data.security_deposit_1_dd_date);
    if (data.security_deposit_1_dd_number !== undefined && data.security_deposit_1_dd_number !== '') formData.append('security_deposit_1_dd_number', data.security_deposit_1_dd_number);
    if (data.security_deposit_1_dd_amount !== undefined) formData.append('security_deposit_1_dd_amount', data.security_deposit_1_dd_amount.toString());
    if (data.security_deposit_1_dd_bank_name !== undefined && data.security_deposit_1_dd_bank_name !== '') formData.append('security_deposit_1_dd_bank_name', data.security_deposit_1_dd_bank_name);
    if (data.security_deposit_1_dd_beneficiary_name !== undefined && data.security_deposit_1_dd_beneficiary_name !== '') formData.append('security_deposit_1_dd_beneficiary_name', data.security_deposit_1_dd_beneficiary_name);
    
    // Security Deposit 2 fields (only append if provided and not empty)
    if (data.security_deposit_2_dd_date !== undefined && data.security_deposit_2_dd_date !== '') formData.append('security_deposit_2_dd_date', data.security_deposit_2_dd_date);
    if (data.security_deposit_2_dd_number !== undefined && data.security_deposit_2_dd_number !== '') formData.append('security_deposit_2_dd_number', data.security_deposit_2_dd_number);
    if (data.security_deposit_2_dd_amount !== undefined) formData.append('security_deposit_2_dd_amount', data.security_deposit_2_dd_amount.toString());
    if (data.security_deposit_2_dd_bank_name !== undefined && data.security_deposit_2_dd_bank_name !== '') formData.append('security_deposit_2_dd_bank_name', data.security_deposit_2_dd_bank_name);
    if (data.security_deposit_2_dd_beneficiary_name !== undefined && data.security_deposit_2_dd_beneficiary_name !== '') formData.append('security_deposit_2_dd_beneficiary_name', data.security_deposit_2_dd_beneficiary_name);
    
    return this.request<BackendTenderDetail>('/api/tenders/', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update a tender
   */
  async updateTender(id: number, data: Partial<{
    name: string;
    reference_number: string;
    description: string;
    firm?: number | null;
    filed_date: string;
    start_date: string;
    end_date: string;
    estimated_value: number;
    status: 'Draft' | 'Filed' | 'Awarded' | 'Lost' | 'Closed';
    security_deposit_1_dd_date: string;
    security_deposit_1_dd_number: string;
    security_deposit_1_dd_amount: number;
    security_deposit_1_dd_bank_name: string;
    security_deposit_1_dd_beneficiary_name: string;
    security_deposit_2_dd_date: string;
    security_deposit_2_dd_number: string;
    security_deposit_2_dd_amount: number;
    security_deposit_2_dd_bank_name: string;
    security_deposit_2_dd_beneficiary_name: string;
  }>): Promise<BackendTenderDetail> {
    const formData = new FormData();
    
    // Append only provided fields (skip undefined and empty strings for optional fields)
    if (data.name !== undefined && data.name !== '') formData.append('name', data.name);
    if (data.reference_number !== undefined && data.reference_number !== '') formData.append('reference_number', data.reference_number);
    if (data.description !== undefined && data.description !== '') formData.append('description', data.description);
    // Handle firm field: include it if it's explicitly set
    // For clearing (null), we send empty string which DRF will interpret as null for nullable fields
    if (data.firm !== undefined) {
      if (data.firm !== null) {
        formData.append('firm', data.firm.toString());
      } else {
        // Send empty string to clear the firm field (DRF will set it to null)
        formData.append('firm', '');
      }
    }
    if (data.filed_date !== undefined && data.filed_date !== '') formData.append('filed_date', data.filed_date);
    if (data.start_date !== undefined && data.start_date !== '') formData.append('start_date', data.start_date);
    if (data.end_date !== undefined && data.end_date !== '') formData.append('end_date', data.end_date);
    if (data.estimated_value !== undefined) formData.append('estimated_value', data.estimated_value.toString());
    if (data.status !== undefined) formData.append('status', data.status);
    
    // Security Deposit 1 fields (only append if provided and not empty)
    if (data.security_deposit_1_dd_date !== undefined && data.security_deposit_1_dd_date !== '') formData.append('security_deposit_1_dd_date', data.security_deposit_1_dd_date);
    if (data.security_deposit_1_dd_number !== undefined && data.security_deposit_1_dd_number !== '') formData.append('security_deposit_1_dd_number', data.security_deposit_1_dd_number);
    if (data.security_deposit_1_dd_amount !== undefined) formData.append('security_deposit_1_dd_amount', data.security_deposit_1_dd_amount.toString());
    if (data.security_deposit_1_dd_bank_name !== undefined && data.security_deposit_1_dd_bank_name !== '') formData.append('security_deposit_1_dd_bank_name', data.security_deposit_1_dd_bank_name);
    if (data.security_deposit_1_dd_beneficiary_name !== undefined && data.security_deposit_1_dd_beneficiary_name !== '') formData.append('security_deposit_1_dd_beneficiary_name', data.security_deposit_1_dd_beneficiary_name);
    
    // Security Deposit 2 fields (only append if provided and not empty)
    if (data.security_deposit_2_dd_date !== undefined && data.security_deposit_2_dd_date !== '') formData.append('security_deposit_2_dd_date', data.security_deposit_2_dd_date);
    if (data.security_deposit_2_dd_number !== undefined && data.security_deposit_2_dd_number !== '') formData.append('security_deposit_2_dd_number', data.security_deposit_2_dd_number);
    if (data.security_deposit_2_dd_amount !== undefined) formData.append('security_deposit_2_dd_amount', data.security_deposit_2_dd_amount.toString());
    if (data.security_deposit_2_dd_bank_name !== undefined && data.security_deposit_2_dd_bank_name !== '') formData.append('security_deposit_2_dd_bank_name', data.security_deposit_2_dd_bank_name);
    if (data.security_deposit_2_dd_beneficiary_name !== undefined && data.security_deposit_2_dd_beneficiary_name !== '') formData.append('security_deposit_2_dd_beneficiary_name', data.security_deposit_2_dd_beneficiary_name);
    
    return this.request<BackendTenderDetail>(`/api/tenders/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  }

  /**
   * Delete a tender
   */
  async deleteTender(id: number): Promise<void> {
    await this.request(`/api/tenders/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Attach a document to a tender
   */
  async attachTenderDocument(tenderId: number, file: File, description?: string): Promise<BackendTenderDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/tenders/${tenderId}/attach-document/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Download a tender document
   */
  async downloadTenderDocument(tenderId: number, documentId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/tenders/${tenderId}/download-document/${documentId}/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Delete a tender document
   */
  async deleteTenderDocument(tenderId: number, documentId: number): Promise<void> {
    await this.request(`/api/tenders/${tenderId}/delete-document/${documentId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Mark EMD as collected for a tender
   */
  async markTenderEMDCollected(tenderId: number, emdCollectedDate?: string): Promise<BackendTenderDetail> {
    const body: any = {};
    if (emdCollectedDate) {
      body.emd_collected_date = emdCollectedDate;
    }
    return this.request<BackendTenderDetail>(`/api/tenders/${tenderId}/mark-emd-collected/`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Project Management APIs
   */

  /**
   * Get project statistics
   */
  async getProjectStatistics(): Promise<ProjectStatisticsResponse> {
    return this.request<ProjectStatisticsResponse>('/api/projects/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get all projects with optional filters
   */
  async getProjects(params?: {
    search?: string;
    status?: 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
    page?: number;
  }): Promise<BackendProjectListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/projects/${queryString ? `?${queryString}` : ''}`;

    return this.request<BackendProjectListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: number): Promise<BackendProjectDetail> {
    return this.request<BackendProjectDetail>(`/api/projects/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new project
   */
  async createProject(data: {
    name: string;
    client: number;
    tender?: number | null;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
  }): Promise<BackendProjectDetail> {
    return this.request<BackendProjectDetail>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a project
   */
  async updateProject(id: number, data: Partial<{
    name: string;
    client: number;
    tender: number | null;
    description: string;
    start_date: string;
    end_date: string;
    status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
  }>): Promise<BackendProjectDetail> {
    return this.request<BackendProjectDetail>(`/api/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<void> {
    await this.request(`/api/projects/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Task Management APIs
   */

  /**
   * Get task statistics
   */
  async getTaskStatistics(params?: {
    filter?: 'today' | 'this_week' | 'this_month' | 'all';
  }): Promise<TaskStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.filter) queryParams.append('filter', params.filter);

    const queryString = queryParams.toString();
    const endpoint = `/api/tasks/statistics/${queryString ? `?${queryString}` : ''}`;

    return this.request<TaskStatisticsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get all tasks with optional filters
   */
  async getTasks(params?: {
    search?: string;
    project?: number;
    status?: 'Draft' | 'In Progress' | 'Completed' | 'Canceled';
    approval_status?: 'pending' | 'approved' | 'rejected';
    date_filter?: 'today' | 'this_week' | 'this_month' | 'all';
    page?: number;
  }): Promise<BackendTaskListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.project) queryParams.append('project', params.project.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.approval_status) queryParams.append('approval_status', params.approval_status);
    if (params?.date_filter) queryParams.append('date_filter', params.date_filter);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/tasks/${queryString ? `?${queryString}` : ''}`;

    try {
      return await this.request<BackendTaskListResponse>(endpoint, {
        method: 'GET',
      });
    } catch (error: any) {
      console.error('[API Client] Error fetching tasks:', error);
      console.error('[API Client] Endpoint:', endpoint);
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(id: number): Promise<BackendTaskDetail> {
    return this.request<BackendTaskDetail>(`/api/tasks/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new task
   */
  async createTask(data: {
    project: number;
    task_name: string;
    deadline: string; // Maps to task_date
    employee?: number;
    status?: 'Draft' | 'In Progress' | 'Completed' | 'Canceled';
    estimated_time?: number; // Maps to time_taken_minutes
    location?: string;
    task_description?: string;
  }): Promise<BackendTaskDetail> {
    const formData = new FormData();
    
    // Required fields
    formData.append('project', data.project.toString());
    formData.append('task_name', data.task_name);
    formData.append('deadline', data.deadline);
    
    // Optional fields
    if (data.employee !== undefined) formData.append('employee', data.employee.toString());
    if (data.status) formData.append('status', data.status);
    if (data.estimated_time !== undefined) formData.append('estimated_time', data.estimated_time.toString());
    if (data.location) formData.append('location', data.location);
    if (data.task_description) formData.append('task_description', data.task_description);
    
    return this.request<BackendTaskDetail>('/api/tasks/', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update a task
   */
  async updateTask(id: number, data: Partial<{
    project: number;
    task_name: string;
    deadline: string;
    employee: number;
    status: 'Draft' | 'In Progress' | 'Completed' | 'Canceled';
    approval_status?: 'pending' | 'approved' | 'rejected';
    estimated_time: number;
    location: string;
    task_description: string;
    internal_notes: string;
  }>): Promise<BackendTaskDetail> {
    const formData = new FormData();
    
    // Only append fields that are provided (for PATCH, only update provided fields)
    if (data.project !== undefined) formData.append('project', data.project.toString());
    if (data.task_name !== undefined) formData.append('task_name', data.task_name);
    if (data.approval_status !== undefined) formData.append('approval_status', data.approval_status);
    if (data.deadline !== undefined) formData.append('deadline', data.deadline);
    if (data.employee !== undefined) formData.append('employee', data.employee.toString());
    if (data.status !== undefined) formData.append('status', data.status);
    if (data.estimated_time !== undefined) formData.append('estimated_time', data.estimated_time.toString());
    if (data.location !== undefined) formData.append('location', data.location);
    if (data.task_description !== undefined) formData.append('task_description', data.task_description);
    if (data.internal_notes !== undefined) formData.append('internal_notes', data.internal_notes);
    
    return this.request<BackendTaskDetail>(`/api/tasks/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<void> {
    await this.request(`/api/tasks/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Approve a task
   */
  async approveTask(id: number): Promise<BackendTaskDetail> {
    return this.request<BackendTaskDetail>(`/api/tasks/${id}/approve/`, {
      method: 'POST',
    });
  }

  /**
   * Reject a task
   */
  async rejectTask(id: number, reason?: string): Promise<BackendTaskDetail> {
    return this.request<BackendTaskDetail>(`/api/tasks/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Task rejected' }),
    });
  }

  /**
   * Bulk approve tasks
   */
  async bulkApproveTasks(taskIds: number[]): Promise<{ approved_count: number; skipped_count: number; errors?: string[] }> {
    return this.request<{ approved_count: number; skipped_count: number; errors?: string[] }>('/api/tasks/bulk-approve/', {
      method: 'POST',
      body: JSON.stringify({ task_ids: taskIds }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Attach a document to a task
   */
  async attachTaskDocument(taskId: number, file: File, notes?: string): Promise<BackendTaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/tasks/${taskId}/attach-document/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Download a task document (returns file URL for direct access)
   * Note: The backend returns a FileResponse, so we can use file_url directly for preview/download
   */
  getTaskDocumentUrl(taskId: number, fileUrl: string): string {
    // If file_url is already a full URL, return it
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    // Otherwise, construct the full URL
    return `${this.baseURL}${fileUrl}`;
  }

  /**
   * Get preview URL for a task document (for inline display in iframe)
   * This endpoint allows iframe embedding by using xframe_options_exempt
   */
  getTaskDocumentPreviewUrl(taskId: number, documentId: number): string {
    return `${this.baseURL}/api/tasks/${taskId}/preview-document/${documentId}/`;
  }

  /**
   * Get download URL for a task document
   */
  getTaskDocumentDownloadUrl(taskId: number, documentId: number): string {
    return `${this.baseURL}/api/tasks/${taskId}/download-document/${documentId}/`;
  }

  /**
   * Delete a task document
   */
  async deleteTaskDocument(taskId: number, documentId: number): Promise<void> {
    await this.request(`/api/tasks/${taskId}/delete-document/${documentId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Attach a resource to a task
   */
  async attachTaskResource(taskId: number, data: {
    resource_name: string;
    quantity: number;
    unit_cost: number;
    total_cost?: number;
  }): Promise<BackendTaskResource> {
    return this.request<BackendTaskResource>(`/api/tasks/${taskId}/attach-resource/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a task resource
   */
  async updateTaskResource(taskId: number, resourceId: number, data: {
    quantity?: number;
    unit_cost?: number;
    total_cost?: number;
  }): Promise<BackendTaskResource> {
    return this.request<BackendTaskResource>(`/api/tasks/${taskId}/update-resource/${resourceId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a task resource
   */
  async deleteTaskResource(taskId: number, resourceId: number): Promise<void> {
    await this.request(`/api/tasks/${taskId}/delete-resource/${resourceId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Document Management APIs
   */

  /**
   * Get all document templates with optional filters
   */
  async getDocumentTemplates(params?: {
    category?: string;
    firm?: number;
    search?: string;
    page?: number;
  }): Promise<DocumentTemplateListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.firm) queryParams.append('firm', params.firm.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/documents/templates/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DocumentTemplateListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific document template by ID
   */
  async getDocumentTemplate(id: number): Promise<DocumentTemplate> {
    return this.request<DocumentTemplate>(`/api/documents/templates/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Upload a new document template
   */
  async uploadDocumentTemplate(data: {
    title?: string;
    category?: string;
    firm?: number;
    template_id?: number;
    upload_file: File;
    notes?: string;
  }): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.category) formData.append('category', data.category);
    if (data.firm) formData.append('firm', data.firm.toString());
    if (data.template_id) formData.append('template_id', data.template_id.toString());
    formData.append('upload_file', data.upload_file);
    if (data.notes) formData.append('notes', data.notes);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/documents/templates/upload-template/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Delete a document template
   */
  async deleteDocumentTemplate(id: number): Promise<void> {
    await this.request(`/api/documents/templates/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Download published version of a template
   */
  async downloadPublishedVersion(templateId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/documents/templates/${templateId}/download-published/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Download a specific version by version ID
   */
  async downloadVersion(versionId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/documents/templates/download-version/?version_id=${versionId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Get preview URL for published version of a template
   */
  getPreviewPublishedUrl(templateId: number): string {
    return `${this.baseURL}/api/documents/templates/${templateId}/preview-published/`;
  }

  /**
   * Get preview URL for a specific version
   */
  getPreviewVersionUrl(templateId: number, versionId: number): string {
    return `${this.baseURL}/api/documents/templates/${templateId}/preview-version/${versionId}/`;
  }

  /**
   * Bulk download documents
   */
  async bulkDownloadDocuments(data: BulkDownloadRequest): Promise<Blob> {
    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/documents/templates/bulk-download/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Bulk download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Get all firms (for document template firm selection and settings)
   */
  async getFirms(params?: {
    search?: string;
    firm_type?: 'Proprietorship' | 'Partnership' | 'Pvt Ltd' | 'LLP';
    page?: number;
  }): Promise<FirmListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.firm_type) queryParams.append('firm_type', params.firm_type);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/firms/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FirmListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get firm details
   */
  async getFirm(id: number): Promise<FirmDetail> {
    return this.request<FirmDetail>(`/api/firms/${id}/`);
  }

  /**
   * Create firm
   */
  async createFirm(data: FirmCreateData): Promise<FirmDetail> {
    return this.request<FirmDetail>('/api/firms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update firm
   */
  async updateFirm(id: number, data: Partial<FirmCreateData>): Promise<FirmDetail> {
    return this.request<FirmDetail>(`/api/firms/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete firm
   */
  async deleteFirm(id: number): Promise<void> {
    await this.request(`/api/firms/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Employee Management APIs
   */

  /**
   * Get employee statistics
   */
  async getEmployeeStatistics(): Promise<EmployeeStatisticsResponse> {
    return this.request<EmployeeStatisticsResponse>('/api/employees/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get all employees with optional filters
   */
  async getEmployees(params?: {
    search?: string;
    designation?: string;
    availability?: 'present' | 'absent';
    page?: number;
  }): Promise<EmployeeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.designation) queryParams.append('designation', params.designation);
    if (params?.availability) queryParams.append('availability', params.availability);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/employees/${queryString ? `?${queryString}` : ''}`;

    return this.request<EmployeeListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific employee by ID
   */
  async getEmployee(id: number): Promise<EmployeeDetail> {
    return this.request<EmployeeDetail>(`/api/employees/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new employee
   */
  async createEmployee(data: EmployeeCreateData): Promise<EmployeeDetail> {
    const formData = new FormData();
    
    // Required fields
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('employee_code', data.employee_code);
    formData.append('designation', data.designation);
    formData.append('joining_date', data.joining_date);
    formData.append('monthly_salary', data.monthly_salary.toString());
    
    // Optional fields
    if (data.phone_number) formData.append('phone_number', data.phone_number);
    if (data.photo) formData.append('photo', data.photo);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);
    if (data.aadhar_number) formData.append('aadhar_number', data.aadhar_number);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.aadhar_card) formData.append('aadhar_card', data.aadhar_card);
    if (data.pan_card) formData.append('pan_card', data.pan_card);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/employees/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Create failed' }));
      
      // Parse Django validation errors
      // Django returns errors in formats like:
      // - {field_name: ["error message"]} for field-specific errors
      // - {error: "error message"} for general errors
      // - {detail: "error message"} for detail errors
      let errorMessage = 'Failed to create employee';
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        // Extract field-specific errors
        const fieldErrors: string[] = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          } else if (typeof messages === 'object' && messages !== null) {
            // Handle nested error objects
            const nestedMessages = Object.values(messages).flat();
            fieldErrors.push(`${field}: ${nestedMessages.join(', ')}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ');
        }
      }
      
      // Create error object with parsed message
      const error = new Error(errorMessage);
      (error as any).response = errorData;
      (error as any).fieldErrors = errorData;
      throw error;
    }

    return response.json();
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: number, data: Partial<EmployeeCreateData>): Promise<EmployeeDetail> {
    const formData = new FormData();
    
    // Required fields (only if provided)
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.email) formData.append('email', data.email);
    if (data.employee_code) formData.append('employee_code', data.employee_code);
    if (data.designation) formData.append('designation', data.designation);
    if (data.joining_date) formData.append('joining_date', data.joining_date);
    if (data.monthly_salary !== undefined) formData.append('monthly_salary', data.monthly_salary.toString());
    
    // Optional fields
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number || '');
    if (data.photo) formData.append('photo', data.photo);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);
    if (data.aadhar_number) formData.append('aadhar_number', data.aadhar_number);
    if (data.pan_number) formData.append('pan_number', data.pan_number);
    if (data.aadhar_card) formData.append('aadhar_card', data.aadhar_card);
    if (data.pan_card) formData.append('pan_card', data.pan_card);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/employees/${id}/`, {
      method: 'PATCH',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id: number): Promise<void> {
    await this.request(`/api/employees/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Contract Worker Management APIs
   */

  /**
   * Get contract worker statistics
   */
  async getContractWorkerStatistics(): Promise<ContractWorkerStatisticsResponse> {
    return this.request<ContractWorkerStatisticsResponse>('/api/contract-workers/statistics/', {
      method: 'GET',
    });
  }

  /**
   * Get all contract workers with optional filters
   */
  async getContractWorkers(params?: {
    search?: string;
    worker_type?: string;
    availability?: 'assigned' | 'available';
    page?: number;
  }): Promise<ContractWorkerListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.worker_type) queryParams.append('worker_type', params.worker_type);
    if (params?.availability) queryParams.append('availability', params.availability);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/contract-workers/${queryString ? `?${queryString}` : ''}`;

    return this.request<ContractWorkerListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific contract worker by ID
   */
  async getContractWorker(id: number): Promise<ContractWorkerDetail> {
    return this.request<ContractWorkerDetail>(`/api/contract-workers/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Create a new contract worker
   */
  async createContractWorker(data: ContractWorkerCreateData): Promise<ContractWorkerDetail> {
    const formData = new FormData();
    
    // Required fields
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('worker_type', data.worker_type);
    formData.append('monthly_salary', data.monthly_salary.toString());
    formData.append('aadhar_no', data.aadhar_no);
    
    // Optional fields
    if (data.phone_number) formData.append('phone_number', data.phone_number);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);
    if (data.uan_number) formData.append('uan_number', data.uan_number);
    if (data.department) formData.append('department', data.department);
    if (data.project) formData.append('project', data.project.toString());
    if (data.bank_name) formData.append('bank_name', data.bank_name);
    if (data.bank_account_number) formData.append('bank_account_number', data.bank_account_number);
    if (data.ifsc_code) formData.append('ifsc_code', data.ifsc_code);
    if (data.bank_branch) formData.append('bank_branch', data.bank_branch);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/contract-workers/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Create failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Update a contract worker
   */
  async updateContractWorker(id: number, data: Partial<ContractWorkerCreateData>): Promise<ContractWorkerDetail> {
    const formData = new FormData();
    
    // Required fields (only if provided)
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.email) formData.append('email', data.email);
    if (data.worker_type) formData.append('worker_type', data.worker_type);
    if (data.monthly_salary !== undefined) formData.append('monthly_salary', data.monthly_salary.toString());
    if (data.aadhar_no) formData.append('aadhar_no', data.aadhar_no);
    
    // Optional fields - send empty strings for updates to clear fields
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number || '');
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.address) formData.append('address', data.address);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.pin_code) formData.append('pin_code', data.pin_code);
    if (data.country) formData.append('country', data.country);
    if (data.uan_number !== undefined) formData.append('uan_number', data.uan_number || '');
    if (data.department) formData.append('department', data.department);
    if (data.project !== undefined) formData.append('project', data.project ? data.project.toString() : '');
    if (data.bank_name !== undefined) formData.append('bank_name', data.bank_name || '');
    if (data.bank_account_number !== undefined) formData.append('bank_account_number', data.bank_account_number || '');
    if (data.ifsc_code !== undefined) formData.append('ifsc_code', data.ifsc_code || '');
    if (data.bank_branch !== undefined) formData.append('bank_branch', data.bank_branch || '');

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/contract-workers/${id}/`, {
      method: 'PATCH',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Delete a contract worker
   */
  async deleteContractWorker(id: number): Promise<void> {
    await this.request(`/api/contract-workers/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Bulk upload contract workers from Excel file
   */
  async bulkUploadContractWorkers(file: File): Promise<BulkUploadContractWorkerResponse> {
    const formData = new FormData();
    formData.append('excel_file', file);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/contract-workers/bulk-upload/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Bulk upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Download contract worker bulk import template
   */
  async downloadContractWorkerTemplate(): Promise<Blob> {
    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    const response = await fetch(`${this.baseURL}/api/contract-workers/download-template/`, {
      method: 'GET',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Attendance Management APIs
   */

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics(): Promise<AttendanceStatisticsResponse> {
    return this.request<AttendanceStatisticsResponse>('/api/attendance/statistics/');
  }

  /**
   * Get attendance records with filters
   */
  async getAttendanceRecords(params?: {
    search?: string;
    employee?: number;
    date?: string;
    month?: number;
    year?: number;
    attendance_status?: 'Present' | 'Absent' | 'Half-Day' | 'Leave';
    approval_status?: 'Approved' | 'Pending' | 'Rejected';
    date_from?: string;
    date_to?: string;
    page?: number;
  }): Promise<AttendanceListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.employee) queryParams.append('employee', params.employee.toString());
    if (params?.date) queryParams.append('date', params.date);
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.attendance_status) queryParams.append('attendance_status', params.attendance_status);
    if (params?.approval_status) queryParams.append('approval_status', params.approval_status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/attendance/${queryString ? `?${queryString}` : ''}`;
    return this.request<AttendanceListResponse>(endpoint);
  }

  /**
   * Get attendance record details
   */
  async getAttendanceRecord(id: number): Promise<AttendanceDetail> {
    return this.request<AttendanceDetail>(`/api/attendance/${id}/`);
  }

  /**
   * Create or update attendance record
   */
  async createAttendance(data: AttendanceCreateData): Promise<AttendanceDetail> {
    const formData = new FormData();
    formData.append('employee', data.employee.toString());
    formData.append('attendance_date', data.attendance_date);
    formData.append('attendance_status', data.attendance_status);
    if (data.check_in_time) formData.append('check_in_time', data.check_in_time);
    if (data.check_out_time) formData.append('check_out_time', data.check_out_time);
    if (data.notes) formData.append('notes', data.notes);

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/attendance/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Create failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Update attendance record
   */
  async updateAttendance(id: number, data: Partial<AttendanceCreateData>): Promise<AttendanceDetail> {
    const formData = new FormData();
    if (data.employee) formData.append('employee', data.employee.toString());
    if (data.attendance_date) formData.append('attendance_date', data.attendance_date);
    if (data.attendance_status) formData.append('attendance_status', data.attendance_status);
    if (data.check_in_time !== undefined) formData.append('check_in_time', data.check_in_time || '');
    if (data.check_out_time !== undefined) formData.append('check_out_time', data.check_out_time || '');
    if (data.notes !== undefined) formData.append('notes', data.notes || '');

    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/attendance/${id}/`, {
      method: 'PATCH',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(id: number): Promise<void> {
    await this.request(`/api/attendance/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Bulk approve/reject attendance records
   */
  async bulkApproveAttendance(data: BulkApproveAttendanceRequest): Promise<BulkApproveAttendanceResponse> {
    return this.request<BulkApproveAttendanceResponse>('/api/attendance/bulk-approve/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Payroll Management APIs
   */

  /**
   * Get payroll statistics
   */
  async getPayrollStatistics(params?: {
    month?: number;
    year?: number;
  }): Promise<PayrollStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/payroll/statistics/${queryString ? `?${queryString}` : ''}`;
    return this.request<PayrollStatisticsResponse>(endpoint);
  }

  /**
   * Get payroll records with filters
   */
  async getPayrollRecords(params?: {
    search?: string;
    month?: number;
    year?: number;
    payment_status?: 'Paid' | 'Pending';
    page?: number;
  }): Promise<PayrollListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/payroll/${queryString ? `?${queryString}` : ''}`;
    return this.request<PayrollListResponse>(endpoint);
  }

  /**
   * Get payroll record details
   */
  async getPayrollRecord(id: number): Promise<PayrollDetail> {
    return this.request<PayrollDetail>(`/api/payroll/${id}/`);
  }

  /**
   * Create payroll record
   */
  async createPayroll(data: PayrollCreateData): Promise<PayrollDetail> {
    return this.request<PayrollDetail>('/api/payroll/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update payroll record
   */
  async updatePayroll(id: number, data: Partial<PayrollCreateData>): Promise<PayrollDetail> {
    return this.request<PayrollDetail>(`/api/payroll/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete payroll record
   */
  async deletePayroll(id: number): Promise<void> {
    await this.request(`/api/payroll/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Mark payroll record as paid
   */
  async markPayrollPaid(id: number, data: PayrollMarkPaidRequest): Promise<PayrollDetail> {
    return this.request<PayrollDetail>(`/api/payroll/${id}/mark-paid/`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Bulk mark payroll records as paid
   */
  async bulkMarkPayrollPaid(data: BulkMarkPayrollPaidRequest): Promise<BulkMarkPayrollPaidResponse> {
    return this.request<BulkMarkPayrollPaidResponse>('/api/payroll/bulk-mark-paid/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Payment Tracker (Contract Worker Payment Tracking) API Methods
   */

  /**
   * Get payment tracker statistics
   */
  async getPaymentTrackerStatistics(params?: {
    month?: number;
    year?: number;
  }): Promise<PaymentTrackerStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/payment-tracker/statistics/${queryString ? `?${queryString}` : ''}`;
    return this.request<PaymentTrackerStatisticsResponse>(endpoint);
  }

  /**
   * Get payment tracker records with filters
   */
  async getPaymentTrackerRecords(params?: {
    search?: string;
    month?: number;
    year?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaymentTrackerListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/payment-tracker/${queryString ? `?${queryString}` : ''}`;
    return this.request<PaymentTrackerListResponse>(endpoint);
  }

  /**
   * Download payment tracker Excel template
   */
  async downloadPaymentTrackerTemplate(): Promise<Blob> {
    // Ensure we have a CSRF token before making the request
    await this.ensureCsrfToken();
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    const response = await fetch(`${this.baseURL}/api/payment-tracker/download-template/`, {
      method: 'GET',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Get payment tracker record details
   */
  async getPaymentTrackerRecord(id: number): Promise<PaymentTrackerDetail> {
    return this.request<PaymentTrackerDetail>(`/api/payment-tracker/${id}/`);
  }

  /**
   * Upload Excel sheet with payment data
   */
  async uploadPaymentTrackerSheet(data: PaymentTrackerUploadRequest): Promise<PaymentTrackerUploadResponse> {
    await this.ensureCsrfToken();

    const formData = new FormData();
    formData.append('month', data.month.toString());
    formData.append('year', data.year.toString());
    formData.append('excel_file', data.excel_file);

    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    // CRITICAL: credentials: 'include' is required to send cookies (sessionid, csrftoken)
    // Without this, Django won't receive the session cookie and CSRF validation will fail
    const response = await fetch(`${this.baseURL}/api/payment-tracker/upload/`, {
      method: 'POST',
      headers,
      credentials: 'include', // Required for cookies and CSRF protection
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Mark payment tracker record as paid
   */
  async markPaymentTrackerPaid(id: number, data: PaymentTrackerMarkPaidRequest): Promise<PaymentTrackerDetail> {
    return this.request<PaymentTrackerDetail>(`/api/payment-tracker/${id}/mark-paid/`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Bulk mark payment tracker records as paid
   */
  async bulkMarkPaymentTrackerPaid(data: BulkMarkPaymentTrackerPaidRequest): Promise<BulkMarkPaymentTrackerPaidResponse> {
    return this.request<BulkMarkPaymentTrackerPaidResponse>('/api/payment-tracker/bulk-mark-paid/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete payment tracker record
   */
  async deletePaymentTracker(id: number): Promise<void> {
    await this.request(`/api/payment-tracker/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Stock Management (Inventory) API Methods
   */

  /**
   * Get stock statistics
   */
  async getStockStatistics(): Promise<StockStatisticsResponse> {
    return this.request<StockStatisticsResponse>('/api/stocks/statistics/');
  }

  /**
   * Get stock items with filters
   */
  async getStocks(params?: {
    search?: string;
    page?: number;
  }): Promise<StockListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/stocks/${queryString ? `?${queryString}` : ''}`;
    return this.request<StockListResponse>(endpoint);
  }

  /**
   * Get stock item details
   */
  async getStock(id: number): Promise<StockDetail> {
    return this.request<StockDetail>(`/api/stocks/${id}/`);
  }

  /**
   * Create stock item
   */
  async createStock(data: StockCreateData): Promise<StockDetail> {
    return this.request<StockDetail>('/api/stocks/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update stock item
   */
  async updateStock(id: number, data: Partial<StockCreateData>): Promise<StockDetail> {
    return this.request<StockDetail>(`/api/stocks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete stock item
   */
  async deleteStock(id: number): Promise<void> {
    await this.request(`/api/stocks/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Task Resources Dashboard API Methods
   */

  /**
   * Get task resources statistics
   */
  async getTaskResourcesStatistics(params?: {
    month?: number;
    year?: number;
  }): Promise<TaskResourcesStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/task-resources/statistics/${queryString ? `?${queryString}` : ''}`;
    return this.request<TaskResourcesStatisticsResponse>(endpoint);
  }

  /**
   * Get task resources list with filters
   */
  async getTaskResources(params?: {
    search?: string;
    month?: number;
    year?: number;
    page?: number;
  }): Promise<TaskResourcesListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/task-resources/${queryString ? `?${queryString}` : ''}`;
    return this.request<TaskResourcesListResponse>(endpoint);
  }

  /**
   * Get task resources details
   */
  async getTaskResource(id: number): Promise<TaskResourceDetail> {
    return this.request<TaskResourceDetail>(`/api/task-resources/${id}/`);
  }

  /**
   * Notifications API Methods
   */

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(): Promise<NotificationStatisticsResponse> {
    return this.request<NotificationStatisticsResponse>('/api/notifications/statistics/');
  }

  /**
   * Get notifications list with filters
   */
  async getNotifications(params?: {
    search?: string;
    type?: string;
    is_read?: boolean;
    show_scheduled?: boolean;
    show_sent_by_me?: boolean;
    page?: number;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());
    if (params?.show_scheduled !== undefined) queryParams.append('show_scheduled', params.show_scheduled.toString());
    if (params?.show_sent_by_me !== undefined) queryParams.append('show_sent_by_me', params.show_sent_by_me.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/notifications/${queryString ? `?${queryString}` : ''}`;

    return this.request<NotificationListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get notification details
   */
  async getNotification(id: number): Promise<NotificationDetail> {
    return this.request<NotificationDetail>(`/api/notifications/${id}/`);
  }

  /**
   * Create notification (owner only - sends to all employees)
   */
  async createNotification(data: NotificationCreateData): Promise<NotificationDetail> {
    return this.request<NotificationDetail>('/api/notifications/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: number): Promise<NotificationDetail> {
    return this.request<NotificationDetail>(`/api/notifications/${id}/mark-read/`, {
      method: 'POST',
    });
  }

  /**
   * Bulk mark notifications as read
   */
  async bulkMarkNotificationsAsRead(data: BulkMarkReadRequest): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('/api/notifications/bulk-mark-read/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: number): Promise<void> {
    await this.request(`/api/notifications/${id}/`, {
      method: 'DELETE',
    });
  }

  async cancelScheduledNotification(id: number): Promise<{ cancelled_count: number; message: string }> {
    return this.request<{ cancelled_count: number; message: string }>(`/api/notifications/${id}/cancel-scheduled/`, {
      method: 'POST',
    });
  }

  async bulkDeleteNotifications(notificationIds: number[]): Promise<{ deleted_count: number; skipped_count: number; errors?: string[] }> {
    return this.request<{ deleted_count: number; skipped_count: number; errors?: string[] }>('/api/notifications/bulk-delete/', {
      method: 'POST',
      body: JSON.stringify({ notification_ids: notificationIds }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Email Templates API Methods
   */

  /**
   * Get email templates list with search
   */
  async getEmailTemplates(params?: {
    search?: string;
    page?: number;
  }): Promise<EmailTemplateListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/email-templates/${queryString ? `?${queryString}` : ''}`;
    return this.request<EmailTemplateListResponse>(endpoint);
  }

  /**
   * Get email template details
   */
  async getEmailTemplate(id: number): Promise<EmailTemplateDetail> {
    return this.request<EmailTemplateDetail>(`/api/email-templates/${id}/`);
  }

  /**
   * Create email template
   */
  async createEmailTemplate(data: EmailTemplateCreateData): Promise<EmailTemplateDetail> {
    return this.request<EmailTemplateDetail>('/api/email-templates/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(id: number, data: Partial<EmailTemplateCreateData>): Promise<EmailTemplateDetail> {
    return this.request<EmailTemplateDetail>(`/api/email-templates/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete email template
   */
  async deleteEmailTemplate(id: number): Promise<void> {
    await this.request(`/api/email-templates/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Send email using template
   */
  async sendEmailUsingTemplate(id: number, data: EmailTemplateSendRequest): Promise<EmailTemplateSendResponse> {
    return this.request<EmailTemplateSendResponse>(`/api/email-templates/${id}/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Bank Accounts API Methods
   */

  /**
   * Get bank accounts list with search and filters
   */
  async getBankAccounts(params?: {
    search?: string;
    profile_id?: number;
    bank_name?: string;
    page?: number;
  }): Promise<BankAccountListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.profile_id) queryParams.append('profile_id', params.profile_id.toString());
    if (params?.bank_name) queryParams.append('bank_name', params.bank_name);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/bank-accounts/${queryString ? `?${queryString}` : ''}`;
    return this.request<BankAccountListResponse>(endpoint);
  }

  /**
   * Get bank account details
   */
  async getBankAccount(id: number): Promise<BankAccountDetail> {
    return this.request<BankAccountDetail>(`/api/bank-accounts/${id}/`);
  }

  /**
   * Create bank account
   */
  async createBankAccount(data: BankAccountCreateData): Promise<BankAccountDetail> {
    return this.request<BankAccountDetail>('/api/bank-accounts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update bank account
   */
  async updateBankAccount(id: number, data: Partial<BankAccountCreateData>): Promise<BankAccountDetail> {
    return this.request<BankAccountDetail>(`/api/bank-accounts/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(id: number): Promise<void> {
    await this.request(`/api/bank-accounts/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Holiday Calendar API Methods
   */

  /**
   * Get holiday calendar statistics
   */
  async getHolidayCalendarStatistics(): Promise<HolidayCalendarStatisticsResponse> {
    return this.request<HolidayCalendarStatisticsResponse>('/api/holidays/statistics/');
  }

  /**
   * Get holidays list with search and filters
   */
  async getHolidays(params?: {
    search?: string;
    type?: 'National' | 'Festival' | 'Company';
    year?: number;
    page?: number;
  }): Promise<HolidayCalendarListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/holidays/${queryString ? `?${queryString}` : ''}`;
    return this.request<HolidayCalendarListResponse>(endpoint);
  }

  /**
   * Get holiday details
   */
  async getHoliday(id: number): Promise<HolidayCalendarDetail> {
    return this.request<HolidayCalendarDetail>(`/api/holidays/${id}/`);
  }

  /**
   * Create holiday
   */
  async createHoliday(data: HolidayCalendarCreateData): Promise<HolidayCalendarDetail> {
    return this.request<HolidayCalendarDetail>('/api/holidays/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update holiday
   */
  async updateHoliday(id: number, data: Partial<HolidayCalendarCreateData>): Promise<HolidayCalendarDetail> {
    return this.request<HolidayCalendarDetail>(`/api/holidays/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete holiday
   */
  async deleteHoliday(id: number): Promise<void> {
    await this.request(`/api/holidays/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Learning / Training Videos API Methods
   */

  /**
   * Get training videos list
   */
  async getTrainingVideos(params?: {
    search?: string;
    page?: number;
  }): Promise<BackendTrainingVideoListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/training-videos/${queryString ? `?${queryString}` : ''}`;
    return this.request<BackendTrainingVideoListResponse>(endpoint);
  }

  /**
   * Get training video details
   */
  async getTrainingVideo(id: number): Promise<BackendTrainingVideoDetail> {
    return this.request<BackendTrainingVideoDetail>(`/api/training-videos/${id}/`);
  }

  /**
   * Create training video
   */
  async createTrainingVideo(data: TrainingVideoCreateData): Promise<BackendTrainingVideoDetail> {
    return this.request<BackendTrainingVideoDetail>('/api/training-videos/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update training video
   */
  async updateTrainingVideo(id: number, data: Partial<TrainingVideoCreateData>): Promise<BackendTrainingVideoDetail> {
    return this.request<BackendTrainingVideoDetail>(`/api/training-videos/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete training video
   */
  async deleteTrainingVideo(id: number): Promise<void> {
    await this.request(`/api/training-videos/${id}/`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Test API connection
 * Useful for debugging connection issues
 */
export async function testApiConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/swagger/`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    });
    return { connected: response.ok || response.status < 500 };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Cannot connect to API server',
    };
  }
}


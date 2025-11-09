export type Client = {
  id: number;
  name: string;
  business_name?: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  secondary_contact?: string;
  notes?: string;
  tags: string[];
  amc_count: number;
  open_projects: number;
  outstanding_amount: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
};

export type ClientActivity = {
  id: number;
  client_id: number;
  type: "Task Created" | "Bill Generated" | "Email Sent" | "Project Started" | "AMC Created" | "Payment Received";
  description: string;
  performed_by: string;
  timestamp: string;
};

export type AMC = {
  id: number;
  client_id: number;
  client_name?: string;
  amc_number: string;
  start_date: string;
  end_date: string;
  status: "Pending" | "Active" | "Expired" | "Canceled";
  billing_cycle: "Monthly" | "Quarterly" | "Half-yearly" | "Yearly";
  amount: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type AMCBilling = {
  id: number;
  amc_id: number;
  bill_number: string;
  bill_date?: string;
  period_from: string;
  period_to: string;
  amount: number;
  paid: boolean;
  payment_date?: string;
  payment_mode?: "Cash" | "Cheque" | "Bank Transfer" | "UPI";
  notes?: string;
};

export type AMCActivity = {
  id: number;
  amc_id: number;
  type: "Bill Generated" | "Payment Received" | "Reminder Sent" | "AMC Renewed" | "AMC Canceled" | "Bill Canceled";
  description: string;
  performed_by: string;
  timestamp: string;
};

export type Tender = {
  id: number;
  name: string;
  reference_number: string;
  description: string;
  filed_date?: string;
  start_date: string;
  end_date: string;
  estimated_value: number;
  status: "Draft" | "Filed" | "Awarded" | "Lost" | "Closed";
  created_at: string;
  updated_at: string;
};

export type TenderFinancials = {
  id: number;
  tender_id: number;
  emd_amount: number; // 5% of estimated value
  emd_refundable: boolean;
  emd_refund_date?: string;
  emd_collected?: boolean;
  emd_collection_date?: string;
  sd1_amount: number; // 2% of estimated value (Security Deposit 1)
  sd1_refundable: boolean;
  sd1_refund_date?: string;
  sd2_amount: number; // 3% of estimated value (Security Deposit 2)
  sd2_refundable: boolean;
  sd2_refund_date?: string;
  dd_date?: string; // Demand Draft Date
  dd_number?: string; // Demand Draft Number
  dd_amount?: number; // Demand Draft Amount
  dd_beneficiary_name?: string; // Beneficiary Name
  dd_bank_name?: string; // Bank Name
  notes?: string;
};

export type TenderDocument = {
  id: number;
  tender_id: number;
  document_id: number; // Links to DocumentTemplate
  document_title?: string;
  attached_at: string;
  attached_by: string;
};

export type TenderActivity = {
  id: number;
  tender_id: number;
  type: "Status Changed" | "Document Attached" | "Reminder Sent" | "Financial Updated" | "Note Added" | "Refund Marked";
  description: string;
  performed_by: string;
  timestamp: string;
};

export type Employee = {
  id: number;
  profile_id: number;
  employee_code: string;
  designation: "Technician" | "Field Staff" | "Computer Operator" | "Other";
  department: string;
  joining_date: string;
  created_at: string;
  updated_at: string;
};

export type ContractWorker = {
  id: number;
  profile_id: number;
  project_id: number;
  name: string;
  worker_type: "Unskilled" | "Semi-Skilled" | "Skilled";
  monthly_salary: number;
  aadhar_no: string;
  uan_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pf_number?: string;
  esi_number?: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: number;
  client_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled";
  created_at: string;
  updated_at: string;
};

export type TaskStatus = "Open" | "In Progress" | "Completed" | "Approved" | "Rejected";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type Task = {
  id: number;
  employee_id: number;
  employee_name?: string; // For display
  client_id?: number;
  client_name?: string; // For display
  project_id?: number;
  project_name?: string; // For display
  description: string;
  date: string;
  location: string;
  time_taken_minutes: number;
  estimated_time_minutes?: number;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_by?: string; // Owner who assigned
  approved_by?: string; // Owner who approved
  approved_at?: string;
  internal_notes?: string; // Owner notes
  is_new?: boolean; // Unread flag for owner
  created_at: string;
  updated_at: string;
};

export type TaskResource = {
  id: number;
  task_id: number;
  resource_name: string;
  quantity: number;
  unit: string; // uom (e.g., "kg", "pcs", "hrs")
  unit_cost?: number; // Owner-entered cost per unit
  total_cost?: number; // Calculated: unit_cost * quantity
  notes?: string;
  created_at: string;
};

export type TaskAttachment = {
  id: number;
  task_id: number;
  file_name: string;
  file_url: string;
  file_type: "image" | "pdf" | "doc" | "other";
  file_size: number; // in bytes
  uploaded_by: string; // Employee or Owner
  uploaded_at: string;
  notes?: string;
};

export type TaskActivity = {
  id: number;
  task_id: number;
  type: "Created" | "Status Changed" | "Assigned" | "Edited" | "Approved" | "Rejected" | "Resource Updated" | "Note Added";
  description: string;
  performed_by: string;
  timestamp: string;
};

export type Notification = {
  id: number;
  recipient_id: number;
  title: string;
  message: string;
  type: "Task" | "AMC" | "Tender" | "Payroll" | "System" | "Other";
  channel: "In-App" | "Email" | "Push";
  is_read: boolean;
  created_at: string;
};

export type DocumentTemplate = {
  id: number;
  title: string;
  category: "Work Order" | "Experience Certificate" | "Tender Document" | "Affidavit" | "AMC" | "Invoice" | "Contract" | "Report" | "Other";
  firm_id?: number;
  tags: string[];
  latest_version_number: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentVersion = {
  id: number;
  template_id: number;
  version_number: number;
  file_name: string;
  file_type: "pdf" | "docx";
  file_size: number;
  file_url: string;
  is_published: boolean;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
};

export type PaymentMode = "Cash" | "Cheque" | "Bank Transfer" | "UPI" | "NEFT/RTGS";
export type PaymentStatus = "Pending" | "Paid" | "Hold" | "Overdue" | "Cancelled";

export type PayrollRecord = {
  id: number;
  employee_id?: number;
  contract_worker_id?: number;
  employee_name: string;
  employee_type: "Employee" | "Contract Worker";
  period_start: string;
  period_end: string;
  working_days: number;
  days_present: number;
  days_absent: number;
  base_salary: number;
  gross_amount: number;
  deductions: number;
  deduction_details?: string;
  net_amount: number;
  payment_status: PaymentStatus;
  payment_date?: string;
  payment_mode?: PaymentMode;
  bank_transaction_ref?: string;
  notes?: string;
  computation_details?: PayrollComputation;
  created_at: string;
  updated_at: string;
};

export type PayrollComputation = {
  base_salary: number;
  working_days: number;
  days_present: number;
  per_day_rate: number;
  earned_salary: number;
  allowances?: {
    name: string;
    amount: number;
  }[];
  gross_amount: number;
  deductions: {
    name: string;
    amount: number;
  }[];
  total_deductions: number;
  net_amount: number;
};

export type PaymentCategory = "Vendor" | "Contractor" | "Employee" | "Utility" | "Other";

export type Payment = {
  id: number;
  payment_number: string;
  vendor_name?: string;
  contractor_id?: number;
  contractor_name?: string;
  employee_id?: number;
  employee_name?: string;
  category: PaymentCategory;
  amount: number;
  description: string;
  due_date: string;
  paid_date?: string;
  status: PaymentStatus;
  payment_mode?: PaymentMode;
  transaction_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type NotificationType = "Task" | "Bill" | "Tender" | "Payroll" | "System" | "Reminder";

export type NotificationRecord = {
  id: number;
  recipient_id: number;
  recipient_name?: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  meta?: Record<string, any>;
  created_at: string;
  read_at?: string;
};

export type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: number;
  name: string;
  unit_of_measure: string;
  stock_count?: number;
  unit_price?: number;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type ProjectResource = {
  id: number;
  project_id: number;
  resource_id: number;
  resource_name?: string;
  quantity_used: number;
  unit_price: number;
  total_cost: number;
  used_date: string;
  notes?: string;
};

export type ReportType = "AMC Billing Summary" | "Outstanding Receivables" | "Payroll Summary" | "Tasks by Employee" | "Tender Pipeline" | "Custom";

export type Report = {
  id: number;
  name: string;
  type: ReportType;
  description?: string;
  filters?: Record<string, any>;
  data?: any[];
  created_at: string;
  created_by: string;
};

export type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  account_holder_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Holiday = {
  id: number;
  date: string;
  name: string;
  type: "National" | "Regional" | "Company";
  is_optional: boolean;
  created_at: string;
};

export type SystemSettings = {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website?: string;
  gst_number?: string;
  pan_number?: string;
  billing_currency: string;
  timezone: string;
  date_format: string;
  reminder_days_before: number;
  auto_backup_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
};

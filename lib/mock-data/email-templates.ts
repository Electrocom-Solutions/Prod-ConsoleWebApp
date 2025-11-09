import { EmailTemplate } from "@/types";

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: "AMC Bill Reminder",
    subject: "Payment Reminder - AMC Bill {{amc_number}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0284c7;">Payment Reminder</h2>
  <p>Dear {{client_name}},</p>
  <p>This is a friendly reminder that your AMC bill is due for payment.</p>
  <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <p><strong>AMC Number:</strong> {{amc_number}}</p>
    <p><strong>Period:</strong> {{period_from}} to {{period_to}}</p>
    <p><strong>Amount:</strong> ₹{{amount}}</p>
    <p><strong>Due Date:</strong> {{due_date}}</p>
  </div>
  <p>Please make the payment at your earliest convenience to avoid service interruption.</p>
  <p>For any queries, please contact us at {{company_email}} or {{company_phone}}.</p>
  <p>Thank you for your business!</p>
  <p><strong>{{company_name}}</strong></p>
</div>`,
    placeholders: ["client_name", "amc_number", "period_from", "period_to", "amount", "due_date", "company_email", "company_phone", "company_name"],
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-10-20T14:30:00Z",
  },
  {
    id: 2,
    name: "Welcome New Client",
    subject: "Welcome to {{company_name}}!",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #0284c7;">Welcome Aboard!</h1>
  <p>Dear {{client_name}},</p>
  <p>Thank you for choosing {{company_name}} as your service partner. We are excited to work with you!</p>
  <div style="background: #dbeafe; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h3 style="margin-top: 0;">Your Account Details</h3>
    <p><strong>Client ID:</strong> {{client_id}}</p>
    <p><strong>Primary Contact:</strong> {{contact_name}}</p>
    <p><strong>Email:</strong> {{contact_email}}</p>
    <p><strong>Phone:</strong> {{contact_phone}}</p>
  </div>
  <p>Our team will reach out to you shortly to discuss your requirements and schedule an initial consultation.</p>
  <p>If you have any immediate questions, feel free to contact us:</p>
  <p>📧 {{company_email}}<br>📞 {{company_phone}}</p>
  <p>We look forward to serving you!</p>
  <p>Best regards,<br><strong>{{company_name}} Team</strong></p>
</div>`,
    placeholders: ["client_name", "company_name", "client_id", "contact_name", "contact_email", "contact_phone", "company_email", "company_phone"],
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-02-01T09:00:00Z",
  },
  {
    id: 3,
    name: "Task Assignment",
    subject: "New Task Assigned - {{task_id}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0284c7;">New Task Assigned</h2>
  <p>Hello {{employee_name}},</p>
  <p>You have been assigned a new task. Please review the details below:</p>
  <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <p><strong>Task ID:</strong> {{task_id}}</p>
    <p><strong>Description:</strong> {{task_description}}</p>
    <p><strong>Client:</strong> {{client_name}}</p>
    <p><strong>Location:</strong> {{location}}</p>
    <p><strong>Date:</strong> {{task_date}}</p>
    <p><strong>Priority:</strong> <span style="color: #dc2626;">{{priority}}</span></p>
  </div>
  <p>Please confirm receipt and update the task status upon completion.</p>
  <p>For any clarifications, contact your supervisor.</p>
  <p>Best regards,<br><strong>{{company_name}}</strong></p>
</div>`,
    placeholders: ["employee_name", "task_id", "task_description", "client_name", "location", "task_date", "priority", "company_name"],
    created_at: "2025-03-10T11:00:00Z",
    updated_at: "2025-09-15T16:00:00Z",
  },
  {
    id: 4,
    name: "Payslip - Monthly",
    subject: "Payslip for {{month_year}} - {{employee_name}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0284c7;">Payslip for {{month_year}}</h2>
  <p>Dear {{employee_name}},</p>
  <p>Please find your payslip details for {{month_year}} below:</p>
  <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h3 style="margin-top: 0;">Earnings</h3>
    <p><strong>Base Salary:</strong> ₹{{base_salary}}</p>
    <p><strong>Allowances:</strong> ₹{{allowances}}</p>
    <p><strong>Gross Salary:</strong> ₹{{gross_salary}}</p>
    <hr style="border: 1px solid #d1d5db;">
    <h3>Deductions</h3>
    <p><strong>PF:</strong> ₹{{pf}}</p>
    <p><strong>ESI:</strong> ₹{{esi}}</p>
    <p><strong>Professional Tax:</strong> ₹{{professional_tax}}</p>
    <p><strong>Total Deductions:</strong> ₹{{total_deductions}}</p>
    <hr style="border: 1px solid #d1d5db;">
    <h3 style="color: #0284c7;">Net Salary: ₹{{net_salary}}</h3>
  </div>
  <p>Payment will be credited to your bank account on {{payment_date}}.</p>
  <p>For any queries, please contact HR at {{hr_email}}.</p>
  <p>Best regards,<br><strong>{{company_name}}</strong></p>
</div>`,
    placeholders: ["employee_name", "month_year", "base_salary", "allowances", "gross_salary", "pf", "esi", "professional_tax", "total_deductions", "net_salary", "payment_date", "hr_email", "company_name"],
    created_at: "2025-04-05T10:00:00Z",
    updated_at: "2025-04-05T10:00:00Z",
  },
  {
    id: 5,
    name: "Tender Submission Confirmation",
    subject: "Tender Submitted - {{tender_name}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0284c7;">Tender Submission Confirmation</h2>
  <p>Dear Team,</p>
  <p>This is to confirm that we have successfully submitted our bid for the following tender:</p>
  <div style="background: #dbeafe; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <p><strong>Tender Name:</strong> {{tender_name}}</p>
    <p><strong>Reference Number:</strong> {{reference_number}}</p>
    <p><strong>Estimated Value:</strong> ₹{{estimated_value}}</p>
    <p><strong>Submission Date:</strong> {{submission_date}}</p>
    <p><strong>Result Date:</strong> {{result_date}}</p>
  </div>
  <p>All required documents have been submitted and EMD payment has been made.</p>
  <p>We will keep you updated on the progress.</p>
  <p>Best regards,<br><strong>{{company_name}}</strong></p>
</div>`,
    placeholders: ["tender_name", "reference_number", "estimated_value", "submission_date", "result_date", "company_name"],
    created_at: "2025-05-20T15:00:00Z",
    updated_at: "2025-05-20T15:00:00Z",
  },
];

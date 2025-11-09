import { PayrollRecord, PayrollComputation } from "@/types";

function computePayroll(params: {
  baseSalary: number;
  workingDays: number;
  daysPresent: number;
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
}): { gross_amount: number; deductions: number; net_amount: number; computation_details: PayrollComputation } {
  const { baseSalary, workingDays, daysPresent, allowances = [], deductions = [] } = params;

  const perDayRate = Math.round(baseSalary / workingDays);
  const earnedSalary = perDayRate * daysPresent;
  const allowancesTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
  const grossAmount = earnedSalary + allowancesTotal;
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netAmount = grossAmount - totalDeductions;

  const computation: PayrollComputation = {
    base_salary: baseSalary,
    working_days: workingDays,
    days_present: daysPresent,
    per_day_rate: perDayRate,
    earned_salary: earnedSalary,
    allowances: allowances.length > 0 ? allowances : undefined,
    gross_amount: grossAmount,
    deductions,
    total_deductions: totalDeductions,
    net_amount: netAmount,
  };

  return { 
    gross_amount: grossAmount, 
    deductions: totalDeductions, 
    net_amount: netAmount, 
    computation_details: computation 
  };
}

export const mockPayrollRecords: PayrollRecord[] = [
  {
    id: 1,
    employee_id: 101,
    employee_name: "Rajesh Kumar",
    employee_type: "Employee",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 26,
    days_absent: 0,
    base_salary: 35000,
    ...computePayroll({
      baseSalary: 35000,
      workingDays: 26,
      daysPresent: 26,
      allowances: [
        { name: "Conveyance", amount: 2000 },
        { name: "HRA", amount: 3500 },
      ],
      deductions: [
        { name: "PF", amount: 1750 },
        { name: "ESI", amount: 525 },
      ],
    }),
    payment_status: "Paid",
    payment_date: "2025-11-01",
    payment_mode: "Bank Transfer",
    bank_transaction_ref: "TXN1234567890",
    notes: "October 2025 salary",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-11-01T14:30:00Z",
  },
  {
    id: 2,
    employee_id: 102,
    employee_name: "Priya Sharma",
    employee_type: "Employee",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 24,
    days_absent: 2,
    base_salary: 28000,
    ...computePayroll({
      baseSalary: 28000,
      workingDays: 26,
      daysPresent: 24,
      allowances: [
        { name: "Conveyance", amount: 1500 },
        { name: "HRA", amount: 2800 },
      ],
      deductions: [
        { name: "PF", amount: 1400 },
        { name: "ESI", amount: 420 },
      ],
    }),
    payment_status: "Pending",
    notes: "October 2025 salary - 2 days absent",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-10-31T10:00:00Z",
  },
  {
    id: 3,
    employee_id: 103,
    employee_name: "Amit Patel",
    employee_type: "Employee",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 26,
    days_absent: 0,
    base_salary: 42000,
    ...computePayroll({
      baseSalary: 42000,
      workingDays: 26,
      daysPresent: 26,
      allowances: [
        { name: "Conveyance", amount: 2500 },
        { name: "HRA", amount: 4200 },
        { name: "Special Allowance", amount: 3000 },
      ],
      deductions: [
        { name: "PF", amount: 2100 },
        { name: "ESI", amount: 630 },
        { name: "Professional Tax", amount: 200 },
      ],
    }),
    payment_status: "Pending",
    notes: "October 2025 salary",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-10-31T10:00:00Z",
  },
  {
    id: 4,
    contract_worker_id: 201,
    employee_name: "Ramesh Singh",
    employee_type: "Contract Worker",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 22,
    days_absent: 4,
    base_salary: 18000,
    ...computePayroll({
      baseSalary: 18000,
      workingDays: 26,
      daysPresent: 22,
      deductions: [
        { name: "Advance Deduction", amount: 2000 },
      ],
    }),
    payment_status: "Hold",
    notes: "October 2025 - On hold due to advance adjustment",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-10-31T10:00:00Z",
  },
  {
    id: 5,
    contract_worker_id: 202,
    employee_name: "Sunil Yadav",
    employee_type: "Contract Worker",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 26,
    days_absent: 0,
    base_salary: 22000,
    ...computePayroll({
      baseSalary: 22000,
      workingDays: 26,
      daysPresent: 26,
      deductions: [],
    }),
    payment_status: "Paid",
    payment_date: "2025-11-01",
    payment_mode: "Cash",
    notes: "October 2025 - Full attendance",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-11-01T09:00:00Z",
  },
  {
    id: 6,
    employee_id: 104,
    employee_name: "Anita Desai",
    employee_type: "Employee",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 25,
    days_absent: 1,
    base_salary: 32000,
    ...computePayroll({
      baseSalary: 32000,
      workingDays: 26,
      daysPresent: 25,
      allowances: [
        { name: "Conveyance", amount: 2000 },
        { name: "HRA", amount: 3200 },
      ],
      deductions: [
        { name: "PF", amount: 1600 },
        { name: "ESI", amount: 480 },
      ],
    }),
    payment_status: "Pending",
    notes: "October 2025 salary - 1 day sick leave",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-10-31T10:00:00Z",
  },
  {
    id: 7,
    contract_worker_id: 203,
    employee_name: "Manoj Kumar",
    employee_type: "Contract Worker",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 20,
    days_absent: 6,
    base_salary: 20000,
    ...computePayroll({
      baseSalary: 20000,
      workingDays: 26,
      daysPresent: 20,
      deductions: [],
    }),
    payment_status: "Pending",
    notes: "October 2025 - Multiple absences",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-10-31T10:00:00Z",
  },
  {
    id: 8,
    employee_id: 105,
    employee_name: "Deepak Verma",
    employee_type: "Employee",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    working_days: 26,
    days_present: 26,
    days_absent: 0,
    base_salary: 38000,
    ...computePayroll({
      baseSalary: 38000,
      workingDays: 26,
      daysPresent: 26,
      allowances: [
        { name: "Conveyance", amount: 2200 },
        { name: "HRA", amount: 3800 },
        { name: "Performance Bonus", amount: 2000 },
      ],
      deductions: [
        { name: "PF", amount: 1900 },
        { name: "ESI", amount: 570 },
      ],
    }),
    payment_status: "Paid",
    payment_date: "2025-11-01",
    payment_mode: "Bank Transfer",
    bank_transaction_ref: "TXN9876543210",
    notes: "October 2025 salary with performance bonus",
    created_at: "2025-10-31T10:00:00Z",
    updated_at: "2025-11-01T16:00:00Z",
  },
];

export function getPayrollRecordsByPeriod(startDate: string, endDate: string): PayrollRecord[] {
  return mockPayrollRecords.filter((record) => {
    const recordStart = new Date(record.period_start);
    const filterStart = new Date(startDate);
    const filterEnd = new Date(endDate);
    
    return recordStart >= filterStart && recordStart <= filterEnd;
  });
}

export function getPayrollRecordById(id: number): PayrollRecord | undefined {
  return mockPayrollRecords.find((record) => record.id === id);
}

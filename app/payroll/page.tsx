"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IndianRupee,
  Users,
  Download,
  FileText,
  Check,
  Eye,
  Search,
  Calendar,
  CheckCircle,
  Plus,
  Edit,
  X,
  Loader2,
  Inbox,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PayrollRecord, PaymentStatus, PaymentMode } from "@/types";
import { format } from "date-fns";
import { PayslipModal } from "@/components/payroll/payslip-modal";
import { MarkPaidModal } from "@/components/payroll/mark-paid-modal";
import { showSuccess, showError, showDeleteConfirm, showAlert, showConfirm } from "@/lib/sweetalert";
import { apiClient, PayrollStatisticsResponse, BackendPayrollListItem, PayrollDetail, PayrollCreateData, BackendEmployeeListItem, EmployeeListResponse } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend payroll list item to frontend PayrollRecord type
 */
function mapBackendPayrollListItemToFrontend(backendPayroll: BackendPayrollListItem): PayrollRecord {
  const netAmount = parseFloat(backendPayroll.net_amount) || 0;
  
  return {
    id: backendPayroll.id,
    employee_id: backendPayroll.employee,
    employee_name: backendPayroll.employee_name || '',
    employee_type: "Employee",
    period_start: backendPayroll.period_from,
    period_end: backendPayroll.period_to,
    working_days: backendPayroll.working_days,
    days_present: backendPayroll.days_present,
    days_absent: backendPayroll.working_days - backendPayroll.days_present,
    base_salary: netAmount,
    gross_amount: netAmount,
    deductions: 0,
    net_amount: netAmount,
    payment_status: backendPayroll.payroll_status === 'Paid' ? 'Paid' : 'Pending' as PaymentStatus,
    payment_date: backendPayroll.payment_date || undefined,
    payment_mode: backendPayroll.payment_mode || undefined,
    bank_transaction_ref: undefined,
    created_at: backendPayroll.created_at,
    updated_at: backendPayroll.created_at,
    computation_details: {
      base_salary: netAmount,
      working_days: backendPayroll.working_days,
      days_present: backendPayroll.days_present,
      per_day_rate: netAmount / backendPayroll.working_days,
      earned_salary: netAmount,
      gross_amount: netAmount,
      deductions: [],
      total_deductions: 0,
      net_amount: netAmount,
    },
  };
}

/**
 * Map backend payroll detail to frontend PayrollRecord type
 */
function mapBackendPayrollDetailToFrontend(backendPayroll: PayrollDetail): PayrollRecord {
  const netAmount = parseFloat(backendPayroll.net_amount) || 0;
  
  return {
    id: backendPayroll.id,
    employee_id: backendPayroll.employee,
    employee_name: backendPayroll.employee_name || '',
    employee_type: "Employee",
    period_start: backendPayroll.period_from,
    period_end: backendPayroll.period_to,
    working_days: backendPayroll.working_days,
    days_present: backendPayroll.days_present,
    days_absent: backendPayroll.working_days - backendPayroll.days_present,
    base_salary: netAmount,
    gross_amount: netAmount,
    deductions: 0,
    net_amount: netAmount,
    payment_status: backendPayroll.payroll_status === 'Paid' ? 'Paid' : 'Pending' as PaymentStatus,
    payment_date: backendPayroll.payment_date || undefined,
    payment_mode: backendPayroll.payment_mode || undefined,
    bank_transaction_ref: backendPayroll.bank_transaction_reference_number || undefined,
    notes: backendPayroll.notes || undefined,
    created_at: backendPayroll.created_at,
    updated_at: backendPayroll.updated_at,
    computation_details: {
      base_salary: netAmount,
      working_days: backendPayroll.working_days,
      days_present: backendPayroll.days_present,
      per_day_rate: netAmount / backendPayroll.working_days,
      earned_salary: netAmount,
      gross_amount: netAmount,
      deductions: [],
      total_deductions: 0,
      net_amount: netAmount,
    },
  };
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function PayrollPageContent() {
  const searchParams = useSearchParams();
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [statistics, setStatistics] = useState<PayrollStatisticsResponse | null>(null);
  const [employees, setEmployees] = useState<BackendEmployeeListItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showBulkMarkPaidModal, setShowBulkMarkPaidModal] = useState(false);
  const [showCreatePayrollModal, setShowCreatePayrollModal] = useState(false);
  const [showEditPayrollSlideOver, setShowEditPayrollSlideOver] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const years = useMemo(() => {
    const startYear = 2020;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  /**
   * Fetch statistics from backend
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getPayrollStatistics({
        month: selectedMonth,
        year: selectedYear,
      });
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching payroll statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, [selectedMonth, selectedYear]);

  /**
   * Fetch employees from backend
   */
  const fetchEmployees = useCallback(async () => {
    try {
      const response: EmployeeListResponse = await apiClient.getEmployees({ page: 1 });
      setEmployees(response.results);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    }
  }, []);

  /**
   * Fetch payroll records from backend
   */
  const fetchPayroll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        month: selectedMonth,
        year: selectedYear,
        page: currentPage,
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      if (statusFilter !== "all") {
        params.payment_status = statusFilter;
      }

      const response = await apiClient.getPayrollRecords(params);
      const mappedPayroll = response.results.map(mapBackendPayrollListItemToFrontend);
      setPayrollRecords(mappedPayroll);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching payroll records:', err);
      setError(err.message || 'Failed to fetch payroll records');
      setPayrollRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, debouncedSearch, statusFilter, currentPage]);

  // Fetch statistics and employees on mount
  useEffect(() => {
    fetchStatistics();
    fetchEmployees();
  }, [fetchStatistics, fetchEmployees]);

  // Fetch payroll records when filters change
  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Handle action=new URL parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setEditingPayroll(null);
      setShowCreatePayrollModal(true);
    }
  }, [searchParams]);

  const stats = useMemo(() => {
    if (!statistics) {
      return {
        totalPayrollCost: 0,
        employeeCount: 0,
        pendingCount: 0,
        paidCount: 0,
      };
    }
    
    return {
      totalPayrollCost: statistics.total_payroll,
      employeeCount: statistics.employees_count,
      pendingCount: statistics.total_payment_pending,
      paidCount: statistics.total_payment_paid,
    };
  }, [statistics]);

  const handleViewPayslip = async (record: PayrollRecord) => {
    try {
      const payrollDetail = await apiClient.getPayrollRecord(record.id);
      const mappedPayroll = mapBackendPayrollDetailToFrontend(payrollDetail);
      setSelectedPayroll(mappedPayroll);
      setShowPayslipModal(true);
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to fetch payroll details");
    }
  };

  const handleMarkPaid = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setShowMarkPaidModal(true);
  };

  const handleMarkPaidSubmit = async (paymentMode: PaymentMode, paymentDate: string, bankTransactionRef?: string) => {
    if (!selectedPayroll) return;

    setIsSaving(true);
    try {
      await apiClient.markPayrollPaid(selectedPayroll.id, {
        payment_date: paymentDate,
        payment_mode: paymentMode,
        bank_transaction_reference_number: bankTransactionRef,
      });
      
      await showSuccess("Payment Marked", `Payroll for ${selectedPayroll.employee_name} marked as paid!`);
      setShowMarkPaidModal(false);
      fetchPayroll();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to mark payroll as paid");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkMarkPaidSubmit = async (paymentMode: PaymentMode, paymentDate: string, bankTransactionRef?: string) => {
    if (selectedRecords.length === 0) return;

    setIsSaving(true);
    try {
      await apiClient.bulkMarkPayrollPaid({
        payroll_ids: selectedRecords,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        bank_transaction_reference_number: bankTransactionRef,
      });

      const count = selectedRecords.length;
      setSelectedRecords([]);
      setShowBulkMarkPaidModal(false);
      await showSuccess("Payments Updated", `Successfully marked ${count} payroll record(s) as paid!`);
      fetchPayroll();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to mark payroll as paid");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (record: PayrollRecord) => {
    const confirmed = await showConfirm(
      "Delete Payroll",
      `Are you sure you want to delete payroll for ${record.employee_name}? This action cannot be undone.`,
      "Yes, delete it",
      "Cancel"
    );

    if (!confirmed) return;

    try {
      await apiClient.deletePayroll(record.id);
      await showSuccess("Payroll deleted successfully");
      fetchPayroll();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to delete payroll");
    }
  };

  const handleToggleSelect = (recordId: number) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === payrollRecords.length && payrollRecords.length > 0) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(payrollRecords.map((r) => r.id));
    }
  };

  const handleBulkMarkPaid = () => {
    if (selectedRecords.length === 0) {
      showError("No Selection", "Please select at least one employee to mark as paid");
      return;
    }
    setShowBulkMarkPaidModal(true);
  };

  const handleExportCSV = () => {
    if (payrollRecords.length === 0) {
      showError("No Data", "No payroll records to export");
      return;
    }

    const escapeCSV = (value: any) => {
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ["Period", "Employee", "Working Days", "Present", "Net Amount", "Status", "Payment Mode", "Payment Date"];
    const rows = payrollRecords.map((record) => [
      format(new Date(record.period_start), "MMM yyyy"),
      record.employee_name,
      record.working_days,
      record.days_present,
      record.net_amount,
      record.payment_status,
      record.payment_mode || "-",
      record.payment_date ? format(new Date(record.payment_date), "dd/MM/yyyy") : "-",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${months[selectedMonth - 1]}-${selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Hold": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <DashboardLayout title="Payroll" breadcrumbs={["Home", "Payroll"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Payroll</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee salary payments
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payroll</p>
              <IndianRupee className="h-5 w-5 text-sky-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              ₹{(stats.totalPayrollCost / 100000).toFixed(2)}L
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {months[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employees</p>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.employeeCount}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Total employees
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <CheckCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingCount}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Awaiting payment
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.paidCount}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Completed
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PaymentStatus | "all");
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => {
                setEditingPayroll(null);
                setShowCreatePayrollModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              Add Payroll
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-80"
          />
        </div>

        {/* Bulk Actions Banner */}
        {selectedRecords.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                {selectedRecords.length} employee{selectedRecords.length > 1 ? "s" : ""} selected
              </p>
              <button
                onClick={handleBulkMarkPaid}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Mark as Paid
              </button>
            </div>
          </div>
        )}

        {/* Payroll Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRecords.length === payrollRecords.length && payrollRecords.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Employee
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Net Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Payment Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Payment Mode
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading payroll records...</span>
                      </div>
                    </td>
                  </tr>
                ) : payrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No payroll records found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or create a new payroll entry</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payrollRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleToggleSelect(record.id)}
                        className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{record.employee_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {record.days_present}/{record.working_days} days present
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                      ₹{record.net_amount?.toLocaleString("en-IN") || 0}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(record.payment_status)}`}>
                        {record.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                      {record.payment_date ? format(new Date(record.payment_date), "dd/MM/yyyy") : "-"}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                      {record.payment_mode || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPayslip(record)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                          title="View Breakdown"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const payrollDetail = await apiClient.getPayrollRecord(record.id);
                              const mappedPayroll = mapBackendPayrollDetailToFrontend(payrollDetail);
                              setEditingPayroll(mappedPayroll);
                              setShowEditPayrollSlideOver(true);
                            } catch (err: any) {
                              await showAlert("Error", err.message || "Failed to fetch payroll details");
                            }
                          }}
                          className="rounded p-1 text-sky-600 hover:bg-sky-50 hover:text-sky-900 dark:text-sky-400 dark:hover:bg-sky-900/30"
                          title="Edit Payroll"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {record.payment_status === "Pending" && (
                          <button
                            onClick={() => handleMarkPaid(record)}
                            className="rounded p-1 text-green-600 hover:bg-green-50 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/30"
                            title="Mark Paid"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {payrollRecords.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayroll && (
        <PayslipModal
          payroll={selectedPayroll}
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
        />
      )}

      {/* Mark Paid Modal */}
      {selectedPayroll && (
        <MarkPaidModal
          payroll={selectedPayroll}
          isSaving={isSaving}
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          onSubmit={handleMarkPaidSubmit}
        />
      )}

      {/* Bulk Mark Paid Modal */}
      <BulkMarkPaidModal
        selectedCount={selectedRecords.length}
        isSaving={isSaving}
        isOpen={showBulkMarkPaidModal}
        onClose={() => setShowBulkMarkPaidModal(false)}
        onSubmit={handleBulkMarkPaidSubmit}
      />

      {/* Create Payroll Modal */}
      {showCreatePayrollModal && (
        <CreatePayrollModal
          employees={employees.map(emp => ({ id: emp.id, name: emp.full_name || '' }))}
          isSaving={isSaving}
          onClose={() => setShowCreatePayrollModal(false)}
          onSave={async (payrollData) => {
            setIsSaving(true);
            try {
              const payrollCreateData: PayrollCreateData = {
                employee: payrollData.employee_id!,
                payroll_status: payrollData.payment_status === 'Paid' ? 'Paid' : 'Pending',
                period_from: payrollData.period_start,
                period_to: payrollData.period_end,
                working_days: payrollData.working_days,
                days_present: payrollData.days_present,
                net_amount: payrollData.net_amount,
                payment_date: payrollData.payment_date,
                payment_mode: payrollData.payment_mode,
                bank_transaction_reference_number: payrollData.bank_transaction_ref,
                notes: payrollData.notes,
              };
              
              await apiClient.createPayroll(payrollCreateData);
              await showSuccess("Payroll Created", `Payroll entry created for ${payrollData.employee_name}`);
              setShowCreatePayrollModal(false);
              fetchPayroll();
              fetchStatistics();
            } catch (err: any) {
              await showAlert("Error", err.message || "Failed to create payroll");
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      {/* Edit Payroll SlideOver */}
      {editingPayroll && (
        <EditPayrollSlideOver
          payroll={editingPayroll}
          employees={employees.map(emp => ({ id: emp.id, name: emp.full_name || '' }))}
          isSaving={isSaving}
          isOpen={showEditPayrollSlideOver}
          onClose={() => {
            setShowEditPayrollSlideOver(false);
            setEditingPayroll(null);
          }}
          onSave={async (updatedPayrollData) => {
            setIsSaving(true);
            try {
              const payrollUpdateData: Partial<PayrollCreateData> = {
                employee: updatedPayrollData.employee_id!,
                payroll_status: updatedPayrollData.payment_status === 'Paid' ? 'Paid' : 'Pending',
                period_from: updatedPayrollData.period_start,
                period_to: updatedPayrollData.period_end,
                working_days: updatedPayrollData.working_days,
                days_present: updatedPayrollData.days_present,
                net_amount: updatedPayrollData.net_amount,
                payment_date: updatedPayrollData.payment_date,
                payment_mode: updatedPayrollData.payment_mode,
                bank_transaction_reference_number: updatedPayrollData.bank_transaction_ref,
                notes: updatedPayrollData.notes,
              };
              
              await apiClient.updatePayroll(editingPayroll.id, payrollUpdateData);
              await showSuccess("Payroll Updated", `Payroll entry updated for ${updatedPayrollData.employee_name}`);
              setShowEditPayrollSlideOver(false);
              setEditingPayroll(null);
              fetchPayroll();
              fetchStatistics();
            } catch (err: any) {
              await showAlert("Error", err.message || "Failed to update payroll");
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default function PayrollPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Payroll" breadcrumbs={["Home", "Payroll"]}><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <PayrollPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function BulkMarkPaidModal({
  selectedCount,
  isSaving,
  isOpen,
  onClose,
  onSubmit,
}: {
  selectedCount: number;
  isSaving: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentMode: PaymentMode, paymentDate: string, bankTransactionRef?: string) => Promise<void>;
}) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bankTransactionRef, setBankTransactionRef] = useState("");

  if (!isOpen) return null;

  const handleTodayDate = () => {
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(paymentMode, paymentDate, bankTransactionRef || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mark as Paid</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mark {selectedCount} employee{selectedCount > 1 ? "s" : ""} as paid
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleTodayDate}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Calendar className="h-4 w-4" />
                  Today
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
                disabled={isSaving}
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bank Transaction Reference Number
              </label>
              <input
                type="text"
                value={bankTransactionRef}
                onChange={(e) => setBankTransactionRef(e.target.value)}
                placeholder="Enter transaction reference number (optional)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Create Payroll Modal Component
function CreatePayrollModal({
  employees,
  isSaving,
  onClose,
  onSave,
}: {
  employees: { id: number; name: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (payroll: PayrollRecord) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    employee_id: 0,
    employee_name: "",
    employee_search: "",
    payroll_status: "Pending" as PaymentStatus,
    period_from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    period_to: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
    working_days: 26,
    days_present: 0,
    net_amount: 0,
    payment_date: "",
    payment_mode: "" as PaymentMode | "",
    bank_transaction_ref: "",
    notes: "",
  });
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) => {
    const searchTerm = formData.employee_search.toLowerCase();
    if (!searchTerm) return true;
    return (
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.id.toString().includes(formData.employee_search)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    if (showEmployeeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmployeeDropdown]);

  const handleEmployeeSelect = (employee: { id: number; name: string }) => {
    setFormData({
      ...formData,
      employee_id: employee.id,
      employee_name: employee.name,
      employee_search: employee.name,
    });
    setShowEmployeeDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      await showError("Validation Error", "Please select an employee");
      return;
    }

    const selectedEmployee = employees.find(e => e.id === formData.employee_id);
    if (!selectedEmployee) return;

    // Calculate base salary from net amount (simplified - in real app, this would be more complex)
    const baseSalary = formData.net_amount || 0;

    const newPayroll: PayrollRecord = {
      id: Date.now(),
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      employee_type: "Employee",
      period_start: formData.period_from,
      period_end: formData.period_to,
      working_days: formData.working_days,
      days_present: formData.days_present,
      days_absent: formData.working_days - formData.days_present,
      base_salary: baseSalary,
      gross_amount: formData.net_amount,
      deductions: 0,
      net_amount: formData.net_amount,
      payment_status: formData.payroll_status,
      payment_date: formData.payment_date || undefined,
      payment_mode: formData.payment_mode || undefined,
      bank_transaction_ref: formData.bank_transaction_ref || undefined,
      notes: formData.notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await onSave(newPayroll);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Payroll Entry</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative employee-dropdown-container">
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Employee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.employee_search || formData.employee_name}
                    onChange={(e) => {
                      setFormData({ ...formData, employee_search: e.target.value, employee_id: 0, employee_name: "" });
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => {
                      if (employees.length > 0) {
                        setShowEmployeeDropdown(true);
                      }
                    }}
                    placeholder="Search and select employee"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(employee)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {employee.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {showEmployeeDropdown && filteredEmployees.length === 0 && formData.employee_search && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                      No employees found
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Payroll Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payroll_status}
                  onChange={(e) => setFormData({ ...formData, payroll_status: e.target.value as PaymentStatus })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Period From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.period_from}
                  onChange={(e) => setFormData({ ...formData, period_from: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Period To <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.period_to}
                  onChange={(e) => setFormData({ ...formData, period_to: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Working Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.working_days}
                  onChange={(e) => setFormData({ ...formData, working_days: Number(e.target.value) })}
                  required
                  min="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Days Present <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.days_present}
                  onChange={(e) => setFormData({ ...formData, days_present: Number(e.target.value) })}
                  required
                  min="0"
                  max={formData.working_days}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Net Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.net_amount}
                  onChange={(e) => setFormData({ ...formData, net_amount: Number(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Payment Mode
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as PaymentMode })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Bank Transaction Reference Number
              </label>
              <input
                type="text"
                value={formData.bank_transaction_ref}
                onChange={(e) => setFormData({ ...formData, bank_transaction_ref: e.target.value })}
                placeholder="Enter transaction reference number"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Payroll
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Payroll SlideOver Component
function EditPayrollSlideOver({
  payroll,
  employees,
  isSaving,
  isOpen,
  onClose,
  onSave,
}: {
  payroll: PayrollRecord;
  employees: { id: number; name: string }[];
  isSaving: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payroll: PayrollRecord) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    employee_id: payroll.employee_id || 0,
    employee_name: payroll.employee_name,
    payroll_status: payroll.payment_status,
    period_from: payroll.period_start,
    period_to: payroll.period_end,
    working_days: payroll.working_days,
    days_present: payroll.days_present,
    net_amount: payroll.net_amount,
    payment_date: payroll.payment_date || "",
    payment_mode: payroll.payment_mode || "" as PaymentMode | "",
    bank_transaction_ref: payroll.bank_transaction_ref || "",
    notes: payroll.notes || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: payroll.employee_id || 0,
        employee_name: payroll.employee_name,
        payroll_status: payroll.payment_status,
        period_from: payroll.period_start,
        period_to: payroll.period_end,
        working_days: payroll.working_days,
        days_present: payroll.days_present,
        net_amount: payroll.net_amount,
        payment_date: payroll.payment_date || "",
        payment_mode: payroll.payment_mode || "" as PaymentMode | "",
        bank_transaction_ref: payroll.bank_transaction_ref || "",
        notes: payroll.notes || "",
      });
    }
  }, [isOpen, payroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      await showError("Validation Error", "Please select an employee");
      return;
    }

    const selectedEmployee = employees.find(e => e.id === formData.employee_id);
    if (!selectedEmployee) return;

    const updatedPayroll: PayrollRecord = {
      ...payroll,
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      period_start: formData.period_from,
      period_end: formData.period_to,
      working_days: formData.working_days,
      days_present: formData.days_present,
      days_absent: formData.working_days - formData.days_present,
      net_amount: formData.net_amount,
      payment_status: formData.payroll_status,
      payment_date: formData.payment_date || undefined,
      payment_mode: formData.payment_mode || undefined,
      bank_transaction_ref: formData.bank_transaction_ref || undefined,
      notes: formData.notes || undefined,
      updated_at: new Date().toISOString(),
    };

    await onSave(updatedPayroll);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl">
          <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Payroll Entry</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => {
                        const employee = employees.find(emp => emp.id === Number(e.target.value));
                        setFormData({
                          ...formData,
                          employee_id: Number(e.target.value),
                          employee_name: employee?.name || "",
                        });
                      }}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={0}>Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Payroll Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.payroll_status}
                      onChange={(e) => setFormData({ ...formData, payroll_status: e.target.value as PaymentStatus })}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Hold">Hold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Period From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.period_from}
                      onChange={(e) => setFormData({ ...formData, period_from: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Period To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.period_to}
                      onChange={(e) => setFormData({ ...formData, period_to: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Working Days <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.working_days}
                      onChange={(e) => setFormData({ ...formData, working_days: Number(e.target.value) })}
                      required
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Days Present <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.days_present}
                      onChange={(e) => setFormData({ ...formData, days_present: Number(e.target.value) })}
                      required
                      min="0"
                      max={formData.working_days}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Net Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.net_amount}
                      onChange={(e) => setFormData({ ...formData, net_amount: Number(e.target.value) })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Payment Mode
                    </label>
                    <select
                      value={formData.payment_mode}
                      onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as PaymentMode })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Bank Transaction Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.bank_transaction_ref}
                    onChange={(e) => setFormData({ ...formData, bank_transaction_ref: e.target.value })}
                    placeholder="Enter transaction reference number"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

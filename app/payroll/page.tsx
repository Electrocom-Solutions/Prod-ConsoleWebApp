"use client";

import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { mockPayrollRecords } from "@/lib/mock-data/payroll";
import { PayrollRecord, PaymentStatus, PaymentMode } from "@/types";
import { format } from "date-fns";
import { PayslipModal } from "@/components/payroll/payslip-modal";
import { MarkPaidModal } from "@/components/payroll/mark-paid-modal";
import { showSuccess, showError } from "@/lib/sweetalert";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollPage() {
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(
    mockPayrollRecords.filter(r => r.employee_type === "Employee")
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showBulkMarkPaidModal, setShowBulkMarkPaidModal] = useState(false);
  const [showCreatePayrollModal, setShowCreatePayrollModal] = useState(false);
  const [showEditPayrollSlideOver, setShowEditPayrollSlideOver] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);

  // Mock employees list for payroll creation
  const mockEmployees = [
    { id: 101, name: "Rajesh Kumar" },
    { id: 102, name: "Priya Sharma" },
    { id: 103, name: "Amit Patel" },
    { id: 104, name: "Anita Desai" },
    { id: 105, name: "Deepak Verma" },
  ];

  const years = useMemo(() => {
    const startYear = 2020;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((record) => {
      const recordDate = new Date(record.period_start);
      const recordMonth = months[recordDate.getMonth()];
      const recordYear = recordDate.getFullYear();
      
      const matchesMonth = recordMonth === selectedMonth;
      const matchesYear = recordYear === selectedYear;
      const matchesStatus = statusFilter === "all" || record.payment_status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        record.employee_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesMonth && matchesYear && matchesStatus && matchesSearch;
    });
  }, [payrollRecords, selectedMonth, selectedYear, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalPayrollCost: filteredRecords.reduce((sum, r) => sum + (r.computation_details?.net_amount || 0), 0),
      employeeCount: filteredRecords.length,
      pendingCount: filteredRecords.filter((r) => r.payment_status === "Pending").length,
      paidCount: filteredRecords.filter((r) => r.payment_status === "Paid").length,
    };
  }, [filteredRecords]);

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setShowPayslipModal(true);
  };

  const handleMarkPaid = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setShowMarkPaidModal(true);
  };

  const handleMarkPaidSubmit = async (paymentMode: PaymentMode, paymentDate: string, bankTransactionRef?: string) => {
    if (!selectedPayroll) return;

    setPayrollRecords((prev) =>
      prev.map((record) =>
        record.id === selectedPayroll.id
          ? {
              ...record,
              payment_status: "Paid" as PaymentStatus,
              payment_mode: paymentMode,
              payment_date: paymentDate,
              bank_transaction_ref: bankTransactionRef || record.bank_transaction_ref,
            }
          : record
      )
    );

    setShowMarkPaidModal(false);
    await showSuccess("Payment Marked", `Payroll for ${selectedPayroll.employee_name} marked as paid!`);
  };

  const handleBulkMarkPaidSubmit = async (paymentMode: PaymentMode, paymentDate: string) => {
    setPayrollRecords((prev) =>
      prev.map((record) =>
        selectedRecords.includes(record.id)
          ? {
              ...record,
              payment_status: "Paid" as PaymentStatus,
              payment_mode: paymentMode,
              payment_date: paymentDate,
            }
          : record
      )
    );

    const count = selectedRecords.length;
    setSelectedRecords([]);
    setShowBulkMarkPaidModal(false);
    await showSuccess("Payments Updated", `Successfully marked ${count} payroll record(s) as paid!`);
  };

  const handleToggleSelect = (recordId: number) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map((r) => r.id));
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
    const escapeCSV = (value: any) => {
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ["Period", "Employee", "Working Days", "Present", "Net Amount", "Status", "Payment Mode", "Payment Date"];
    const rows = filteredRecords.map((record) => [
      format(new Date(record.period_start), "MMM yyyy"),
      record.employee_name,
      record.working_days,
      record.days_present,
      record.computation_details?.net_amount || 0,
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
    link.download = `payroll-${selectedMonth}-${selectedYear}.csv`;
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
              {selectedMonth} {selectedYear}
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
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Hold">Hold</option>
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
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
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
                {filteredRecords.map((record) => (
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
                      ₹{record.computation_details?.net_amount?.toLocaleString("en-IN") || 0}
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
                          onClick={() => {
                            setEditingPayroll(record);
                            setShowEditPayrollSlideOver(true);
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payroll records found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No records for {selectedMonth} {selectedYear}.
              </p>
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
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          onSubmit={handleMarkPaidSubmit}
        />
      )}

      {/* Bulk Mark Paid Modal */}
      <BulkMarkPaidModal
        selectedCount={selectedRecords.length}
        isOpen={showBulkMarkPaidModal}
        onClose={() => setShowBulkMarkPaidModal(false)}
        onSubmit={handleBulkMarkPaidSubmit}
      />

      {/* Create Payroll Modal */}
      {showCreatePayrollModal && (
        <CreatePayrollModal
          employees={mockEmployees}
          onClose={() => setShowCreatePayrollModal(false)}
          onSave={(payroll) => {
            setPayrollRecords((prev) => [payroll, ...prev]);
            setShowCreatePayrollModal(false);
            showSuccess("Payroll Created", `Payroll entry created for ${payroll.employee_name}`);
          }}
        />
      )}

      {/* Edit Payroll SlideOver */}
      {editingPayroll && (
        <EditPayrollSlideOver
          payroll={editingPayroll}
          employees={mockEmployees}
          isOpen={showEditPayrollSlideOver}
          onClose={() => {
            setShowEditPayrollSlideOver(false);
            setEditingPayroll(null);
          }}
          onSave={(updatedPayroll) => {
            setPayrollRecords((prev) =>
              prev.map((record) =>
                record.id === updatedPayroll.id ? updatedPayroll : record
              )
            );
            setShowEditPayrollSlideOver(false);
            setEditingPayroll(null);
            showSuccess("Payroll Updated", `Payroll entry updated for ${updatedPayroll.employee_name}`);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function BulkMarkPaidModal({
  selectedCount,
  isOpen,
  onClose,
  onSubmit,
}: {
  selectedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentMode: PaymentMode, paymentDate: string) => void;
}) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));

  if (!isOpen) return null;

  const handleTodayDate = () => {
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(paymentMode, paymentDate);
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
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Mark as Paid
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
  onClose,
  onSave,
}: {
  employees: { id: number; name: string }[];
  onClose: () => void;
  onSave: (payroll: PayrollRecord) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      showError("Validation Error", "Please select an employee");
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

    onSave(newPayroll);
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Plus className="h-4 w-4" />
                Create Payroll
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
  isOpen,
  onClose,
  onSave,
}: {
  payroll: PayrollRecord;
  employees: { id: number; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payroll: PayrollRecord) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      showError("Validation Error", "Please select an employee");
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

    onSave(updatedPayroll);
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
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  <Check className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

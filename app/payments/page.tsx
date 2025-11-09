"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download, CheckCircle, X, Calendar, Loader2, Inbox, Trash2 } from "lucide-react";
import { showDeleteConfirm, showSuccess, showError, showAlert, showConfirm } from "@/lib/sweetalert";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { apiClient, PaymentTrackerStatisticsResponse, BackendPaymentTrackerListItem, PaymentTrackerListResponse, PaymentTrackerUploadResponse } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface ContractWorkerPayment {
  id: number;
  month: string;
  year: number;
  placeOfWork: string;
  workerName: string;
  mobileNumber: string;
  netSalaryPayable: number;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  paymentStatus: "Pending" | "Paid";
  paymentCompletionDate?: string;
  paymentMode?: string;
}

/**
 * Map backend payment tracker list item to frontend ContractWorkerPayment type
 */
function mapBackendPaymentTrackerToFrontend(backendPayment: BackendPaymentTrackerListItem): ContractWorkerPayment {
  const sheetPeriod = new Date(backendPayment.sheet_period);
  const monthIndex = sheetPeriod.getMonth();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return {
    id: backendPayment.id,
    month: months[monthIndex],
    year: sheetPeriod.getFullYear(),
    placeOfWork: backendPayment.place_of_work || '',
    workerName: backendPayment.worker_name || '',
    mobileNumber: backendPayment.mobile_number || '',
    netSalaryPayable: parseFloat(backendPayment.net_salary) || 0,
    bankName: backendPayment.bank_name || '',
    bankAccountNumber: backendPayment.account_number || '',
    ifscCode: backendPayment.ifsc_code || '',
    paymentStatus: backendPayment.payment_status === 'Paid' ? 'Paid' : 'Pending',
    paymentCompletionDate: backendPayment.payment_date || undefined,
    paymentMode: backendPayment.payment_mode || undefined,
  };
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [payments, setPayments] = useState<ContractWorkerPayment[]>([]);
  const [statistics, setStatistics] = useState<PaymentTrackerStatisticsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
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
      const stats = await apiClient.getPaymentTrackerStatistics({
        month: selectedMonth,
        year: selectedYear,
      });
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching payment tracker statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, [selectedMonth, selectedYear]);

  /**
   * Fetch payment records from backend
   */
  const fetchPayments = useCallback(async () => {
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

      const response: PaymentTrackerListResponse = await apiClient.getPaymentTrackerRecords(params);
      const mappedPayments = response.results.map(mapBackendPaymentTrackerToFrontend);
      setPayments(mappedPayments);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching payment records:', err);
      setError(err.message || 'Failed to fetch payment records');
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, debouncedSearch, currentPage]);

  // Fetch statistics and payments on mount and when filters change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const stats = useMemo(() => {
    if (!statistics) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
        pendingCount: 0,
      };
    }
    
    return {
      total: statistics.total_payable,
      pending: statistics.pending_payment_amount,
      paid: statistics.total_paid,
      pendingCount: statistics.pending_payment_count,
    };
  }, [statistics]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPayments(new Set(payments.map(p => p.id)));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSelectPayment = (id: number) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayments(newSelected);
  };

  const handleDelete = async (payment: ContractWorkerPayment) => {
    const confirmed = await showConfirm(
      "Delete Payment",
      `Are you sure you want to delete payment for ${payment.workerName}? This action cannot be undone.`,
      "Yes, delete it",
      "Cancel"
    );

    if (!confirmed) return;

    try {
      await apiClient.deletePaymentTracker(payment.id);
      await showSuccess("Payment deleted successfully");
      fetchPayments();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to delete payment");
    }
  };

  const handleExportSelected = () => {
    if (selectedPayments.size === 0) {
      showError("No Selection", "Please select at least one payment to export");
      return;
    }

    if (payments.length === 0) {
      showError("No Data", "No payment records to export");
      return;
    }

    const selectedData = payments.filter(p => selectedPayments.has(p.id));
    const exportData = selectedData.map(p => ({
      "Place of Work": p.placeOfWork,
      "Worker Name": p.workerName,
      "Mobile Number": p.mobileNumber,
      "Net Salary Payable": p.netSalaryPayable,
      "Bank Name": p.bankName,
      "Bank Account Number": p.bankAccountNumber,
      "IFSC Code": p.ifscCode,
      "Payment Status": p.paymentStatus,
      "Payment Completion Date": p.paymentCompletionDate ? format(new Date(p.paymentCompletionDate), "dd/MM/yyyy") : "-",
      "Payment Mode": p.paymentMode || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `Contract_Worker_Payments_${months[selectedMonth - 1]}_${selectedYear}.xlsx`);
    showSuccess("Exported Successfully", `${selectedPayments.size} payment records exported`);
  };

  const handleBulkMarkPaid = () => {
    if (selectedPayments.size === 0) {
      showError("No Selection", "Please select at least one payment to mark as paid");
      return;
    }
    setShowMarkPaidModal(true);
  };

  const handleBulkMarkPaidSubmit = async (paymentDate: string, paymentMode: string) => {
    if (selectedPayments.size === 0) return;

    setIsSaving(true);
    try {
      await apiClient.bulkMarkPaymentTrackerPaid({
        payment_ids: Array.from(selectedPayments),
        payment_date: paymentDate,
        payment_mode: paymentMode as 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI',
      });

      const count = selectedPayments.size;
      setSelectedPayments(new Set());
      setShowMarkPaidModal(false);
      await showSuccess("Payments Updated", `Successfully marked ${count} payment record(s) as paid!`);
      fetchPayments();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to mark payments as paid");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Payment Tracking">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Worker Payment Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage contract worker salary payments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payable</p>
            <p className="text-2xl font-bold mt-1">₹{stats.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending ({stats.pendingCount})</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">₹{stats.pending.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold mt-1 text-green-600">₹{stats.paid.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by worker name, place of work, mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Sheet
          </Button>
        </div>

        {selectedPayments.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                {selectedPayments.size} payment{selectedPayments.size > 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportSelected}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button size="sm" onClick={handleBulkMarkPaid}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={payments.length > 0 && selectedPayments.size === payments.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Place of Work</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Worker Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Salary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bank Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No payment records found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or upload a payment sheet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{payment.placeOfWork}</td>
                    <td className="px-4 py-3 text-sm font-medium">{payment.workerName}</td>
                    <td className="px-4 py-3 text-sm">{payment.mobileNumber}</td>
                    <td className="px-4 py-3 text-sm font-semibold">₹{payment.netSalaryPayable.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs">
                        <p className="font-medium">{payment.bankName || "-"}</p>
                        <p className="text-gray-500">{payment.bankAccountNumber || "-"}</p>
                        <p className="text-gray-500">{payment.ifscCode || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        payment.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.paymentCompletionDate
                        ? format(new Date(payment.paymentCompletionDate), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">{payment.paymentMode || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(payment)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {payments.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <UploadSheetModal
          isSaving={isSaving}
          onClose={() => setShowUploadModal(false)}
          onUpload={async (month, year, file) => {
            setIsSaving(true);
            try {
              const response: PaymentTrackerUploadResponse = await apiClient.uploadPaymentTrackerSheet({
                month: month,
                year: year,
                excel_file: file,
              });
              
              let message = `Successfully uploaded ${response.records_created} payment record(s)`;
              if (response.records_replaced > 0) {
                message += ` (replaced ${response.records_replaced} existing record(s))`;
              }
              if (response.errors && response.errors.length > 0) {
                message += `. ${response.errors.length} error(s) encountered.`;
              }
              
              await showSuccess("Upload Successful", message);
              setShowUploadModal(false);
              fetchPayments();
              fetchStatistics();
            } catch (err: any) {
              await showAlert("Upload Failed", err.message || "Failed to upload payment sheet");
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      {showMarkPaidModal && (
        <MarkAsPaidModal
          selectedCount={selectedPayments.size}
          isSaving={isSaving}
          onClose={() => setShowMarkPaidModal(false)}
          onSave={handleBulkMarkPaidSubmit}
        />
      )}
    </DashboardLayout>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Payment Tracking"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <PaymentsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function UploadSheetModal({
  isSaving,
  onClose,
  onUpload,
}: {
  isSaving: boolean;
  onClose: () => void;
  onUpload: (month: number, year: number, file: File) => Promise<void>;
}) {
  const currentDate = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [file, setFile] = useState<File | null>(null);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      await showError("No File Selected", "Please select an Excel file to upload");
      return;
    }

    await onUpload(selectedMonth, selectedYear, file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Upload Payment Sheet</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Month <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={isSaving}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={isSaving}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Excel File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isSaving}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Excel file should contain columns: Sr. No., Worker Name, Place Of Work, Mobile Number, Net Salary, Bank Name, Account Number, IFSC Code
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkAsPaidModal({
  selectedCount,
  isSaving,
  onClose,
  onSave,
}: {
  selectedCount: number;
  isSaving: boolean;
  onClose: () => void;
  onSave: (date: string, mode: string) => Promise<void>;
}) {
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");

  const handleTodayDate = () => {
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(paymentDate, paymentMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Mark as Paid</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mark {selectedCount} payment{selectedCount > 1 ? "s" : ""} as paid
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                disabled={isSaving}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleTodayDate} disabled={isSaving}>
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

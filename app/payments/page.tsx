"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download, CheckCircle, X, Calendar } from "lucide-react";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { format } from "date-fns";
import * as XLSX from "xlsx";

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

const mockPayments: ContractWorkerPayment[] = [
  {
    id: 1,
    month: "October",
    year: 2025,
    placeOfWork: "BSNL Site A",
    workerName: "Ramesh Kumar",
    mobileNumber: "9876543210",
    netSalaryPayable: 25000,
    bankName: "State Bank of India",
    bankAccountNumber: "12345678901234",
    ifscCode: "SBIN0001234",
    paymentStatus: "Paid",
    paymentCompletionDate: "2025-11-01T00:00:00Z",
    paymentMode: "Bank Transfer",
  },
  {
    id: 2,
    month: "November",
    year: 2025,
    placeOfWork: "Metro Station Project",
    workerName: "Sunil Verma",
    mobileNumber: "9876543211",
    netSalaryPayable: 28000,
    bankName: "HDFC Bank",
    bankAccountNumber: "98765432109876",
    ifscCode: "HDFC0001234",
    paymentStatus: "Pending",
  },
  {
    id: 3,
    month: "November",
    year: 2025,
    placeOfWork: "Tower Installation Site",
    workerName: "Rajesh Singh",
    mobileNumber: "9876543212",
    netSalaryPayable: 26500,
    bankName: "ICICI Bank",
    bankAccountNumber: "11223344556677",
    ifscCode: "ICIC0001234",
    paymentStatus: "Pending",
  },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PaymentsPage() {
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const [payments, setPayments] = useState<ContractWorkerPayment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());

  const years = useMemo(() => {
    const startYear = 2020;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.placeOfWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.mobileNumber.includes(searchTerm);
      const matchesMonth = payment.month === selectedMonth;
      const matchesYear = payment.year === selectedYear;
      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [payments, searchTerm, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    return {
      total: filteredPayments.reduce((sum, p) => sum + p.netSalaryPayable, 0),
      pending: filteredPayments.filter((p) => p.paymentStatus === "Pending").reduce((sum, p) => sum + p.netSalaryPayable, 0),
      paid: filteredPayments.filter((p) => p.paymentStatus === "Paid").reduce((sum, p) => sum + p.netSalaryPayable, 0),
      pendingCount: filteredPayments.filter((p) => p.paymentStatus === "Pending").length,
    };
  }, [filteredPayments]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
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

  const handleExportSelected = () => {
    if (selectedPayments.size === 0) {
      showError("No Selection", "Please select at least one payment to export");
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
    XLSX.writeFile(wb, `Contract_Worker_Payments_${selectedMonth}_${selectedYear}.xlsx`);
    showSuccess("Exported Successfully", `${selectedPayments.size} payment records exported`);
  };

  const handleBulkMarkPaid = () => {
    if (selectedPayments.size === 0) {
      showError("No Selection", "Please select at least one payment to mark as paid");
      return;
    }
    setShowMarkPaidModal(true);
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

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by worker name, place of work, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
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
                    checked={filteredPayments.length > 0 && selectedPayments.size === filteredPayments.length}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPayments.map((payment) => (
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
                      <p className="font-medium">{payment.bankName}</p>
                      <p className="text-gray-500">{payment.bankAccountNumber}</p>
                      <p className="text-gray-500">{payment.ifscCode}</p>
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
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No payment records found for {selectedMonth} {selectedYear}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <UploadSheetModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(data, month, year) => {
            setPayments((prev) => [...data, ...prev]);
            setShowUploadModal(false);
            showSuccess("Upload Successful", `${data.length} payment records added for ${month} ${year}`);
          }}
        />
      )}

      {showMarkPaidModal && (
        <MarkAsPaidModal
          selectedCount={selectedPayments.size}
          onClose={() => setShowMarkPaidModal(false)}
          onSave={(date, mode) => {
            setPayments((prev) =>
              prev.map((p) =>
                selectedPayments.has(p.id)
                  ? {
                      ...p,
                      paymentStatus: "Paid" as const,
                      paymentCompletionDate: date,
                      paymentMode: mode,
                    }
                  : p
              )
            );
            setShowMarkPaidModal(false);
            setSelectedPayments(new Set());
            showSuccess("Payments Updated", `${selectedPayments.size} payments marked as paid`);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function UploadSheetModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (data: ContractWorkerPayment[], month: string, year: number) => void;
}) {
  const currentDate = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [file, setFile] = useState<File | null>(null);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError("No File Selected", "Please select an Excel file to upload");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const payments: ContractWorkerPayment[] = jsonData.map((row, index) => ({
        id: Date.now() + index,
        month: selectedMonth,
        year: selectedYear,
        placeOfWork: row["Place of work"] || row["Place of Work"] || "",
        workerName: row["Worker Name"] || "",
        mobileNumber: String(row["Mobile Number"] || ""),
        netSalaryPayable: Number(row["Net Salary Payable"] || 0),
        bankName: row["Bank Name"] || "",
        bankAccountNumber: String(row["Bank Account Number"] || ""),
        ifscCode: row["IFSC Code"] || "",
        paymentStatus: "Pending",
      }));

      onUpload(payments, selectedMonth, selectedYear);
    } catch (error) {
      showError("Upload Failed", "Failed to parse Excel file. Please check the format.");
    }
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
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
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
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
            />
            <p className="text-xs text-gray-500 mt-2">
              Excel file should contain: Place of work, Worker Name, Mobile Number, Net Salary Payable, Bank Name, Bank Account Number, IFSC Code
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkAsPaidModal({
  selectedCount,
  onClose,
  onSave,
}: {
  selectedCount: number;
  onClose: () => void;
  onSave: (date: string, mode: string) => void;
}) {
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");

  const handleTodayDate = () => {
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(new Date(paymentDate).toISOString(), paymentMode);
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
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleTodayDate}>
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
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              required
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="NEFT/RTGS">NEFT/RTGS</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { X, Download } from "lucide-react";
import { PayrollRecord } from "@/types";
import { format } from "date-fns";

interface PayslipModalProps {
  payroll: PayrollRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function PayslipModal({ payroll, isOpen, onClose }: PayslipModalProps) {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    console.log("Download payslip PDF for:", payroll.id);
  };

  const computation = payroll.computation_details;

  // Calculate leave deduction
  const leaveDays = payroll.days_absent;
  const leaveDeduction = computation ? computation.per_day_rate * leaveDays : 0;
  const baseSalary = computation?.base_salary || 0;
  const netPayable = baseSalary - leaveDeduction;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payslip</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(payroll.period_start), "MMMM yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Employee Info */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee Name</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {payroll.employee_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Period</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {format(new Date(payroll.period_start), "dd MMM yyyy")} -{" "}
                    {format(new Date(payroll.period_end), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</p>
                  <p className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        payroll.payment_status === "Paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : payroll.payment_status === "Pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {payroll.payment_status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {computation && (
              <>
                {/* Salary Breakdown */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Salary Breakdown
                  </h4>
                  <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Base Salary</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{computation.base_salary.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Working Days</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {computation.working_days}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Days Present</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {computation.days_present}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Days Absent (Leave)</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {leaveDays}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Per Day Rate</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{computation.per_day_rate.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leave Deduction */}
                {leaveDays > 0 && (
                  <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Leave Deduction</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {leaveDays} day{leaveDays > 1 ? "s" : ""} × ₹{computation.per_day_rate.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        -₹{leaveDeduction.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Net Amount */}
                <div className="rounded-lg bg-sky-50 p-6 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Payable Amount</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        (Base Salary - Leave Deduction)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                        ₹{netPayable.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                {payroll.payment_status === "Paid" && (
                  <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Payment Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {payroll.payment_date && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Payment Date</p>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(payroll.payment_date), "dd MMM yyyy")}
                          </p>
                        </div>
                      )}
                      {payroll.payment_mode && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Payment Mode</p>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {payroll.payment_mode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {payroll.notes && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Notes
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{payroll.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

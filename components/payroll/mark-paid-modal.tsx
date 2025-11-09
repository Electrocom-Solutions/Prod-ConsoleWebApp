"use client";

import { useState } from "react";
import { X, Check, Calendar } from "lucide-react";
import { PayrollRecord, PaymentMode } from "@/types";
import { format } from "date-fns";

interface MarkPaidModalProps {
  payroll: PayrollRecord;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentMode: PaymentMode, paymentDate: string, bankTransactionRef?: string) => void;
}

export function MarkPaidModal({ payroll, isOpen, onClose, onSubmit }: MarkPaidModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bankTransactionRef, setBankTransactionRef] = useState("");

  if (!isOpen) return null;

  const handleTodayDate = () => {
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(paymentMode, paymentDate, bankTransactionRef || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mark as Paid</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {payroll.employee_name}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Net Amount</p>
              <p className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-400">
                ₹{payroll.computation_details?.net_amount?.toLocaleString("en-IN") || 0}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                <label htmlFor="payment-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment-mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label htmlFor="bank-transaction-ref" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bank Transaction Reference Number
                </label>
                <input
                  id="bank-transaction-ref"
                  type="text"
                  value={bankTransactionRef}
                  onChange={(e) => setBankTransactionRef(e.target.value)}
                  placeholder="Enter transaction reference number (optional)"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
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

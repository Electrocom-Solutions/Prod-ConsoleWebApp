'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AMC, Client } from '@/types';

interface AMCFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AMC>) => void;
  amc?: AMC | null;
  clients: Client[];
}

export function AMCFormModal({ isOpen, onClose, onSubmit, amc, clients }: AMCFormModalProps) {
  const [formData, setFormData] = useState<Partial<AMC>>({
    client_id: 0,
    amc_number: '',
    start_date: '',
    end_date: '',
    billing_cycle: 'Quarterly',
    amount: 0,
    status: 'Pending',
    description: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (amc) {
      setFormData(amc);
    } else {
      setFormData({
        client_id: 0,
        amc_number: '',
        start_date: '',
        end_date: '',
        billing_cycle: 'Quarterly',
        amount: 0,
        status: 'Pending',
        description: '',
        notes: '',
      });
    }
    setErrors({});
  }, [amc, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = 'Client is required';
    }
    if (!formData.amc_number?.trim()) {
      newErrors.amc_number = 'AMC Number is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {amc ? 'Edit AMC' : 'Create New AMC'}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.client_id || ''}
                        onChange={(e) => setFormData({ ...formData, client_id: parseInt(e.target.value) })}
                        className={`w-full rounded-lg border ${
                          errors.client_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:text-white`}
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      {errors.client_id && (
                        <p className="mt-1 text-xs text-red-500">{errors.client_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        AMC Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.amc_number || ''}
                        onChange={(e) => setFormData({ ...formData, amc_number: e.target.value })}
                        placeholder="e.g., AMC/2025/001"
                        className={`w-full rounded-lg border ${
                          errors.amc_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
                      />
                      {errors.amc_number && (
                        <p className="mt-1 text-xs text-red-500">{errors.amc_number}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Period */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Contract Period
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className={`w-full rounded-lg border ${
                          errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {errors.start_date && (
                        <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className={`w-full rounded-lg border ${
                          errors.end_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {errors.end_date && (
                        <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Billing Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Billing Cycle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.billing_cycle || 'Quarterly'}
                        onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as AMC['billing_cycle'] })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-yearly">Half-yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Frequency of billing generation
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        placeholder="500000"
                        className={`w-full rounded-lg border ${
                          errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
                      />
                      {errors.amount && (
                        <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'Pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AMC['status'] })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Internal notes and special requirements"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  {amc ? 'Update AMC' : 'Create AMC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

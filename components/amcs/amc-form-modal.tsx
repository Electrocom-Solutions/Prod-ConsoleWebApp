'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { AMC, Client } from '@/types';
import { DatePicker } from '@/components/ui/date-picker';

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
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showBillingCycleDropdown, setShowBillingCycleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-dropdown-container')) {
        setShowClientDropdown(false);
      }
      if (!target.closest('.billing-cycle-dropdown-container')) {
        setShowBillingCycleDropdown(false);
      }
      if (!target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    if (showClientDropdown || showBillingCycleDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showClientDropdown, showBillingCycleDropdown, showStatusDropdown]);

  // Filter clients based on search
  const filteredClients = clients.filter((client) => {
    const searchTerm = clientSearch.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchTerm) ||
      client.primary_contact_name?.toLowerCase().includes(searchTerm) ||
      client.primary_contact_email?.toLowerCase().includes(searchTerm) ||
      client.primary_contact_phone?.toLowerCase().includes(searchTerm)
    );
  });

  useEffect(() => {
    if (amc) {
      setFormData(amc);
      // Set client search to client name when editing
      const selectedClient = clients.find(c => c.id === amc.client_id);
      setClientSearch(selectedClient?.name || '');
    } else {
      setFormData({
        client_id: 0,
        amc_number: '',
        start_date: '',
        end_date: '',
        billing_cycle: 'Quarterly',
        amount: 0,
        status: 'Active', // Changed from 'Pending' to 'Active' as 'Pending' was removed
        description: '',
        notes: '',
      });
      setClientSearch('');
    }
    setErrors({});
    // Close dropdowns when modal opens/closes
    setShowClientDropdown(false);
    setShowBillingCycleDropdown(false);
    setShowStatusDropdown(false);
  }, [amc, isOpen, clients]);

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
                      <div className="relative client-dropdown-container">
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <Search className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                            <input
                              type="text"
                              value={clientSearch || (formData.client_id && formData.client_id !== 0 ? clients.find(c => c.id === formData.client_id)?.name || '' : '')}
                              onChange={(e) => {
                                setClientSearch(e.target.value);
                                setShowClientDropdown(true);
                                if (!e.target.value) {
                                  setFormData({ ...formData, client_id: 0 });
                                }
                              }}
                              onFocus={() => {
                                if (clients.length > 0) {
                                  setShowClientDropdown(true);
                                }
                              }}
                              placeholder="Search client by name, contact, email, or phone"
                              className={`flex-1 rounded-lg border ${
                                errors.client_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              } bg-white dark:bg-gray-700 px-10 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500`}
                            />
                            {formData.client_id && formData.client_id !== 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, client_id: 0 });
                                  setClientSearch('');
                                  setShowClientDropdown(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                title="Clear selection"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {showClientDropdown && filteredClients.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredClients.map((client) => (
                                <button
                                  key={client.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, client_id: client.id });
                                    setClientSearch(client.name || '');
                                    setShowClientDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <div className="font-medium">{client.name}</div>
                                  {client.primary_contact_name && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{client.primary_contact_name}</div>
                                  )}
                                  {client.primary_contact_email && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{client.primary_contact_email}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          {showClientDropdown && filteredClients.length === 0 && clientSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                              No clients found
                            </div>
                          )}
                        </div>
                      </div>
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
                      <DatePicker
                        value={formData.start_date || undefined}
                        onChange={(value) => setFormData({ ...formData, start_date: value })}
                        placeholder="Select start date"
                      />
                      {errors.start_date && (
                        <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={formData.end_date || undefined}
                        onChange={(value) => setFormData({ ...formData, end_date: value })}
                        placeholder="Select end date"
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
                      <div className="relative billing-cycle-dropdown-container">
                        <button
                          type="button"
                          onClick={() => setShowBillingCycleDropdown(!showBillingCycleDropdown)}
                          className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-left text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between"
                        >
                          <span>{formData.billing_cycle || 'Quarterly'}</span>
                          <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                        </button>
                        {showBillingCycleDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {['Monthly', 'Quarterly', 'Half-yearly', 'Yearly'].map((cycle) => (
                              <button
                                key={cycle}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, billing_cycle: cycle as AMC['billing_cycle'] });
                                  setShowBillingCycleDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {cycle}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
                  <div className="relative status-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-left text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between"
                    >
                      <span>{formData.status || 'Active'}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {['Active', 'Expired', 'Canceled'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, status: status as AMC['status'] });
                              setShowStatusDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

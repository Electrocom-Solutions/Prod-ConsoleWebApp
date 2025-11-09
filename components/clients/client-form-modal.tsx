"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Client } from "@/types";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client;
  mode: "create" | "edit";
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSave,
  client,
  mode,
}: ClientFormModalProps) {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    business_name: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    country: "India",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    secondary_contact: "",
    notes: "",
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client && mode === "edit") {
      setFormData(client);
    } else {
      setFormData({
        name: "",
        business_name: "",
        address: "",
        city: "",
        state: "",
        pin_code: "",
        country: "India",
        primary_contact_name: "",
        primary_contact_email: "",
        primary_contact_phone: "",
        secondary_contact: "",
        notes: "",
        tags: [],
      });
    }
  }, [client, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Client name is required";
    }

    if (!formData.primary_contact_email?.trim()) {
      newErrors.primary_contact_email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)
    ) {
      newErrors.primary_contact_email = "Invalid email format";
    }

    if (!formData.primary_contact_phone?.trim()) {
      newErrors.primary_contact_phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.primary_contact_phone.replace(/\D/g, ""))) {
      newErrors.primary_contact_phone = "Phone must be 10 digits";
    }

    if (!formData.city?.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state?.trim()) {
      newErrors.state = "State is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, saveAndAddAMC = false) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      if (!saveAndAddAMC) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl">
          <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mode === "create" ? "Add New Client" : "Edit Client"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.primary_contact_name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primary_contact_name: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.primary_contact_email || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primary_contact_email: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="email@example.com"
                      />
                      {errors.primary_contact_email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.primary_contact_email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.primary_contact_phone || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primary_contact_phone: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="10-digit phone number"
                      />
                      {errors.primary_contact_phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.primary_contact_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                    Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Street Address
                      </label>
                      <textarea
                        value={formData.address || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        rows={2}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.city || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.state || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.state && (
                          <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Pin Code
                        </label>
                        <input
                          type="text"
                          value={formData.pin_code || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, pin_code: e.target.value })
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Information */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                {mode === "create" && (
                  <button
                    onClick={(e) => handleSubmit(e, true)}
                    type="button"
                    className="rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    Save & Add AMC
                  </button>
                )}
                <button
                  onClick={(e) => handleSubmit(e)}
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

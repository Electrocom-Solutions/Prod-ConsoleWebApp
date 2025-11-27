"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, MapPin, FileText, Calendar, User, Loader2, Edit } from "lucide-react";
import { Client } from "@/types";
import { apiClient, BackendClientDetail } from "@/lib/api";
import { format } from "date-fns";
import { showAlert } from "@/lib/sweetalert";

interface ClientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: (client: Client) => void;
}

export function ClientViewModal({ isOpen, onClose, client, onEdit }: ClientViewModalProps) {
  const [clientDetail, setClientDetail] = useState<BackendClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      fetchClientDetail();
    } else {
      setClientDetail(null);
    }
  }, [isOpen, client]);

  const fetchClientDetail = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const detail = await apiClient.getClient(client.id);
      setClientDetail(detail);
    } catch (err: any) {
      console.error("Failed to fetch client details:", err);
      showAlert("Error", err.message || "Failed to load client details.", "error");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  const displayClient = clientDetail 
    ? {
        name: clientDetail.full_name || `${clientDetail.first_name} ${clientDetail.last_name}`.trim(),
        email: clientDetail.email || "-",
        phone: clientDetail.phone_number || "-",
        primaryContactName: clientDetail.primary_contact_name || "-",
        address: clientDetail.address || "-",
        city: clientDetail.city || "-",
        state: clientDetail.state || "-",
        pinCode: clientDetail.pin_code || "-",
        country: clientDetail.country || "India",
        notes: clientDetail.notes || "-",
        createdAt: clientDetail.created_at,
        updatedAt: clientDetail.updated_at,
        photoUrl: clientDetail.photo_url,
        dateOfBirth: clientDetail.date_of_birth,
        gender: clientDetail.gender,
        aadharNumber: clientDetail.aadhar_number,
        panNumber: clientDetail.pan_number,
        aadharCardUrl: clientDetail.aadhar_card_url,
        panCardUrl: clientDetail.pan_card_url,
      }
    : {
        name: client.name,
        email: client.primary_contact_email || "-",
        phone: client.primary_contact_phone || "-",
        primaryContactName: client.primary_contact_name || "-",
        address: client.address || "-",
        city: client.city || "-",
        state: client.state || "-",
        pinCode: client.pin_code || "-",
        country: client.country || "India",
        notes: client.notes || "-",
        createdAt: client.created_at,
        updatedAt: client.updated_at,
        photoUrl: undefined,
        dateOfBirth: undefined,
        gender: undefined,
        aadharNumber: undefined,
        panNumber: undefined,
        aadharCardUrl: undefined,
        panCardUrl: undefined,
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center gap-4">
            {displayClient.photoUrl && (
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={displayClient.photoUrl}
                  alt={displayClient.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {displayClient.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Client Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  if (clientDetail) {
                    const fullClient = {
                      id: clientDetail.id,
                      name: clientDetail.full_name || `${clientDetail.first_name} ${clientDetail.last_name}`.trim(),
                      business_name: undefined,
                      address: clientDetail.address || "",
                      city: clientDetail.city || "",
                      state: clientDetail.state || "",
                      pin_code: clientDetail.pin_code || "",
                      country: clientDetail.country || "India",
                      primary_contact_name: clientDetail.primary_contact_name || clientDetail.full_name || `${clientDetail.first_name} ${clientDetail.last_name}`.trim(),
                      primary_contact_email: clientDetail.email || "",
                      primary_contact_phone: clientDetail.phone_number || "",
                      secondary_contact: undefined,
                      notes: clientDetail.notes || undefined,
                      tags: [],
                      amc_count: 0,
                      open_projects: 0,
                      outstanding_amount: 0,
                      last_activity: clientDetail.updated_at || clientDetail.created_at,
                      created_at: clientDetail.created_at,
                      updated_at: clientDetail.updated_at,
                    };
                    onEdit(fullClient);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              <p className="ml-3 text-gray-500">Loading client details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contact Information */}
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{displayClient.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{displayClient.phone}</span>
                    </div>
                  </div>
                  {displayClient.primaryContactName && displayClient.primaryContactName !== "-" && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Contact Name</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.primaryContactName}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Address Information */}
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </h3>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                  <div className="space-y-3">
                    {displayClient.address && displayClient.address !== "-" && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">City</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.city}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">State</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.state}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PIN Code</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.pinCode}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Country</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.country}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Additional Information */}
              {(displayClient.dateOfBirth || displayClient.gender || displayClient.aadharNumber || displayClient.panNumber) && (
                <section>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                    {displayClient.dateOfBirth && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{format(new Date(displayClient.dateOfBirth), "MMMM dd, yyyy")}</span>
                        </div>
                      </div>
                    )}
                    {displayClient.gender && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{displayClient.gender}</p>
                      </div>
                    )}
                    {displayClient.aadharNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Aadhar Number</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.aadharNumber}</p>
                        {displayClient.aadharCardUrl && (
                          <a
                            href={displayClient.aadharCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                          >
                            View Aadhar Card
                          </a>
                        )}
                      </div>
                    )}
                    {displayClient.panNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PAN Number</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{displayClient.panNumber}</p>
                        {displayClient.panCardUrl && (
                          <a
                            href={displayClient.panCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                          >
                            View PAN Card
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Notes */}
              {displayClient.notes && displayClient.notes !== "-" && (
                <section>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </h3>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{displayClient.notes}</p>
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(displayClient.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(displayClient.updatedAt), "MMMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


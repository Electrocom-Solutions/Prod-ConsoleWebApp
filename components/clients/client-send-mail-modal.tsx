"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Send, Clock, Loader2 } from "lucide-react";
import type { Client } from "@/types";
import { apiClient, BackendEmailTemplateListItem, EmailTemplateDetail, EmailTemplateSendRequest } from "@/lib/api";
import { showAlert } from "@/lib/sweetalert";

interface ClientSendMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientSendMailModal({
  isOpen,
  onClose,
  client,
}: ClientSendMailModalProps) {
  const [templates, setTemplates] = useState<BackendEmailTemplateListItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateDetail | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  // Fetch email templates
  const fetchTemplates = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoadingTemplates(true);
    try {
      const response = await apiClient.getEmailTemplates({});
      setTemplates(response.results);
    } catch (err: any) {
      console.error("Failed to fetch email templates:", err);
      showAlert("Error", "Failed to fetch email templates. Please try again.", "error");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [isOpen]);

  // Fetch selected template details
  const fetchTemplateDetails = useCallback(async (templateId: number) => {
    try {
      const template = await apiClient.getEmailTemplate(templateId);
      setSelectedTemplate(template);
      
      // Extract placeholders from template
      let placeholders: string[] = [];
      if (template.placeholders) {
        placeholders = template.placeholders
          .split(/[,\s]+/)
          .map(p => p.replace(/[{}]/g, '').trim())
          .filter(p => p.length > 0);
      } else {
        // Extract placeholders from body
        const placeholderRegex = /\{\{(\w+)\}\}/g;
        const matches = template.body.matchAll(placeholderRegex);
        placeholders = Array.from(matches, m => m[1]);
      }
      
      // Initialize placeholder values with client data
      const initialValues: Record<string, string> = {};
      placeholders.forEach(placeholder => {
        const key = placeholder.toLowerCase();
        if (client) {
          if (key === 'name' || key === 'clientname') {
            initialValues[placeholder] = client.name || '';
          } else if (key === 'email' || key === 'clientemail') {
            initialValues[placeholder] = client.primary_contact_email || '';
          } else if (key === 'phone' || key === 'clientphone') {
            initialValues[placeholder] = client.primary_contact_phone || '';
          } else if (key === 'address' || key === 'clientaddress') {
            initialValues[placeholder] = client.address || '';
          } else if (key === 'city' || key === 'clientcity') {
            initialValues[placeholder] = client.city || '';
          } else if (key === 'state' || key === 'clientstate') {
            initialValues[placeholder] = client.state || '';
          }
        }
      });
      setPlaceholderValues(initialValues);
    } catch (err: any) {
      console.error("Failed to fetch template details:", err);
      showAlert("Error", "Failed to fetch template details. Please try again.", "error");
    }
  }, [client]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSelectedTemplateId(null);
      setSelectedTemplate(null);
      setSendMode("now");
      setScheduledDateTime("");
      setPlaceholderValues({});
    }
  }, [isOpen, fetchTemplates]);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplateDetails(selectedTemplateId);
    }
  }, [selectedTemplateId, fetchTemplateDetails]);

  const handleSendEmail = async () => {
    if (!client || !selectedTemplateId) {
      showAlert("Error", "Please select a template.", "error");
      return;
    }

    if (!client.primary_contact_email) {
      showAlert("Error", "Client email is required to send email.", "error");
      return;
    }

    if (sendMode === "schedule" && !scheduledDateTime) {
      showAlert("Error", "Please select a date and time for scheduling.", "error");
      return;
    }

    setIsSending(true);
    try {
      const requestData: EmailTemplateSendRequest = {
        recipients: client.primary_contact_email,
        placeholder_values: placeholderValues,
      };

      if (sendMode === "schedule" && scheduledDateTime) {
        // Convert local datetime to ISO string
        const date = new Date(scheduledDateTime);
        requestData.scheduled_at = date.toISOString();
      }

      const response = await apiClient.sendEmailUsingTemplate(selectedTemplateId, requestData);
      
      if (sendMode === "now") {
        showAlert("Success", `Email sent successfully to ${client.primary_contact_email}`, "success");
      } else {
        showAlert("Success", `Email scheduled for ${new Date(scheduledDateTime).toLocaleString()}`, "success");
      }
      
      onClose();
    } catch (err: any) {
      console.error("Failed to send email:", err);
      const errorMessage = err?.message || err?.error || "Failed to send email. Please try again.";
      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  // Get placeholders from selected template
  const placeholders: string[] = selectedTemplate
    ? (selectedTemplate.placeholders
        ? selectedTemplate.placeholders
            .split(/[,\s]+/)
            .map(p => p.replace(/[{}]/g, '').trim())
            .filter(p => p.length > 0)
        : (() => {
            const placeholderRegex = /\{\{(\w+)\}\}/g;
            const matches = selectedTemplate.body.matchAll(placeholderRegex);
            return Array.from(matches, m => m[1]);
          })())
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl">
          <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Send Email to {client?.name || "Client"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Email Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Email Template <span className="text-red-500">*</span>
                  </label>
                  {isLoadingTemplates ? (
                    <div className="mt-2 flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading templates...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateId || ""}
                      onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">-- Select Template --</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Template Preview */}
                {selectedTemplate && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Template Preview
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Subject:</span>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedTemplate.subject}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Body:</span>
                        <div
                          className="mt-1 max-h-40 overflow-y-auto rounded bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder Values */}
                {selectedTemplate && placeholders.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Placeholder Values
                    </h3>
                    <div className="space-y-3">
                      {placeholders.map((placeholder) => (
                        <div key={placeholder}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {placeholder}
                          </label>
                          <input
                            type="text"
                            value={placeholderValues[placeholder] || ""}
                            onChange={(e) =>
                              setPlaceholderValues({
                                ...placeholderValues,
                                [placeholder]: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder={`Enter value for ${placeholder}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Send Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Send Mode
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSendMode("now")}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        sendMode === "now"
                          ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Send className="mr-2 inline h-4 w-4" />
                      Send Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode("schedule")}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        sendMode === "schedule"
                          ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Clock className="mr-2 inline h-4 w-4" />
                      Schedule
                    </button>
                  </div>
                </div>

                {/* Schedule DateTime Picker */}
                {sendMode === "schedule" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Schedule Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* Recipient Info */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Recipient
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span> {client?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span> {client?.primary_contact_email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isSending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !selectedTemplateId || (sendMode === "schedule" && !scheduledDateTime)}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {sendMode === "now" ? "Sending..." : "Scheduling..."}
                    </>
                  ) : (
                    <>
                      {sendMode === "now" ? (
                        <>
                          <Send className="h-4 w-4" />
                          Send Now
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          Schedule Email
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


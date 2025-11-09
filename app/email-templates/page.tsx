"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Send, Trash2, Copy, X, Loader2, Inbox } from "lucide-react";
import { EmailTemplate } from "@/types";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { apiClient, BackendEmailTemplateListItem, EmailTemplateDetail, EmailTemplateCreateData, EmailTemplateSendRequest } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend email template list item to frontend EmailTemplate type
 */
function mapBackendTemplateListItemToFrontend(backendTemplate: BackendEmailTemplateListItem): EmailTemplate {
  return {
    id: backendTemplate.id,
    name: backendTemplate.name,
    subject: backendTemplate.subject,
    body: '', // Not available in list view
    placeholders: [], // Not available in list view
    created_at: backendTemplate.created_at,
    updated_at: backendTemplate.created_at, // Use created_at as fallback
  };
}

/**
 * Map backend email template detail to frontend EmailTemplate type
 */
function mapBackendTemplateDetailToFrontend(backendTemplate: EmailTemplateDetail): EmailTemplate {
  // Parse placeholders string to array
  let placeholders: string[] = [];
  if (backendTemplate.placeholders) {
    // Placeholders can be comma-separated or space-separated
    placeholders = backendTemplate.placeholders
      .split(/[,\s]+/)
      .map(p => p.replace(/[{}]/g, '').trim())
      .filter(p => p.length > 0);
  } else {
    // Extract placeholders from body if not provided
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const matches = backendTemplate.body.matchAll(placeholderRegex);
    placeholders = Array.from(matches, m => m[1]);
  }

  return {
    id: backendTemplate.id,
    name: backendTemplate.name,
    subject: backendTemplate.subject,
    body: backendTemplate.body,
    placeholders: placeholders,
    created_at: backendTemplate.created_at,
    updated_at: backendTemplate.updated_at,
  };
}

function EmailTemplatesPageContent() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch email templates from backend
   */
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await apiClient.getEmailTemplates(params);
      const mappedTemplates = response.results.map(mapBackendTemplateListItemToFrontend);
      setTemplates(mappedTemplates);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching email templates:', err);
      setError(err.message || 'Failed to fetch email templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Fetch full template details (for preview/edit)
   */
  const fetchTemplateDetails = useCallback(async (id: number): Promise<EmailTemplate | null> => {
    try {
      const detail = await apiClient.getEmailTemplate(id);
      return mapBackendTemplateDetailToFrontend(detail);
    } catch (err: any) {
      console.error('Error fetching template details:', err);
      showError("Error", err.message || "Failed to fetch template details");
      return null;
    }
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this template");
    if (confirmed) {
      try {
        await apiClient.deleteEmailTemplate(id);
        fetchTemplates();
        showSuccess("Success", "Template deleted successfully");
      } catch (err: any) {
        showError("Error", err.message || "Failed to delete template");
      }
    }
  };

  const handleEdit = async (template: EmailTemplate) => {
    // Fetch full template details
    const fullTemplate = await fetchTemplateDetails(template.id);
    if (fullTemplate) {
      setSelectedTemplate(fullTemplate);
      setShowEditor(true);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    // Fetch full template details
    const fullTemplate = await fetchTemplateDetails(template.id);
    if (fullTemplate) {
      setSelectedTemplate(fullTemplate);
      setShowPreview(true);
    }
  };

  const handleSend = async (template: EmailTemplate) => {
    // Fetch full template details
    const fullTemplate = await fetchTemplateDetails(template.id);
    if (fullTemplate) {
      setSelectedTemplate(fullTemplate);
      setShowSendModal(true);
    }
  };

  const handleSaveTemplate = async (templateData: {
    id?: number;
    name: string;
    subject: string;
    body: string;
    placeholders: string[];
  }) => {
    setIsSaving(true);
    try {
      // Extract placeholders from body
      const placeholderRegex = /\{\{(\w+)\}\}/g;
      const matches = templateData.body.matchAll(placeholderRegex);
      const extractedPlaceholders = Array.from(matches, m => m[1]);
      const uniquePlaceholders = [...new Set(extractedPlaceholders)];

      const createData: EmailTemplateCreateData = {
        name: templateData.name,
        subject: templateData.subject,
        body: templateData.body,
        placeholders: uniquePlaceholders.join(', '), // Convert array to comma-separated string
      };

      if (templateData.id) {
        // Update existing template
        await apiClient.updateEmailTemplate(templateData.id, createData);
        showSuccess("Success", "Template updated successfully");
      } else {
        // Create new template
        await apiClient.createEmailTemplate(createData);
        showSuccess("Success", "Template created successfully");
      }

      fetchTemplates();
      setShowEditor(false);
      setSelectedTemplate(null);
    } catch (err: any) {
      showError("Error", err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Email Templates" breadcrumbs={["Home", "Email Templates"]}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              setShowEditor(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading email templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-12 text-center">
            <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "No templates found matching your search"
                : "No email templates yet"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchQuery ? "Try a different search query" : "Create your first template to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">Subject:</span> {template.subject}
                      </p>
                      {template.placeholders && template.placeholders.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.placeholders.slice(0, 5).map((placeholder) => (
                            <span
                              key={placeholder}
                              className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                            >
                              {`{{${placeholder}}}`}
                            </span>
                          ))}
                          {template.placeholders.length > 5 && (
                            <span className="text-xs px-2 py-0.5 text-gray-500">
                              +{template.placeholders.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSend(template)}
                        title="Send"
                        className="text-sky-600 hover:text-sky-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {templates.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-lg border">
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
          </>
        )}
      </div>

      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => {
            setShowEditor(false);
            setSelectedTemplate(null);
          }}
          onSave={handleSaveTemplate}
          isSaving={isSaving}
        />
      )}

      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {showSendModal && selectedTemplate && (
        <SendEmailModal
          template={selectedTemplate}
          onClose={() => {
            setShowSendModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSave,
  isSaving,
}: {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (template: {
    id?: number;
    name: string;
    subject: string;
    body: string;
    placeholders: string[];
  }) => Promise<void>;
  isSaving: boolean;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setName("");
      setSubject("");
      setBody("");
    }
  }, [template]);

  const availablePlaceholders = [
    "client_name", "client_id", "contact_name", "contact_email", "contact_phone",
    "amc_number", "period_from", "period_to", "amount", "due_date",
    "employee_name", "task_id", "task_description", "location", "task_date",
    "company_name", "company_email", "company_phone",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract placeholders from body
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const matches = body.matchAll(placeholderRegex);
    const usedPlaceholders = Array.from(matches, m => m[1]);
    const uniquePlaceholders = [...new Set(usedPlaceholders)];
    
    await onSave({
      id: template?.id,
      name,
      subject,
      body,
      placeholders: uniquePlaceholders,
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    const newText = `{{${placeholder}}}`;
    setBody(body + newText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {template ? "Edit Template" : "Create Template"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., AMC Bill Reminder"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Use placeholders like {{client_name}}"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Body (HTML) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={15}
                  required
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="<p>Dear {{client_name}},</p>"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {template ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    template ? "Update Template" : "Create Template"
                  )}
                </Button>
              </div>
            </form>

            <div className="w-64 border-l dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold mb-3">Placeholders</h3>
              <p className="text-xs text-gray-500 mb-4">
                Click to insert
              </p>
              <div className="space-y-1">
                {availablePlaceholders.map((placeholder) => (
                  <button
                    key={placeholder}
                    type="button"
                    onClick={() => insertPlaceholder(placeholder)}
                    disabled={isSaving}
                    className="w-full text-left text-xs px-2 py-1.5 rounded bg-white dark:bg-gray-900 hover:bg-sky-50 dark:hover:bg-sky-950/30 border dark:border-gray-700 flex items-center justify-between group"
                  >
                    <span className="font-mono text-[10px]">{`{{${placeholder}}}`}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const sampleData: Record<string, string> = {
    client_name: "TechCorp Solutions",
    client_id: "123",
    contact_name: "John Doe",
    contact_email: "john@techcorp.com",
    contact_phone: "+91 1234567890",
    amc_number: "AMC-2025-042",
    period_from: "2025-01-01",
    period_to: "2025-03-31",
    amount: "25,000",
    due_date: "2025-04-15",
    employee_name: "Rajesh Kumar",
    task_id: "TASK-247",
    task_description: "Network Setup",
    location: "Andheri West",
    task_date: "2025-01-15",
    company_name: "Electrocom Pvt Ltd",
    company_email: "info@electrocom.com",
    company_phone: "+91 9876543210",
  };

  let previewBody = template.body;
  Object.entries(sampleData).forEach(([key, value]) => {
    previewBody = previewBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Subject: {template.subject}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div dangerouslySetInnerHTML={{ __html: previewBody }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SendEmailModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const [recipients, setRecipients] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);

  // Initialize placeholder values from template
  useEffect(() => {
    if (template.placeholders && template.placeholders.length > 0) {
      const initialValues: Record<string, string> = {};
      template.placeholders.forEach(placeholder => {
        initialValues[placeholder] = "";
      });
      setPlaceholderValues(initialValues);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      let scheduled_at: string | null = null;
      if (scheduleDate && scheduleTime) {
        const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        scheduled_at = dateTime.toISOString();
      } else if (scheduleDate) {
        const dateTime = new Date(`${scheduleDate}T00:00:00`);
        scheduled_at = dateTime.toISOString();
      }

      const sendData: EmailTemplateSendRequest = {
        recipients: recipients,
        scheduled_at: scheduled_at || null,
        placeholder_values: Object.keys(placeholderValues).length > 0 ? placeholderValues : undefined,
      };

      const response = await apiClient.sendEmailUsingTemplate(template.id, sendData);

      if (response.status === 'sent') {
        showSuccess(
          "Email Sent",
          `Email sent successfully to ${response.recipients_count} recipient(s)`
        );
      } else if (response.status === 'scheduled') {
        showSuccess(
          "Email Scheduled",
          `Email scheduled for ${scheduled_at ? new Date(scheduled_at).toLocaleString() : 'future time'}\n\nRecipients: ${response.recipients_count}`
        );
      }

      onClose();
    } catch (err: any) {
      showError("Error", err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Send Email</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <Input value={template.name} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Recipients <span className="text-red-500">*</span>
              </label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                required
                disabled={isSending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple emails with commas
              </p>
            </div>

            {template.placeholders && template.placeholders.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Placeholder Values (Optional)
                </label>
                <div className="space-y-2">
                  {template.placeholders.map((placeholder) => (
                    <div key={placeholder}>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {`{{${placeholder}}}`}
                      </label>
                      <Input
                        value={placeholderValues[placeholder] || ""}
                        onChange={(e) =>
                          setPlaceholderValues(prev => ({
                            ...prev,
                            [placeholder]: e.target.value
                          }))
                        }
                        placeholder={`Enter value for ${placeholder}`}
                        disabled={isSending}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  disabled={isSending}
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to send immediately
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {scheduleDate ? "Scheduling..." : "Sending..."}
                  </>
                ) : (
                  scheduleDate ? "Schedule Email" : "Send Email"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Email Templates"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <EmailTemplatesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

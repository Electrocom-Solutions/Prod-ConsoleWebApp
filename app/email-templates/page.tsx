"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Send, Trash2, Copy, X } from "lucide-react";
import { EmailTemplate } from "@/types";
import { mockEmailTemplates } from "@/lib/mock-data/email-templates";
import { showDeleteConfirm, showSuccess } from "@/lib/sweetalert";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this template");
    if (confirmed) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <DashboardLayout title="Email Templates" breadcrumbs={["Home", "Email Templates"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => {
            setSelectedTemplate(null);
            setShowEditor(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
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
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowEditor(true);
                    }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowSendModal(true);
                    }}
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
      </div>

      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => setShowEditor(false)}
          onSave={(template) => {
            if (selectedTemplate) {
              setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
            } else {
              setTemplates(prev => [template, ...prev]);
            }
            setShowEditor(false);
          }}
        />
      )}

      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showSendModal && selectedTemplate && (
        <SendEmailModal
          template={selectedTemplate}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");

  const availablePlaceholders = [
    "client_name", "client_id", "contact_name", "contact_email", "contact_phone",
    "amc_number", "period_from", "period_to", "amount", "due_date",
    "employee_name", "task_id", "task_description", "location", "task_date",
    "company_name", "company_email", "company_phone",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usedPlaceholders = availablePlaceholders.filter(p => body.includes(`{{${p}}}`));
    
    const savedTemplate: EmailTemplate = {
      id: template?.id || Date.now(),
      name,
      subject,
      body,
      placeholders: usedPlaceholders,
      created_at: template?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    onSave(savedTemplate);
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="<p>Dear {{client_name}},</p>"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {template ? "Update" : "Create"} Template
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
    amc_number: "AMC-2025-042",
    amount: "25,000",
    company_name: "Electrocom Pvt Ltd",
  };

  let previewBody = template.body;
  Object.entries(sampleData).forEach(([key, value]) => {
    previewBody = previewBody.replace(new RegExp(`{{${key}}}`, "g"), value);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = scheduleDate
      ? `Email scheduled for ${new Date(scheduleDate).toLocaleString()}\n\nTemplate: ${template.name}\nRecipients: ${recipients}`
      : `Email sent successfully!\n\nTemplate: ${template.name}\nRecipients: ${recipients}`;
    
    await showSuccess(
      scheduleDate ? "Email Scheduled" : "Email Sent",
      `Template: ${template.name}\nRecipients: ${recipients}${scheduleDate ? `\n\nScheduled for: ${new Date(scheduleDate).toLocaleString()}` : ''}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Send Email</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {scheduleDate ? "Schedule" : "Send"} Email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Save,
  Check,
  XCircle,
  UserPlus,
  MessageSquare,
  Download,
  Trash2,
  Plus,
  IndianRupee,
  AlertCircle,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Task, TaskResource, TaskAttachment, TaskActivity } from "@/types";
import {
  getResourcesByTaskId,
  getAttachmentsByTaskId,
  getActivitiesByTaskId,
} from "@/lib/mock-data/tasks";
import { format } from "date-fns";

interface TaskDetailSlideOverProps {
  task: Task;
  resources: TaskResource[];
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: Task, resources: TaskResource[]) => void;
  onApprove?: (task: Task) => void;
  onReject?: (task: Task, reason: string) => void;
}

export function TaskDetailSlideOver({
  task,
  resources: initialResources,
  isOpen,
  onClose,
  onSave,
  onApprove,
  onReject,
}: TaskDetailSlideOverProps) {
  const [resources, setResources] = useState<TaskResource[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [internalNote, setInternalNote] = useState(task.internal_notes || "");
  const [hasChanges, setHasChanges] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResources(initialResources);
      setAttachments(getAttachmentsByTaskId(task.id));
      setActivities(getActivitiesByTaskId(task.id));
      setInternalNote(task.internal_notes || "");
      setHasChanges(false);
    }
  }, [task.id, isOpen, initialResources]);

  const updateResourceUnitCost = (resourceId: number, unitCost: number | null) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          const newUnitCost = unitCost ?? undefined;
          const totalCost = newUnitCost ? newUnitCost * r.quantity : undefined;
          return { ...r, unit_cost: newUnitCost, total_cost: totalCost };
        }
        return r;
      })
    );
    setHasChanges(true);
  };

  const updateResourceQuantity = (resourceId: number, quantity: number) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          const totalCost = r.unit_cost ? r.unit_cost * quantity : undefined;
          return { ...r, quantity, total_cost: totalCost };
        }
        return r;
      })
    );
    setHasChanges(true);
  };

  const addResource = () => {
    const newResource: TaskResource = {
      id: Math.max(...resources.map((r) => r.id), 0) + 1,
      task_id: task.id,
      resource_name: "",
      quantity: 1,
      unit: "pcs",
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [...prev, newResource]);
    setHasChanges(true);
  };

  const removeResource = (resourceId: number) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    setHasChanges(true);
  };

  const calculateTotalResourceCost = () => {
    return resources.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  };

  const hasMissingUnitCosts = () => {
    return resources.some((r) => !r.unit_cost);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...task, internal_notes: internalNote }, resources);
    }
    setHasChanges(false);
  };

  const handleApprove = () => {
    if (hasMissingUnitCosts()) {
      const confirmed = window.confirm(
        "Some resources have no unit cost — totals may be inaccurate. Continue?"
      );
      if (!confirmed) return;
    }
    if (onApprove) {
      onApprove(task);
    }
    onClose();
  };

  const handleReject = () => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason && onReject) {
      onReject(task, reason);
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Approved":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Task #{task.id}
              </h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {task.employee_name} · {task.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Task Info */}
            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Task Information
              </h3>
              <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(task.date), "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>Time Taken</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {task.time_taken_minutes} minutes ({(task.time_taken_minutes / 60).toFixed(1)} hrs)
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {task.location}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Briefcase className="h-4 w-4" />
                      <span>Project</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {task.project_name}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span>Description</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {task.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Attachments */}
            {attachments.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Attachments ({attachments.length})
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3 hover:border-sky-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sky-600 cursor-pointer"
                      onClick={() => setPreviewAttachment(attachment)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                          {attachment.file_type === "image" ? (
                            <ImageIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resources Used */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resources Used
                </h3>
                <button
                  onClick={addResource}
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Resource
                </button>
              </div>

              {hasMissingUnitCosts() && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Some resources have no unit cost — totals may be inaccurate</span>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Resource Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Unit Cost (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Total Cost (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {resource.resource_name || (
                            <input
                              type="text"
                              placeholder="Enter name"
                              className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                              onChange={(e) => {
                                setResources((prev) =>
                                  prev.map((r) =>
                                    r.id === resource.id
                                      ? { ...r, resource_name: e.target.value }
                                      : r
                                  )
                                );
                                setHasChanges(true);
                              }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={resource.quantity}
                            onChange={(e) =>
                              updateResourceQuantity(
                                resource.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {resource.unit}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={resource.unit_cost || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateResourceUnitCost(
                                  resource.id,
                                  value ? parseFloat(value) : null
                                );
                              }}
                              placeholder="0.00"
                              className="w-28 rounded border border-gray-300 bg-white py-1 pl-6 pr-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          {!resource.unit_cost && (
                            <button
                              onClick={() => {
                                const input = document.querySelector(
                                  `input[type="number"][placeholder="0.00"]`
                                ) as HTMLInputElement;
                                input?.focus();
                              }}
                              className="mt-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                            >
                              Set unit cost
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {resource.total_cost
                            ? `₹${resource.total_cost.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeResource(resource.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Total Resource Cost:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                        ₹{calculateTotalResourceCost().toLocaleString("en-IN")}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Internal Notes */}
            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Internal Notes (Owner Only)
              </h3>
              <textarea
                value={internalNote}
                onChange={(e) => {
                  setInternalNote(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Add internal notes visible only to owners..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </section>

            {/* Activity Feed */}
            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Activity Feed
              </h3>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                      <div className="h-2 w-2 rounded-full bg-sky-600 dark:bg-sky-400"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {activity.performed_by} ·{" "}
                        {format(new Date(activity.timestamp), "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="border-t border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {hasChanges && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              <AlertCircle className="mr-2 inline h-4 w-4" />
              Unit cost saved locally — click Save to persist changes
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
            {task.status !== "Approved" && (
              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                <Check className="h-4 w-4" />
                Approve & Close
              </button>
            )}
            {task.status !== "Rejected" && (
              <button
                onClick={handleReject}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {previewAttachment.file_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(previewAttachment.file_size)} · {previewAttachment.file_type}
                </p>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-auto">
              {previewAttachment.file_type === "image" ? (
                <img
                  src={previewAttachment.file_url}
                  alt={previewAttachment.file_name}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23666'%3EImage preview unavailable%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : previewAttachment.file_type === "pdf" ? (
                <div className="space-y-4">
                  <iframe
                    src={previewAttachment.file_url}
                    className="w-full h-[calc(90vh-200px)] rounded-lg border border-gray-200 dark:border-gray-700"
                    title={previewAttachment.file_name}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    PDF preview. If the document doesn't display, please download it to view.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-900 dark:text-white font-medium">
                    Preview not available for this file type
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Please download the file to view it
                  </p>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uploaded by {previewAttachment.uploaded_by} · {format(new Date(previewAttachment.uploaded_at), "MMM dd, yyyy 'at' HH:mm")}
                </div>
                <a
                  href={previewAttachment.file_url}
                  download={previewAttachment.file_name}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

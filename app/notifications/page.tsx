"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  X,
  Loader2,
  Inbox,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { NotificationRecord, NotificationType } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { showDeleteConfirm, showSuccess, showError, showAlert } from "@/lib/sweetalert";
import { apiClient, BackendNotificationListItem, NotificationStatisticsResponse } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DatePicker } from "@/components/ui/date-picker";

/**
 * Map backend notification to frontend NotificationRecord
 */
function mapBackendNotificationToFrontend(backendNotif: BackendNotificationListItem): NotificationRecord {
  return {
    id: backendNotif.id,
    recipient_id: 0, // Not needed for display
    recipient_name: undefined,
    title: backendNotif.title,
    message: backendNotif.message,
    type: backendNotif.type as NotificationType,
    is_read: backendNotif.is_read,
    created_at: backendNotif.created_at,
    scheduled_at: backendNotif.scheduled_at,
    sent_at: backendNotif.sent_at,
    channel: backendNotif.channel,
  };
}

const getNotificationIcon = (type: string) => {
  const iconClass = "h-6 w-6";
  switch (type) {
    case "Task":
      return <div className={cn(iconClass, "text-blue-500")}>📋</div>;
    case "AMC":
      return <div className={cn(iconClass, "text-green-500")}>💰</div>;
    case "Tender":
      return <div className={cn(iconClass, "text-purple-500")}>📄</div>;
    case "Payroll":
      return <div className={cn(iconClass, "text-orange-500")}>💼</div>;
    case "System":
      return <div className={cn(iconClass, "text-gray-500")}>⚙️</div>;
    case "Other":
      return <div className={cn(iconClass, "text-red-500")}>⏰</div>;
    default:
      return <Bell className={iconClass} />;
  }
};

function NotificationsPageContent() {
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [statistics, setStatistics] = useState<NotificationStatisticsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [filterType, setFilterType] = useState<"All" | "Unread" | NotificationType>("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch statistics from backend
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getNotificationStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching notification statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, []);

  /**
   * Fetch notifications from backend
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (filterType === "Unread") {
        params.is_read = false;
      } else if (filterType !== "All") {
        params.type = filterType;
      }

      const response = await apiClient.getNotifications(params);
      const mappedNotifications = response.results.map(mapBackendNotificationToFrontend);
      setNotifications(mappedNotifications);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterType, currentPage]);

  // Fetch statistics and notifications on mount and when filters change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refetch statistics after marking as read or deleting
  const refetchData = useCallback(() => {
    fetchStatistics();
    fetchNotifications();
  }, [fetchStatistics, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationAsRead(id);
      refetchData();
    } catch (err: any) {
      showError("Error", err.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.bulkMarkNotificationsAsRead({ mark_all: true });
      refetchData();
      showSuccess("Success", "All notifications marked as read");
    } catch (err: any) {
      showError("Error", err.message || "Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this notification");
    if (confirmed) {
      try {
        await apiClient.deleteNotification(id);
        refetchData();
        showSuccess("Success", "Notification deleted successfully");
      } catch (err: any) {
        showError("Error", err.message || "Failed to delete notification");
      }
    }
  };

  const handleCreateNotification = async (data: {
    title: string;
    message: string;
    type: NotificationType;
    channel?: string;
    scheduled_at?: string | null;
  }) => {
    setIsSaving(true);
    try {
      await apiClient.createNotification({
        title: data.title,
        message: data.message,
        type: data.type,
        channel: data.channel || "In-App",
        scheduled_at: data.scheduled_at || null,
      });
      refetchData();
      setShowCreateModal(false);
      if (data.scheduled_at) {
        showSuccess(
          "Notification Scheduled",
          `Notification scheduled for ${new Date(data.scheduled_at).toLocaleString()}`
        );
      } else {
        showSuccess("Success", "Notification created and sent to all employees");
      }
    } catch (err: any) {
      showError("Error", err.message || "Failed to create notification");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      breadcrumbs={["Home", "Notifications"]}
    >
      <div className="space-y-6">
        {/* Statistics Tiles */}
        {statistics && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Notifications</div>
                  <div className="text-2xl font-bold mt-1">{statistics.total_notifications}</div>
                </div>
                <MessageSquare className="h-8 w-8 text-sky-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Unread</div>
                  <div className="text-2xl font-bold mt-1">{statistics.unread_count}</div>
                </div>
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Read</div>
                  <div className="text-2xl font-bold mt-1">{statistics.read_count}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {statistics && statistics.unread_count > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read ({statistics.unread_count})
              </Button>
            )}
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          {["All", "Unread", "Task", "AMC", "Tender", "Payroll", "System", "Other"].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => {
                  setFilterType(filter as any);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
                  filterType === filter
                    ? "bg-sky-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                {filter}
                {filter === "Unread" && statistics && statistics.unread_count > 0 && ` (${statistics.unread_count})`}
              </button>
            )
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-12 text-center">
            <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || filterType !== "All"
                ? "No notifications found matching your criteria"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "bg-white dark:bg-gray-900 rounded-lg border p-4 transition-all hover:shadow-md",
                    !notification.is_read &&
                      "border-l-4 border-l-sky-500 bg-sky-50/30 dark:bg-sky-950/20"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className={cn(
                              "font-semibold",
                              !notification.is_read &&
                                "text-sky-600 dark:text-sky-400"
                            )}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(notification.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {notification.type}
                            </span>
                            {notification.scheduled_at && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                Scheduled: {new Date(notification.scheduled_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {notifications.length > 0 && totalPages > 1 && (
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

      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateNotification}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

function CreateNotificationModal({
  onClose,
  onSubmit,
  isSaving,
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    message: string;
    type: NotificationType;
    channel?: string;
    scheduled_at?: string | null;
  }) => Promise<void>;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("System");
  const [channel, setChannel] = useState<string>("In-App");
  const [scheduleDate, setScheduleDate] = useState<string | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      showAlert("Validation Error", "Title is required", "error");
      return;
    }

    if (!message.trim()) {
      showAlert("Validation Error", "Message is required", "error");
      return;
    }

    // Validate scheduled date/time if provided
    let scheduled_at: string | null = null;
    if (scheduleDate) {
      if (!scheduleTime) {
        showAlert("Validation Error", "Please select both date and time for scheduling", "error");
        return;
      }

      // Combine date and time in local timezone, then convert to ISO string
      const localDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const now = new Date();
      
      // Check if scheduled time is in the past
      if (localDateTime <= now) {
        showAlert("Validation Error", "Scheduled date and time must be in the future", "error");
        return;
      }

      // Convert to ISO string (backend expects UTC)
      scheduled_at = localDateTime.toISOString();
    }

    await onSubmit({
      title: title.trim(),
      message: message.trim(),
      type,
      channel,
      scheduled_at,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Create Notification</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSaving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              required
              disabled={isSaving}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
              disabled={isSaving}
            >
              <option value="Task">Task</option>
              <option value="AMC">AMC</option>
              <option value="Tender">Tender</option>
              <option value="Payroll">Payroll</option>
              <option value="System">System</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Channel <span className="text-red-500">*</span>
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
              disabled={isSaving}
            >
              <option value="In-App">In-App</option>
              <option value="Email">Email</option>
              <option value="Push">Push</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                value={scheduleDate}
                onChange={(value) => {
                  if (value) {
                    setScheduleDate(value);
                    // If time is not set, set default time to current time + 1 hour
                    if (!scheduleTime) {
                      const now = new Date();
                      now.setHours(now.getHours() + 1);
                      setScheduleTime(format(now, "HH:mm"));
                    }
                  } else {
                    setScheduleDate(undefined);
                    setScheduleTime("");
                  }
                }}
                placeholder="Select date"
                disabled={isSaving}
              />
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="Select time"
                disabled={isSaving || !scheduleDate}
                required={!!scheduleDate}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {scheduleDate 
                ? "Notification will be sent to all employees at the scheduled date and time" 
                : "Leave empty to send immediately. Notification will be sent to all employees."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {scheduleDate ? "Scheduling..." : "Creating..."}
                </>
              ) : (
                scheduleDate ? "Schedule Notification" : "Send Notification"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Notifications"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <NotificationsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

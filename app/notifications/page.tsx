"use client";

import { useState } from "react";
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
} from "lucide-react";
import { NotificationRecord, NotificationType } from "@/types";
import { mockNotifications } from "@/lib/mock-data/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { showDeleteConfirm, showSuccess } from "@/lib/sweetalert";

const getNotificationIcon = (type: string) => {
  const iconClass = "h-6 w-6";
  switch (type) {
    case "Task":
      return <div className={cn(iconClass, "text-blue-500")}>📋</div>;
    case "Bill":
      return <div className={cn(iconClass, "text-green-500")}>💰</div>;
    case "Tender":
      return <div className={cn(iconClass, "text-purple-500")}>📄</div>;
    case "Payroll":
      return <div className={cn(iconClass, "text-orange-500")}>💼</div>;
    case "System":
      return <div className={cn(iconClass, "text-gray-500")}>⚙️</div>;
    case "Reminder":
      return <div className={cn(iconClass, "text-red-500")}>⏰</div>;
    default:
      return <Bell className={iconClass} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Unread" | NotificationType>("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "All"
        ? true
        : filterType === "Unread"
        ? !notification.is_read
        : notification.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }))
    );
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this notification");
    if (confirmed) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      breadcrumbs={["Home", "Notifications"]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read ({unreadCount})
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
          {["All", "Unread", "Task", "Bill", "Tender", "Payroll", "System", "Reminder"].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter as any)}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
                  filterType === filter
                    ? "bg-sky-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                {filter}
                {filter === "Unread" && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            )
          )}
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || filterType !== "All"
                  ? "No notifications found matching your criteria"
                  : "No notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
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
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
                            >
                              Open Resource <ArrowRight className="h-3 w-3" />
                            </Link>
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
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function CreateNotificationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (notification: NotificationRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("System");
  const [scheduleDate, setScheduleDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newNotification: NotificationRecord = {
      id: Date.now(),
      recipient_id: 1,
      recipient_name: "All Employees",
      title,
      message,
      type,
      is_read: false,
      created_at: scheduleDate
        ? new Date(scheduleDate).toISOString()
        : new Date().toISOString(),
    };

    if (scheduleDate) {
      await showSuccess(
        "Notification Scheduled",
        `Notification scheduled for ${new Date(scheduleDate).toLocaleString()}\n\nIn production, this would be queued for delivery at the scheduled time.`
      );
    }

    onSubmit(newNotification);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Create Notification</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
            >
              <option value="Task">Task</option>
              <option value="Bill">Bill</option>
              <option value="Tender">Tender</option>
              <option value="Payroll">Payroll</option>
              <option value="System">System</option>
              <option value="Reminder">Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule (Optional)
            </label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              placeholder="Leave empty to send now"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to send immediately
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {scheduleDate ? "Schedule" : "Send"} Notification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ArrowRight, X } from "lucide-react";
import { NotificationRecord } from "@/types";
import { mockNotifications } from "@/lib/mock-data/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: string) => {
  const iconClass = "h-5 w-5";
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

const groupNotificationsByTime = (notifications: NotificationRecord[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: {
    today: NotificationRecord[];
    yesterday: NotificationRecord[];
    older: NotificationRecord[];
  } = { today: [], yesterday: [], older: [] };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.created_at);
    const notifDay = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate()
    );

    if (notifDay.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>(mockNotifications);
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "Unread") return !notification.is_read;
    return true;
  });

  const latestNotifications = filteredNotifications.slice(0, 8);
  const groups = groupNotificationsByTime(latestNotifications);

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

  const renderNotification = (notification: NotificationRecord) => (
    <div
      key={notification.id}
      className={cn(
        "group flex items-start gap-3 border-b p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
        !notification.is_read && "bg-sky-50/50 dark:bg-sky-950/20"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium line-clamp-1", !notification.is_read && "text-sky-600 dark:text-sky-400")}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Mark as read"
            >
              <Check className="h-4 w-4 text-gray-500 hover:text-sky-600" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>
          {notification.link && (
            <Link
              href={notification.link}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
            >
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-96 rounded-lg border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
      {/* Header */}
      <div className="border-b p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setFilter("All")}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              filter === "All"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              filter === "Unread"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {latestNotifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          <>
            {groups.today.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                  Today
                </div>
                {groups.today.map(renderNotification)}
              </>
            )}
            {groups.yesterday.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                  Yesterday
                </div>
                {groups.yesterday.map(renderNotification)}
              </>
            )}
            {groups.older.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                  Older
                </div>
                {groups.older.map(renderNotification)}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {latestNotifications.length > 0 && (
        <div className="border-t p-2 dark:border-gray-800">
          <Link
            href="/notifications"
            className="flex items-center justify-center gap-2 w-full py-2 text-center text-sm text-sky-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            View All Notifications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

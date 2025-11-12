"use client";

import { Bell, Moon, Sun, User, Settings, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { showConfirm } from "@/lib/sweetalert";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api";

export function Header({ title, breadcrumbs }: { title: string; breadcrumbs?: string[] }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch unread notification count from backend
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const stats = await apiClient.getNotificationStatistics();
      setUnreadCount(stats.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Silently fail - don't show error in header
    }
  }, []);

  // Fetch unread count on mount and set up polling
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark";
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">{title}</h1>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <span>{crumb}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50">
                <NotificationsDropdown onNotificationUpdate={fetchUnreadCount} />
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400"
            >
              <User className="h-5 w-5" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 rounded-lg border bg-white shadow-lg dark:bg-gray-900">
                <div className="border-b p-3">
                  <p className="font-medium">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || "User"}</p>
                  <p className="text-xs text-gray-500">{user?.email || ""}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      router.push("/settings");
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      router.push("/learning");
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Learning
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        "Logout",
                        "Are you sure you want to logout?",
                        "Logout",
                        "Cancel"
                      );
                      if (confirmed) {
                        setShowUserMenu(false);
                        await logout();
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

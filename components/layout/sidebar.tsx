"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  Briefcase,
  FolderKanban,
  CheckSquare,
  UserCircle,
  HardHat,
  CalendarCheck,
  Wallet,
  CreditCard,
  Package,
  ListTodo,
  Bell,
  Mail,
  Building2,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const navigationGroups = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Clients", href: "/clients", icon: Users },
      { name: "AMCs", href: "/amcs", icon: FileCheck },
      { name: "Tenders", href: "/tenders", icon: Briefcase },
      { name: "Projects", href: "/projects", icon: FolderKanban },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "People & Payroll",
    items: [
      { name: "Employees", href: "/employees", icon: UserCircle },
      { name: "Contract Workers", href: "/contract-workers", icon: HardHat },
      { name: "Attendance", href: "/attendance", icon: CalendarCheck },
      { name: "Payroll", href: "/payroll", icon: Wallet },
      { name: "Payment Tracking", href: "/payments", icon: CreditCard },
    ],
  },
  {
    title: "Inventory & Resources",
    items: [
      { name: "Stock", href: "/resources", icon: Package },
      { name: "Task Resources", href: "/task-resources", icon: ListTodo },
    ],
  },
  {
    title: "Reports & Automation",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Email Templates", href: "/email-templates", icon: Mail },
    ],
  },
  {
    title: "System & Admin",
    items: [
      { name: "Bank Accounts", href: "/bank-accounts", icon: Building2 },
      { name: "Holiday Calendar", href: "/holiday-calendar", icon: Calendar },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300 dark:bg-gray-900",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-sky-500" />
              <span className="text-lg font-bold">Electrocom</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <Zap className="h-6 w-6 text-sky-500" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-md dark:bg-gray-900"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sky-50 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t p-4">
          {!collapsed ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>© 2025 Electrocom</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

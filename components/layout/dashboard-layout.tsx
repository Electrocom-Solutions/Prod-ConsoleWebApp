"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({
  children,
  title,
  breadcrumbs,
}: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: string[];
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

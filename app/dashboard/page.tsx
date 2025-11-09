"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileCheck,
  Briefcase,
  CheckSquare,
  AlertCircle,
  Plus,
  Loader2,
  Inbox,
} from "lucide-react";
import { apiClient, DashboardStatsResponse } from "@/lib/api";
import { formatDate, formatTimeAgo } from "@/lib/date-utils";

function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err?.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsTiles = stats
    ? [
        {
          title: "Total Clients",
          value: stats.total_clients.toString(),
          icon: Users,
        },
        {
          title: "Active AMCs",
          value: stats.active_amcs_count.toString(),
          icon: FileCheck,
        },
        {
          title: "Active Tenders",
          value: stats.active_tenders_count.toString(),
          icon: Briefcase,
        },
        {
          title: "Tasks In Progress",
          value: stats.in_progress_tasks_count.toString(),
          icon: CheckSquare,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" breadcrumbs={["Home", "Dashboard"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
            <p className="mt-4 text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard" breadcrumbs={["Home", "Dashboard"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <p className="mt-4 text-red-500">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard" breadcrumbs={["Home", "Dashboard"]}>
      <div className="space-y-6">
        {/* Stats Tiles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsTiles.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* AMCs Expiring Soon */}
          <Card>
            <CardHeader>
              <CardTitle>AMCs Expiring Soon</CardTitle>
              <CardDescription>
                Maintenance contracts expiring in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.expiring_amcs && stats.expiring_amcs.length > 0 ? (
                <div className="space-y-4">
                  {stats.expiring_amcs.map((amc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{amc.client_name}</p>
                        <p className="text-sm text-gray-500">{amc.amc_number}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Expires: {formatDate(amc.amc_expiry_date)}
                        </p>
                      </div>
                      <Badge
                        variant={amc.expiry_count_days <= 7 ? "danger" : "warning"}
                      >
                        {amc.expiry_count_days} {amc.expiry_count_days === 1 ? "day" : "days"}
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/amc")}
                  >
                    View All AMCs
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    No AMCs expiring soon
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    There are no AMCs expiring in the next 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from the system</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recent_activities && stats.recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                        <AlertCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeAgo(activity.created_at)}
                          {activity.created_by_username && ` by ${activity.created_by_username}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    No recent activity
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    There are no recent activities to display
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used operations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/clients?action=new")}
              >
                <Plus className="h-5 w-5" />
                New Client
              </Button>
              <Button
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/amc?action=new")}
              >
                <Plus className="h-5 w-5" />
                New AMC
              </Button>
              <Button
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/tenders?action=new")}
              >
                <Plus className="h-5 w-5" />
                New Tender
              </Button>
              <Button
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/tasks?action=new")}
              >
                <Plus className="h-5 w-5" />
                New Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

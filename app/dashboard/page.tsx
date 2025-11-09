import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileCheck,
  Briefcase,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Clients",
      value: "48",
      change: "+12%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Active AMCs",
      value: "32",
      change: "+5%",
      trend: "up",
      icon: FileCheck,
    },
    {
      title: "Active Tenders",
      value: "8",
      change: "-2%",
      trend: "down",
      icon: Briefcase,
    },
    {
      title: "Tasks In Progress",
      value: "24",
      change: "+8%",
      trend: "up",
      icon: CheckSquare,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "New AMC created",
      description: "AMC/2025/045 - ABC Power Ltd",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Tender filed",
      description: "TND/ER/012/2025 - HT Panel Installation",
      time: "5 hours ago",
    },
    {
      id: 3,
      title: "Task completed",
      description: "Panel maintenance at Site B",
      time: "1 day ago",
    },
  ];

  const amcExpiringSoon = [
    {
      id: 1,
      client: "ABC Power Ltd",
      amcNumber: "AMC/2024/028",
      expiryDate: "2025-11-15",
      daysLeft: 7,
    },
    {
      id: 2,
      client: "XYZ Industries",
      amcNumber: "AMC/2024/033",
      expiryDate: "2025-11-20",
      daysLeft: 12,
    },
  ];

  return (
    <DashboardLayout title="Dashboard" breadcrumbs={["Home", "Dashboard"]}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
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
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <TrendingUp
                      className={`h-3 w-3 ${
                        stat.trend === "up" ? "text-green-500" : "text-red-500"
                      }`}
                    />
                    <span
                      className={
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {stat.change}
                    </span>
                    <span>from last month</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AMCs Expiring Soon</CardTitle>
              <CardDescription>
                Maintenance contracts expiring in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {amcExpiringSoon.map((amc) => (
                  <div
                    key={amc.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{amc.client}</p>
                      <p className="text-sm text-gray-500">{amc.amcNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Expires: {amc.expiryDate}
                      </p>
                    </div>
                    <Badge
                      variant={amc.daysLeft <= 7 ? "danger" : "warning"}
                    >
                      {amc.daysLeft} days
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All AMCs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                      <AlertCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

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
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                New Client
              </Button>
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                New AMC
              </Button>
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                New Tender
              </Button>
              <Button className="h-20 flex-col gap-2">
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

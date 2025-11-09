"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Eye,
  Edit,
  UserPlus,
  Check,
  MoreHorizontal,
  IndianRupee,
  Download,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { mockTasks, getResourcesByTaskId, calculateTaskResourceCost, hasMissingUnitCosts } from "@/lib/mock-data/tasks";
import { Task, TaskStatus, TaskResource, TaskPriority } from "@/types";
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { TaskDetailSlideOver } from "@/components/tasks/task-detail-slide-over";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { showSuccess, showError } from "@/lib/sweetalert";
import { mockClients } from "@/lib/mock-data/clients";

type PeriodFilter = "today" | "week" | "month" | "custom";

export default function TaskHubPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [taskResources, setTaskResources] = useState<Record<number, TaskResource[]>>(() => {
    // Initialize resources from mock data, indexed by task_id
    const resourcesMap: Record<number, TaskResource[]> = {};
    mockTasks.forEach((task) => {
      resourcesMap[task.id] = getResourcesByTaskId(task.id);
    });
    return resourcesMap;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check for project filter in URL query params on mount
  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam) {
      setProjectFilter(projectParam);
    }
  }, [searchParams]);

  // Helper to get resources for a task from state
  const getTaskResources = (taskId: number): TaskResource[] => {
    return taskResources[taskId] || [];
  };

  // Helper to calculate resource cost from state (not mock data)
  const calculateTaskResourceCostFromState = (taskId: number): number => {
    const resources = getTaskResources(taskId);
    return resources.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  };

  // Helper to check missing unit costs from state
  const hasMissingUnitCostsFromState = (taskId: number): boolean => {
    const resources = getTaskResources(taskId);
    return resources.some((r) => !r.unit_cost);
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsSlideOverOpen(true);
  };

  const closeTaskDetail = () => {
    setIsSlideOverOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = (updatedTask: Task, resources: TaskResource[]) => {
    // Update task
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    // **FIX: Persist resources to state**
    setTaskResources((prev) => ({
      ...prev,
      [updatedTask.id]: resources,
    }));
  };

  const handleApproveTask = (task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "Approved",
              approved_by: "Admin",
              approved_at: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleRejectTask = (task: Task, reason: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "Rejected",
              internal_notes: (t.internal_notes || "") + `\n\nRejection reason: ${reason}`,
            }
          : t
      )
    );
  };

  // Get unique projects for filter
  const uniqueProjects = useMemo(() => {
    const projects = tasks
      .map((task) => task.project_name)
      .filter((name): name is string => !!name);
    return Array.from(new Set(projects)).sort();
  }, [tasks]);

  // Filter tasks by period
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Period filter
    filtered = filtered.filter((task) => {
      const taskDate = new Date(task.date);
      if (periodFilter === "today") return isToday(taskDate);
      if (periodFilter === "week") return isThisWeek(taskDate, { weekStartsOn: 1 });
      if (periodFilter === "month") return isThisMonth(taskDate);
      return true; // custom or all
    });

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => task.project_name === projectFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.employee_name?.toLowerCase().includes(query) ||
          task.client_name?.toLowerCase().includes(query) ||
          task.project_name?.toLowerCase().includes(query) ||
          task.location.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, periodFilter, statusFilter, projectFilter, searchQuery]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter((t) => t.status === "Completed" && !t.approved_by).length;
    const completed = filteredTasks.filter((t) => t.status === "Approved").length;
    const totalTime = filteredTasks.reduce((sum, t) => sum + t.time_taken_minutes, 0);
    const totalResourceCost = filteredTasks.reduce((sum, t) => sum + calculateTaskResourceCostFromState(t.id), 0);

    return { total, pending, completed, totalTime, totalResourceCost };
  }, [filteredTasks, taskResources]);

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "Open": return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "In Progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Approved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low": return "text-gray-500 dark:text-gray-400";
      case "Medium": return "text-blue-500 dark:text-blue-400";
      case "High": return "text-orange-500 dark:text-orange-400";
      case "Urgent": return "text-red-500 dark:text-red-400";
      default: return "text-gray-500 dark:text-gray-400";
    }
  };

  // CSV escape function
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExportCSV = () => {
    // Prepare CSV data with all details
    const headers = [
      "Task ID",
      "Date",
      "Employee",
      "Project",
      "Description",
      "Location",
      "Time Taken (hrs)",
      "Priority",
      "Status",
      "Resource Cost (₹)",
      "Assigned By",
      "Approved By",
    ];
    const rows = filteredTasks.map((task) => [
      task.id,
      format(new Date(task.date), "dd/MM/yyyy"),
      task.employee_name || "-",
      task.project_name || "-",
      task.description,
      task.location,
      (task.time_taken_minutes / 60).toFixed(2),
      task.priority,
      task.status,
      calculateTaskResourceCostFromState(task.id).toLocaleString("en-IN"),
      task.assigned_by || "-",
      task.approved_by || "-",
    ]);

    // Convert to CSV string with proper escaping
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tasks_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout title="Task Hub" breadcrumbs={["Home", "Tasks"]}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>

        {/* Period Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
            <button
              onClick={() => setPeriodFilter("today")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                periodFilter === "today"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              } rounded-l-lg`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriodFilter("week")}
              className={`border-x border-gray-300 px-4 py-2 text-sm font-medium transition-colors dark:border-gray-600 ${
                periodFilter === "week"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriodFilter("month")}
              className={`border-r border-gray-300 px-4 py-2 text-sm font-medium transition-colors dark:border-gray-600 ${
                periodFilter === "month"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriodFilter("custom")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                periodFilter === "custom"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              } rounded-r-lg`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.pending}
              {stats.pending > 0 && (
                <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {stats.pending}
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</p>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {(stats.totalTime / 60).toFixed(1)}
              <span className="ml-1 text-base font-normal text-gray-600 dark:text-gray-400">hrs</span>
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource Cost</p>
              <IndianRupee className="h-5 w-5 text-purple-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              ₹{(stats.totalResourceCost / 100000).toFixed(2)}
              <span className="ml-1 text-base font-normal text-gray-600 dark:text-gray-400">L</span>
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee, client, project, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Projects</option>
            {uniqueProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTasks.length > 0 && (
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-sky-300 bg-sky-50 p-4 dark:border-sky-700 dark:bg-sky-900/20">
            <p className="text-sm font-medium text-sky-900 dark:text-sky-300">
              {selectedTasks.length} task{selectedTasks.length > 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 dark:border-sky-600 dark:bg-gray-800 dark:text-sky-400 dark:hover:bg-gray-700">
                <UserPlus className="h-4 w-4" />
                Assign
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600">
                <Check className="h-4 w-4" />
                Mark Approved
              </button>
              <button
                onClick={() => setSelectedTasks([])}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Task Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="w-12 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Resource Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTasks.map((task) => {
                  const resourceCost = calculateTaskResourceCostFromState(task.id);
                  const missingCosts = hasMissingUnitCostsFromState(task.id);
                  const isExpanded = expandedTaskId === task.id;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          {task.is_new && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {format(new Date(task.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {task.employee_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {task.project_name || "-"}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-sm">
                        <div className="flex items-start gap-2">
                          {task.priority === "High" || task.priority === "Urgent" ? (
                            <span className={`mt-0.5 ${getPriorityColor(task.priority)}`}>
                              <AlertCircle className="h-4 w-4" />
                            </span>
                          ) : null}
                          <div className="line-clamp-2 text-gray-900 dark:text-white">
                            {task.description}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {task.location}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {task.time_taken_minutes} min
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {resourceCost > 0 ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              ₹{resourceCost.toLocaleString("en-IN")}
                            </div>
                            {missingCosts && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-3 w-3" />
                                Unit cost missing
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openTaskDetail(task)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No field tasks for this period — create a task or expand the date range.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Slide-Over */}
      {selectedTask && (
        <TaskDetailSlideOver
          task={selectedTask}
          resources={getTaskResources(selectedTask.id)}
          isOpen={isSlideOverOpen}
          onClose={closeTaskDetail}
          onSave={handleSaveTask}
          onApprove={handleApproveTask}
          onReject={handleRejectTask}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(newTask) => {
            setTasks([newTask, ...tasks]);
            setTaskResources((prev) => ({ ...prev, [newTask.id]: [] }));
            setShowCreateModal(false);
            showSuccess("Task created successfully");
          }}
          employees={Array.from(new Set(tasks.map((t) => t.employee_name).filter((n): n is string => !!n)))}
          projects={uniqueProjects}
          clients={mockClients}
        />
      )}
    </DashboardLayout>
  );
}

// Create Task Modal Component
function CreateTaskModal({
  onClose,
  onCreate,
  employees,
  projects,
  clients,
}: {
  onClose: () => void;
  onCreate: (task: Task) => void;
  employees: string[];
  projects: string[];
  clients: typeof mockClients;
}) {
  const [formData, setFormData] = useState({
    task_name: "",
    employee_name: "",
    project_name: "",
    project_search: "",
    description: "",
    deadline: new Date().toISOString().split("T")[0],
    location: "",
    time_taken_minutes: 0,
    estimated_time_minutes: 0,
    status: "Draft" as TaskStatus,
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Filter projects based on search
  const filteredProjects = projects.filter((project) =>
    project.toLowerCase().includes(formData.project_search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.project-dropdown-container')) {
        setShowProjectDropdown(false);
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProjectDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate project is selected
    if (!formData.project_name) {
      alert("Please select a project");
      return;
    }
    
    const newTask: Task = {
      id: Math.max(...mockTasks.map((t) => t.id), 0) + 1,
      employee_id: Math.floor(Math.random() * 1000),
      employee_name: formData.employee_name,
      project_id: Math.floor(Math.random() * 1000),
      project_name: formData.project_name,
      description: formData.description || formData.task_name,
      date: formData.deadline,
      location: formData.location,
      time_taken_minutes: formData.time_taken_minutes,
      estimated_time_minutes: formData.estimated_time_minutes,
      status: formData.status,
      priority: "Medium" as TaskPriority,
      assigned_by: "Admin",
      is_new: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onCreate(newTask);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="Enter task name"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Employee */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Assign to Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
            </div>

            {/* Project - Searchable Dropdown */}
            <div className="relative project-dropdown-container">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Project <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.project_search || formData.project_name}
                  onChange={(e) => {
                    setFormData({ ...formData, project_search: e.target.value, project_name: "" });
                    setShowProjectDropdown(true);
                  }}
                  onFocus={() => {
                    if (projects.length > 0) {
                      setShowProjectDropdown(true);
                    }
                  }}
                  placeholder="Search and select project"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {showProjectDropdown && filteredProjects.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProjects.map((project) => (
                      <button
                        key={project}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, project_name: project, project_search: project });
                          setShowProjectDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {project}
                      </button>
                    ))}
                  </div>
                )}
                {showProjectDropdown && filteredProjects.length === 0 && formData.project_search && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    No projects found
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={formData.estimated_time_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter task location"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Task Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task in detail..."
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

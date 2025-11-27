"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  Loader2,
  Inbox,
  Trash2,
} from "lucide-react";
import { Task, TaskStatus, TaskResource, TaskPriority, TaskAttachment, TaskActivity } from "@/types";
import { format } from "date-fns";
import { TaskDetailSlideOver } from "@/components/tasks/task-detail-slide-over";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { showSuccess, showError, showDeleteConfirm, showAlert, showConfirm } from "@/lib/sweetalert";
import {
  apiClient,
  TaskStatisticsResponse,
  BackendTaskListItem,
  BackendTaskDetail,
  BackendTaskResource,
  BackendTaskAttachment,
  BackendTaskActivity,
  BackendProjectListItem,
  BackendClientListItem,
  BackendEmployeeListItem,
} from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DatePicker } from "@/components/ui/date-picker";

type PeriodFilter = "today" | "this_week" | "this_month" | "all";

/**
 * Map backend task list item to frontend Task type
 */
function mapBackendTaskListItemToFrontend(backendTask: BackendTaskListItem): Task {
  // Map backend status to frontend status
  let status: TaskStatus = "Open";
  if (backendTask.status === "Draft") status = "Open";
  else if (backendTask.status === "In Progress") status = "In Progress";
  else if (backendTask.status === "Completed") status = "Completed";
  else if (backendTask.status === "Canceled") status = "Rejected";

  return {
    id: backendTask.id,
    employee_id: backendTask.employee || 0,
    employee_name: backendTask.employee_name || undefined,
    client_id: undefined, // Not in list item
    client_name: undefined, // Not used anymore
    project_id: backendTask.project,
    project_name: backendTask.project_name || undefined,
    description: backendTask.task_name, // task_name is the description/title
    date: backendTask.deadline || '', // Use empty string if null
    location: backendTask.location || "",
    time_taken_minutes: backendTask.time_taken_minutes,
    estimated_time_minutes: backendTask.time_taken_minutes,
    status,
    approval_status: backendTask.approval_status || 'pending',
    priority: "Medium" as TaskPriority, // Default, not in backend
    created_at: backendTask.created_at,
    updated_at: backendTask.created_at,
  };
}

/**
 * Map backend task detail to frontend Task type
 */
function mapBackendTaskDetailToFrontend(backendTask: BackendTaskDetail): Task {
  // Map backend status to frontend status
  let status: TaskStatus = "Open";
  if (backendTask.status === "Draft") status = "Open";
  else if (backendTask.status === "In Progress") status = "In Progress";
  else if (backendTask.status === "Completed") status = "Completed";
  else if (backendTask.status === "Canceled") status = "Rejected";

  return {
    id: backendTask.id,
    employee_id: backendTask.employee || 0,
    employee_name: backendTask.employee_name || undefined,
    client_id: undefined,
    client_name: undefined, // Not used anymore
    project_id: backendTask.project,
    project_name: backendTask.project_name || undefined,
    description: backendTask.task_name, // task_name is the description/title
    date: backendTask.deadline || '', // Use empty string if null
    location: backendTask.location || "",
    time_taken_minutes: backendTask.time_taken_minutes,
    estimated_time_minutes: backendTask.time_taken_minutes,
    status,
    approval_status: backendTask.approval_status || 'pending',
    priority: "Medium" as TaskPriority,
    internal_notes: backendTask.internal_notes,
    created_at: backendTask.created_at,
    updated_at: backendTask.updated_at,
  };
}

/**
 * Map backend task resource to frontend TaskResource type
 */
function mapBackendTaskResourceToFrontend(backendResource: BackendTaskResource, taskId: number): TaskResource {
  return {
    id: backendResource.id,
    task_id: taskId,
    resource_name: backendResource.resource_name,
    quantity: parseFloat(backendResource.quantity),
    unit: "pcs", // Default unit, not in backend
    unit_cost: parseFloat(backendResource.unit_cost),
    total_cost: parseFloat(backendResource.total_cost),
    created_at: backendResource.created_at,
  };
}

/**
 * Map backend task attachment to frontend TaskAttachment type
 */
function mapBackendTaskAttachmentToFrontend(backendAttachment: BackendTaskAttachment, taskId: number): TaskAttachment {
  // Determine file type from file name
  const fileName = backendAttachment.file_name.toLowerCase();
  let fileType: "image" | "pdf" | "doc" | "other" = "other";
  if (fileName.endsWith(".pdf")) fileType = "pdf";
  else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) fileType = "image";
  else if (fileName.match(/\.(doc|docx)$/)) fileType = "doc";

  return {
    id: backendAttachment.id,
    task_id: taskId,
    file_name: backendAttachment.file_name,
    file_url: backendAttachment.file_url,
    file_type: fileType,
    file_size: 0, // Not in backend response
    uploaded_by: backendAttachment.created_by_username || "Unknown",
    uploaded_at: backendAttachment.created_at,
    notes: backendAttachment.notes,
  };
}

/**
 * Map backend task activity to frontend TaskActivity type
 */
function mapBackendTaskActivityToFrontend(backendActivity: BackendTaskActivity, taskId: number): TaskActivity {
  // Map backend action to frontend type
  let type: TaskActivity["type"] = "Created";
  if (backendActivity.action === "CREATED") type = "Created";
  else if (backendActivity.action === "UPDATED") type = "Edited";
  else if (backendActivity.action === "APPROVED") type = "Approved";
  else if (backendActivity.action === "DELETED") type = "Created"; // Default

  return {
    id: backendActivity.id,
    task_id: taskId,
    type,
    description: backendActivity.description,
    performed_by: backendActivity.created_by_username || "Unknown",
    timestamp: backendActivity.created_at,
  };
}

function TaskHubPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResources, setTaskResources] = useState<Record<number, TaskResource[]>>({});
  const [statistics, setStatistics] = useState<TaskStatisticsResponse | null>(null);
  const [projects, setProjects] = useState<BackendProjectListItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // TODO: Add Employee type
  const [isLoading, setIsLoading] = useState(false); // Start as false, will be set to true when fetch starts
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false); // Track if we've attempted to fetch at least once
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'pending' | 'approved' | 'rejected' | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showApprovalStatusDropdown, setShowApprovalStatusDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [viewTaskModal, setViewTaskModal] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const filter = periodFilter === "all" ? "all" : periodFilter;
      const stats = await apiClient.getTaskStatistics({ filter: filter as any });
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch task statistics:", err);
      // Don't set error state for statistics, just log it
      // Statistics failure shouldn't prevent the page from rendering
    }
  }, [periodFilter]);

  // Fetch projects for dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const response = await apiClient.getProjects();
      if (response && response.results) {
        setProjects(response.results);
      } else {
        console.warn('[Tasks Page] Invalid projects response, setting empty array');
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      // Set empty array on error so tasks can still be fetched (without project filter)
      setProjects([]);
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasAttemptedFetch(true);
    try {
      const params: {
        search?: string;
        project?: number;
        status?: "Draft" | "In Progress" | "Completed" | "Canceled";
        approval_status?: "pending" | "approved" | "rejected";
        date_filter?: "today" | "this_week" | "this_month" | "all";
        page?: number;
      } = { page: currentPage };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (projectFilter !== "all") {
        // Try to find project by name if projects are loaded
        if (projects.length > 0) {
          const project = projects.find((p) => p.name === projectFilter);
          if (project) {
            params.project = project.id;
          }
        }
        // If projects not loaded yet, skip project filter for now
        // Tasks will be refetched when projects load
      }
      if (statusFilter !== "all") {
        // Map frontend status to backend status
        if (statusFilter === "Open") params.status = "Draft";
        else if (statusFilter === "In Progress") params.status = "In Progress";
        else if (statusFilter === "Completed") params.status = "Completed";
        else if (statusFilter === "Rejected") params.status = "Canceled";
      }
      if (approvalStatusFilter !== "all") {
        params.approval_status = approvalStatusFilter;
      }
      params.date_filter = periodFilter === "all" ? "all" : periodFilter;

      const response = await apiClient.getTasks(params);
      
      // Handle null/undefined response
      if (!response) {
        console.error('[Tasks Page] No response received from API');
        setError("No response from server. Please try again.");
        setTasks([]);
        return;
      }
      
      // Handle missing results - treat as empty list rather than error
      if (!response.results) {
        console.warn('[Tasks Page] Response missing results field, treating as empty list:', response);
        setTasks([]);
        setTotalPages(1);
        setError(null);
        return;
      }
      
      // Handle case where results is not an array
      if (!Array.isArray(response.results)) {
        console.error('[Tasks Page] Response results is not an array:', typeof response.results, response.results);
        setError("Invalid response format from server.");
        setTasks([]);
        return;
      }
      
      const mappedTasks = response.results.map(mapBackendTaskListItemToFrontend);
      setTasks(mappedTasks);
      setTotalPages(Math.ceil((response.count || mappedTasks.length) / 20)); // Assuming 20 items per page
      setError(null); // Clear any previous errors

      // Note: Resources are fetched on-demand when task detail is opened
      // This improves performance by not fetching resources for all tasks upfront
      const resourcesMap: Record<number, TaskResource[]> = {};
      mappedTasks.forEach((task) => {
        resourcesMap[task.id] = []; // Initialize empty, will be fetched when needed
      });
      setTaskResources(resourcesMap);
    } catch (err: any) {
      console.error("[Tasks Page] Failed to fetch tasks:", err);
      console.error("[Tasks Page] Error details:", {
        message: err?.message,
        error: err?.error,
        status: err?.status,
        response: err?.response,
        stack: err?.stack,
      });
      
      // Extract error message from various possible error formats
      let errorMessage = "Failed to load tasks. Please check your connection and try again.";
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.response) {
        // Try to extract message from Django REST Framework error response
        if (err.response.detail) {
          errorMessage = err.response.detail;
        } else if (err.response.error) {
          errorMessage = typeof err.response.error === 'string' ? err.response.error : JSON.stringify(err.response.error);
        }
      }
      
      setError(errorMessage);
      setTasks([]); // Set empty array on error to prevent infinite loading
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, projectFilter, statusFilter, approvalStatusFilter, periodFilter, projects]); // Include projects array for project filter lookup

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-filter-dropdown-container')) {
        setShowStatusDropdown(false);
      }
      if (!target.closest('.approval-status-filter-dropdown-container')) {
        setShowApprovalStatusDropdown(false);
      }
      if (!target.closest('.project-filter-dropdown-container')) {
        setShowProjectDropdown(false);
      }
    };

    if (showStatusDropdown || showApprovalStatusDropdown || showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown, showApprovalStatusDropdown, showProjectDropdown]);

  // Initial data fetch - run once on mount
  useEffect(() => {
    fetchStatistics();
    fetchProjects();
  }, [fetchStatistics, fetchProjects]);

  // Fetch tasks - run when dependencies change
  // This will run on mount and whenever filters change
  useEffect(() => {
    let isMounted = true;
    
    const loadTasks = async () => {
      try {
        await fetchTasks();
      } catch (err) {
        // Error is already handled in fetchTasks, but ensure loading is cleared
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTasks();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetchTasks]);

  // Check for project filter and action=new in URL query params on mount
  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam) {
      setProjectFilter(projectParam);
    }
    
    const action = searchParams.get("action");
    if (action === "new") {
      setShowCreateModal(true);
      // Remove the query parameter from URL
      router.replace("/tasks");
    }
  }, [searchParams, router]);

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

  const openTaskDetail = async (task: Task) => {
    setIsLoading(true);
    try {
      // Fetch full task details from backend
      const taskDetail = await apiClient.getTask(task.id);
      const mappedTask = mapBackendTaskDetailToFrontend(taskDetail);
      const mappedResources = taskDetail.resources.map((r) =>
        mapBackendTaskResourceToFrontend(r, task.id)
      );
      
      setSelectedTask(mappedTask);
      setTaskResources((prev) => ({
        ...prev,
        [task.id]: mappedResources,
      }));
      setIsSlideOverOpen(true);
    } catch (err: any) {
      console.error("Failed to fetch task details:", err);
      showAlert("Error", err.message || "Failed to load task details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const closeTaskDetail = () => {
    setIsSlideOverOpen(false);
    setSelectedTask(null);
    setIsEditMode(false);
  };

  const handleSaveTask = async (updatedTask: Task, resources: TaskResource[]) => {
    if (!selectedTask) return;
    
    setIsSaving(true);
    try {
      // Update task with all fields
      const updateData: any = {
        task_name: updatedTask.description,
        deadline: updatedTask.date,
        location: updatedTask.location,
        estimated_time: updatedTask.time_taken_minutes,
        internal_notes: updatedTask.internal_notes,
      };
      
      // Get task_description from extended task object if available
      const taskWithDescription = updatedTask as Task & { task_description?: string };
      if (taskWithDescription.task_description !== undefined) {
        updateData.task_description = taskWithDescription.task_description;
      }
      
      // Add optional fields if they exist
      if (updatedTask.project_id) {
        updateData.project = updatedTask.project_id;
      }
      if (updatedTask.employee_id) {
        updateData.employee = updatedTask.employee_id;
      }
      
      // Map frontend status to backend status
      if (updatedTask.status === "Open") updateData.status = "Draft";
      else if (updatedTask.status === "In Progress") updateData.status = "In Progress";
      else if (updatedTask.status === "Completed") updateData.status = "Completed";
      else if (updatedTask.status === "Rejected") updateData.status = "Canceled";

      await apiClient.updateTask(updatedTask.id, updateData);

      // Update resources
      for (const resource of resources) {
        if (resource.id > 0) {
          // Update existing resource
          await apiClient.updateTaskResource(updatedTask.id, resource.id, {
            quantity: resource.quantity,
            unit_cost: resource.unit_cost,
            total_cost: resource.total_cost,
          });
        } else {
          // Create new resource
          await apiClient.attachTaskResource(updatedTask.id, {
            resource_name: resource.resource_name,
            quantity: resource.quantity,
            unit_cost: resource.unit_cost || 0,
            total_cost: resource.total_cost,
          });
        }
      }

      // Refresh tasks and resources
      await fetchTasks();
      await fetchStatistics();
      
      showSuccess("Task updated successfully!");
      closeTaskDetail();
    } catch (err: any) {
      console.error("Failed to save task:", err);
      showAlert("Save Failed", err.message || "An error occurred during save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveTask = async (task: Task) => {
    try {
      await apiClient.approveTask(task.id);
      showSuccess("Task approved successfully!");
      await fetchTasks();
      await fetchStatistics();
      closeTaskDetail();
    } catch (err: any) {
      console.error("Failed to approve task:", err);
      showAlert("Approval Failed", err.message || "An error occurred during approval.", "error");
    }
  };

  const handleRejectTask = async (task: Task, reason: string) => {
    try {
      await apiClient.rejectTask(task.id, reason);
      showSuccess("Task rejected successfully!");
      await fetchTasks();
      await fetchStatistics();
      closeTaskDetail();
    } catch (err: any) {
      console.error("Failed to reject task:", err);
      showAlert("Rejection Failed", err.message || "An error occurred during rejection.", "error");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTasks.length === 0) {
      showAlert("No Selection", "Please select at least one task to approve.", "info");
      return;
    }

    const confirmed = await showConfirm(
      "Bulk Approve Tasks",
      `Are you sure you want to approve ${selectedTasks.length} task(s)?`
    );

    if (!confirmed) return;

    try {
      const result = await apiClient.bulkApproveTasks(selectedTasks);
      let message = `Successfully approved ${result.approved_count} task(s).`;
      if (result.errors && result.errors.length > 0) {
        message += ` Errors: ${result.errors.join(", ")}`;
      }
      showSuccess(message);
      setSelectedTasks([]);
      await fetchTasks();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to bulk approve tasks:", err);
      showAlert("Bulk Approval Failed", err.message || "An error occurred during bulk approval.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) {
      showAlert("No Selection", "Please select at least one task to delete.", "info");
      return;
    }

    const confirmed = await showDeleteConfirm(`${selectedTasks.length} task${selectedTasks.length > 1 ? "s" : ""}`);
    if (!confirmed) return;

    try {
      const result = await apiClient.bulkDeleteTasks(selectedTasks);
      let message = `Successfully deleted ${result.deleted_count} task(s).`;
      if (result.skipped_count > 0) {
        message += ` ${result.skipped_count} task(s) were not found (may have been already deleted).`;
      }
      if (result.errors && result.errors.length > 0) {
        // Only show actual errors (not "not found" messages)
        message += ` Errors: ${result.errors.join(", ")}`;
      }
      showSuccess(message);
      setSelectedTasks([]);
      await fetchTasks();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to bulk delete tasks:", err);
      showAlert("Bulk Delete Failed", err.message || "An error occurred during bulk deletion.", "error");
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTasks.length === 0) {
      showAlert("No Selection", "Please select at least one task to assign.", "info");
      return;
    }

    // For now, show a message that bulk assign is not yet implemented
    // TODO: Implement bulk assign modal with employee selection
    showAlert("Coming Soon", "Bulk assign functionality will be available soon.", "info");
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = await showDeleteConfirm("this task");
    if (confirmed) {
      try {
        await apiClient.deleteTask(taskId);
        showSuccess("Task deleted successfully!");
        await fetchTasks();
        await fetchStatistics();
      } catch (err: any) {
        console.error("Failed to delete task:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  // Get unique projects for filter (from fetched projects)
  const uniqueProjects = useMemo(() => {
    return projects.map((p) => p.name).sort();
  }, [projects]);

  // Statistics from backend (already filtered by period)
  const stats = useMemo(() => {
    if (!statistics) {
      return {
        total: 0,
        inProgress: 0,
        pending: 0,
        approved: 0,
        totalResourceCost: 0,
      };
    }
    return {
      total: statistics.total_tasks,
      inProgress: statistics.in_progress,
      pending: statistics.pending_approval,
      approved: statistics.approved_tasks,
      totalResourceCost: statistics.total_resource_cost,
    };
  }, [statistics]);
  
  // Calculate pending approval count with fallback
  const pendingApprovalCount = useMemo(() => {
    // Use statistics if available and valid
    if (statistics && statistics.pending_approval !== undefined && statistics.pending_approval !== null) {
      return statistics.pending_approval;
    }
    // Fallback: count from current tasks list (may not be accurate if paginated)
    return tasks.filter(t => t.approval_status === 'pending').length;
  }, [statistics, tasks]);

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

  // Update period filter and refetch
  const handlePeriodFilterChange = (filter: PeriodFilter) => {
    setPeriodFilter(filter);
    // Statistics will be refetched via useEffect
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
    if (tasks.length === 0) {
      showAlert("No Data", "No tasks to export.", "info");
      return;
    }

    // Prepare CSV data with all details
    const headers = [
      "Task ID",
      "Date",
      "Employee",
      "Project",
      "Description",
      "Location",
      "Time Taken (hrs)",
      "Status",
      "Resource Cost (₹)",
    ];
    const rows = tasks.map((task) => [
      task.id,
      task.date ? format(new Date(task.date), "dd/MM/yyyy") : 'No deadline',
      task.employee_name || "-",
      task.project_name || "-",
      task.description,
      task.location || "-",
      (task.time_taken_minutes / 60).toFixed(2),
      task.status,
      calculateTaskResourceCostFromState(task.id).toLocaleString("en-IN"),
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

  // Show loading only on initial load (when isLoading is true, no tasks yet, and no error)
  // Also check hasAttemptedFetch to ensure we've actually started fetching
  if (isLoading && tasks.length === 0 && !error && hasAttemptedFetch) {
    return (
      <DashboardLayout title="Task Hub" breadcrumbs={["Home", "Tasks"]}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative h-16 w-16">
                <Image
                  src="/logos/logo only.png"
                  alt="Electrocom Logo"
                  fill
                  sizes="64px"
                  className="object-contain dark:brightness-0 dark:invert"
                  priority
                />
              </div>
            </div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
            <p className="mt-4 text-gray-500">Loading tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <DashboardLayout title="Task Hub" breadcrumbs={["Home", "Tasks"]}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading tasks: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Loader2 className="h-4 w-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

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
              onClick={() => handlePeriodFilterChange("today")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                periodFilter === "today"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              } rounded-l-lg`}
            >
              Today
            </button>
            <button
              onClick={() => handlePeriodFilterChange("this_week")}
              className={`border-x border-gray-300 px-4 py-2 text-sm font-medium transition-colors dark:border-gray-600 ${
                periodFilter === "this_week"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handlePeriodFilterChange("this_month")}
              className={`border-r border-gray-300 px-4 py-2 text-sm font-medium transition-colors dark:border-gray-600 ${
                periodFilter === "this_month"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePeriodFilterChange("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                periodFilter === "all"
                  ? "bg-sky-500 text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              } rounded-r-lg`}
            >
              All
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
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {statistics?.total_tasks ?? "..."}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {statistics?.in_progress ?? "..."}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {statistics ? pendingApprovalCount : "..."}
              {pendingApprovalCount > 0 && (
                <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {pendingApprovalCount}
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {statistics?.approved_tasks ?? "..."}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource Cost</p>
              <IndianRupee className="h-5 w-5 text-purple-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {statistics ? `₹${(statistics.total_resource_cost / 1000).toFixed(1)}K` : "..."}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee, tender, project, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="relative project-filter-dropdown-container">
            <button
              type="button"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-between min-w-[150px]"
            >
              <span>{projectFilter === "all" ? "All Projects" : projectFilter}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showProjectDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setProjectFilter("all");
                    setShowProjectDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  All Projects
                </button>
                {uniqueProjects.map((project) => (
                  <button
                    key={project}
                    type="button"
                    onClick={() => {
                      setProjectFilter(project);
                      setShowProjectDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {project}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative status-filter-dropdown-container">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-between min-w-[130px]"
            >
              <span>
                {statusFilter === "all" ? "All Status" : statusFilter === "Open" ? "Draft" : statusFilter === "Rejected" ? "Canceled" : statusFilter}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Open");
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("In Progress");
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Completed");
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Rejected");
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Canceled
                </button>
              </div>
            )}
          </div>
          <div className="relative approval-status-filter-dropdown-container">
            <button
              type="button"
              onClick={() => setShowApprovalStatusDropdown(!showApprovalStatusDropdown)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-between min-w-[150px]"
            >
              <span>
                {approvalStatusFilter === "all" ? "All Approval Status" : approvalStatusFilter === "pending" ? "Pending" : approvalStatusFilter === "approved" ? "Approved" : "Rejected"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showApprovalStatusDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setApprovalStatusFilter("all");
                    setShowApprovalStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  All Approval Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalStatusFilter("pending");
                    setShowApprovalStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalStatusFilter("approved");
                    setShowApprovalStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalStatusFilter("rejected");
                    setShowApprovalStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Rejected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTasks.length > 0 && (
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-sky-300 bg-sky-50 p-4 dark:border-sky-700 dark:bg-sky-900/20">
            <p className="text-sm font-medium text-sky-900 dark:text-sky-300">
              {selectedTasks.length} task{selectedTasks.length > 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkAssign}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 dark:border-sky-600 dark:bg-gray-800 dark:text-sky-400 dark:hover:bg-gray-700"
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </button>
              <button
                onClick={handleBulkApprove}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Check className="h-4 w-4" />
                Mark Approved
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
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
        {tasks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tasks found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first task
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length > 0 && selectedTasks.length === tasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(tasks.map(t => t.id));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </th>
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
                    Task Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Approval Status
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
                {tasks.map((task) => {
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
                        {task.date ? format(new Date(task.date), "MMM dd, yyyy") : 'No deadline set'}
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
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          task.approval_status === 'approved' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : task.approval_status === 'rejected'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {task.approval_status === 'approved' ? 'Approved' : task.approval_status === 'rejected' ? 'Rejected' : 'Pending'}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              setIsLoading(true);
                              try {
                                const taskDetail = await apiClient.getTask(task.id);
                                const mappedTask = mapBackendTaskDetailToFrontend(taskDetail);
                                setViewTaskModal(mappedTask);
                              } catch (err: any) {
                                console.error("Failed to fetch task details:", err);
                                showAlert("Error", err.message || "Failed to load task details.", "error");
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditMode(true);
                              openTaskDetail(task);
                            }}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {/* Task View Modal */}
      {viewTaskModal && (
        <TaskViewModal
          task={viewTaskModal}
          onClose={() => {
            setViewTaskModal(null);
            fetchTasks();
            fetchStatistics();
          }}
        />
      )}

      {/* Task Detail Slide-Over */}
      {selectedTask !== null && (
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
          onCreate={async (taskData) => {
            try {
              // Find project ID from project name
              const project = projects.find((p) => p.name === taskData.project_name);
              if (!project) {
                showAlert("Error", "Project not found.", "error");
                return;
              }

              // Create task via backend API
              const createdTask = await apiClient.createTask({
                project: project.id,
                task_name: taskData.task_name,
                deadline: taskData.deadline,
                employee: taskData.employee_id,
                status: taskData.status === "Open" ? "Draft" : (taskData.status as any),
                estimated_time: taskData.estimated_time_minutes || undefined,
                location: taskData.location || undefined,
                task_description: taskData.description || undefined,
              });

              showSuccess("Task created successfully!");
              setShowCreateModal(false);
              
              // Refresh tasks and statistics
              // Note: The task will appear in the list based on the current period filter
              // If the task deadline is not in the current period, it may not appear until the filter is changed
              await Promise.all([fetchTasks(), fetchStatistics()]);
            } catch (err: any) {
              console.error("Failed to create task:", err);
              showAlert("Create Failed", err.message || "An error occurred during task creation.", "error");
            }
          }}
          projects={projects}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

export default function TaskHubPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <DashboardLayout title="Tasks" breadcrumbs={["Home", "Tasks"]}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        </DashboardLayout>
      }>
        <TaskHubPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

// Task View Modal Component
function TaskViewModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [taskDetail, setTaskDetail] = useState<BackendTaskDetail | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [resources, setResources] = useState<TaskResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApprovalDropdown, setShowApprovalDropdown] = useState(false);
  const [currentApprovalStatus, setCurrentApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>(task.approval_status || 'pending');

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const detail = await apiClient.getTask(task.id);
        setTaskDetail(detail);
        setCurrentApprovalStatus(detail.approval_status || 'pending');
        
        const mappedAttachments: TaskAttachment[] = detail.attachments.map((att) => {
          const fileName = att.file_name.toLowerCase();
          let fileType: "image" | "pdf" | "doc" | "other" = "other";
          if (fileName.endsWith(".pdf")) fileType = "pdf";
          else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) fileType = "image";
          else if (fileName.match(/\.(doc|docx)$/)) fileType = "doc";

          let previewUrl = att.file_url;
          if (fileType === "pdf" || fileType === "doc") {
            previewUrl = apiClient.getTaskDocumentPreviewUrl(task.id, att.id);
          } else if (att.file_url && !att.file_url.startsWith('http://') && !att.file_url.startsWith('https://')) {
            previewUrl = apiClient.getTaskDocumentUrl(task.id, att.file_url);
          }

          return {
            id: att.id,
            task_id: task.id,
            file_name: att.file_name,
            file_url: previewUrl,
            file_type: fileType,
            file_size: 0,
            uploaded_by: att.created_by_username || "Unknown",
            uploaded_at: att.created_at,
            notes: att.notes,
          };
        });
        setAttachments(mappedAttachments);

        const mappedResources = detail.resources.map((r) =>
          mapBackendTaskResourceToFrontend(r, task.id)
        );
        setResources(mappedResources);
      } catch (err: any) {
        console.error("Failed to fetch task details:", err);
        showAlert("Error", err.message || "Failed to load task details.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (task.id) {
      fetchDetail();
    }
  }, [task.id]);

  const handleApprovalStatusChange = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    setIsSaving(true);
    try {
      await apiClient.updateTask(task.id, { approval_status: newStatus });
      setCurrentApprovalStatus(newStatus);
      setShowApprovalDropdown(false);
      showSuccess("Approval status updated successfully!");
      onClose();
    } catch (err: any) {
      console.error("Failed to update approval status:", err);
      showAlert("Error", err.message || "Failed to update approval status.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.approval-status-dropdown-container')) {
        setShowApprovalDropdown(false);
      }
    };

    if (showApprovalDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showApprovalDropdown]);

  if (!taskDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.task_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {taskDetail.deadline ? format(new Date(taskDetail.deadline), "MMM dd, yyyy") : 'No deadline set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.employee_name || "Unassigned"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.project_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.location || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Taken</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.time_taken_minutes} minutes</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Status</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{taskDetail.status}</p>
            </div>
            <div className="relative approval-status-dropdown-container">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Status</label>
              <button
                type="button"
                onClick={() => setShowApprovalDropdown(!showApprovalDropdown)}
                disabled={isSaving}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-between"
              >
                <span className="capitalize">{currentApprovalStatus}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showApprovalDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleApprovalStatusChange('pending')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalStatusChange('approved')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalStatusChange('rejected')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Rejected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {taskDetail.task_description && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{taskDetail.task_description}</p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</label>
              <div className="mt-2 space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{attachment.file_name}</span>
                    <button
                      onClick={() => window.open(attachment.file_url, '_blank')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resources</label>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Resource</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Unit Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {resources.map((resource) => (
                      <tr key={resource.id}>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{resource.resource_name}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{resource.quantity}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">₹{resource.unit_cost?.toLocaleString("en-IN") || "—"}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">₹{resource.total_cost?.toLocaleString("en-IN") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Task Modal Component
function CreateTaskModal({
  onClose,
  onCreate,
  projects,
  isSaving = false,
}: {
  onClose: () => void;
  onCreate: (taskData: {
    task_name: string;
    project_name: string;
    employee_id: number;
    deadline: string;
    estimated_time_minutes: number;
    location: string;
    description: string;
    status: TaskStatus;
  }) => Promise<void>;
  projects: BackendProjectListItem[];
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState({
    task_name: "",
    project_id: 0,
    project_name: "",
    project_search: "",
    description: "",
    deadline: format(new Date(), "yyyy-MM-dd"),
    location: "",
    estimated_time_minutes: 0,
    status: "Open" as TaskStatus, // Maps to "Draft" in backend
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [employees, setEmployees] = useState<BackendEmployeeListItem[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");

  // Fetch employees when modal opens
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const response = await apiClient.getEmployees({});
        setEmployees(response.results);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Filter projects based on search
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(formData.project_search.toLowerCase())
  );

  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) => {
    const searchTerm = employeeSearch.toLowerCase();
    const fullName = employee.full_name?.toLowerCase() || "";
    const email = employee.email?.toLowerCase() || "";
    const phone = employee.phone_number?.toLowerCase() || "";
    const employeeCode = employee.employee_code?.toLowerCase() || "";
    return fullName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || employeeCode.includes(searchTerm);
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.project-dropdown-container')) {
        setShowProjectDropdown(false);
      }
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
      if (!target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    if (showProjectDropdown || showEmployeeDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProjectDropdown, showEmployeeDropdown, showStatusDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate project is selected
    if (!formData.project_name || !formData.project_id) {
      showAlert("Validation Error", "Please select a project", "error");
      return;
    }

    if (!formData.task_name.trim()) {
      showAlert("Validation Error", "Task name is required", "error");
      return;
    }

    // Validate employee is selected
    if (!selectedEmployeeId) {
      showAlert("Validation Error", "Please assign the task to an employee", "error");
      return;
    }

    // Validate deadline is set
    if (!formData.deadline) {
      showAlert("Validation Error", "Deadline is required", "error");
      return;
    }

    await onCreate({
      task_name: formData.task_name,
      project_name: formData.project_name,
      employee_id: selectedEmployeeId,
      deadline: formData.deadline,
      estimated_time_minutes: formData.estimated_time_minutes,
      location: formData.location,
      description: formData.description,
      status: formData.status,
    });
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
            {/* Employee - Searchable Dropdown */}
            <div className="relative employee-dropdown-container">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Assign to Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={employeeSearch || selectedEmployeeName}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                      if (!e.target.value) {
                        setSelectedEmployeeId(undefined);
                        setSelectedEmployeeName("");
                      }
                    }}
                    onFocus={() => {
                      if (employees.length > 0) {
                        setShowEmployeeDropdown(true);
                      }
                    }}
                    placeholder="Search employee by name, email, or phone"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {selectedEmployeeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmployeeId(undefined);
                        setSelectedEmployeeName("");
                        setEmployeeSearch("");
                        setShowEmployeeDropdown(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      title="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showEmployeeDropdown && !isLoadingEmployees && filteredEmployees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(employee.id);
                          setSelectedEmployeeName(employee.full_name || "");
                          setEmployeeSearch(employee.full_name || "");
                          setShowEmployeeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium">{employee.full_name || employee.employee_code}</div>
                        {employee.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{employee.email}</div>
                        )}
                        {employee.phone_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{employee.phone_number}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showEmployeeDropdown && isLoadingEmployees && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading employees...
                    </div>
                  </div>
                )}
                {showEmployeeDropdown && !isLoadingEmployees && filteredEmployees.length === 0 && employeeSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    No employees found
                  </div>
                )}
              </div>
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
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, project_name: project.name, project_id: project.id, project_search: project.name });
                          setShowProjectDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {project.name}
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
              <div className="relative status-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-left text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between"
                >
                  <span>{formData.status === "Open" ? "Draft" : formData.status === "Rejected" ? "Canceled" : formData.status}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, status: "Open" });
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, status: "In Progress" });
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, status: "Completed" });
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, status: "Rejected" });
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Canceled
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Deadline <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.deadline}
                onChange={(value) => setFormData({ ...formData, deadline: value || format(new Date(), "yyyy-MM-dd") })}
                placeholder="Select deadline date"
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
              Task Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task in detail..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
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

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Inbox,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
} from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";
import {
  apiClient,
  ProjectStatisticsResponse,
  BackendProjectListItem,
  BackendProjectDetail,
  BackendClientListItem,
} from "@/lib/api";
import { showDeleteConfirm, showAlert } from "@/lib/sweetalert";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { format } from "date-fns";

type ProjectWithNames = Project & { client_name?: string; tender_name?: string | null };

/**
 * Map backend project list item to frontend Project type
 */
function mapBackendProjectListItemToFrontend(backendProject: BackendProjectListItem): ProjectWithNames {
  return {
    id: backendProject.id,
    client_id: backendProject.client,
    name: backendProject.name,
    description: "", // Not in list item
    start_date: backendProject.start_date,
    end_date: backendProject.end_date,
    status: backendProject.status,
    created_at: backendProject.created_at,
    updated_at: backendProject.created_at, // Fallback
    client_name: backendProject.client_name,
    tender_name: backendProject.tender_name,
  };
}

/**
 * Map backend project detail to frontend Project type
 */
function mapBackendProjectDetailToFrontend(backendProject: BackendProjectDetail): Project {
  return {
    id: backendProject.id,
    client_id: backendProject.client,
    name: backendProject.name,
    description: backendProject.description || "",
    start_date: backendProject.start_date,
    end_date: backendProject.end_date,
    status: backendProject.status,
    created_at: backendProject.created_at,
    updated_at: backendProject.updated_at,
  };
}

function ProjectsPageContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithNames[]>([]);
  const [statistics, setStatistics] = useState<ProjectStatisticsResponse | null>(null);
  const [clients, setClients] = useState<BackendClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getProjectStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch project statistics:", err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch clients for dropdown
  const fetchClients = useCallback(async () => {
    try {
      const response = await apiClient.getClients();
      setClients(response.results);
    } catch (err: any) {
      console.error("Failed to fetch clients:", err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: {
        search?: string;
        status?: "Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled";
        page?: number;
      } = { page: currentPage };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== "All") {
        params.status = statusFilter as "Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled";
      }

      const response = await apiClient.getProjects(params);
      setProjects(response.results.map(mapBackendProjectListItemToFrontend));
      setTotalPages(Math.ceil(response.count / 20)); // Assuming 20 items per page
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setError(err.message || "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    fetchStatistics();
    fetchClients();
    fetchProjects();
  }, [fetchStatistics, fetchClients, fetchProjects]);

  const handleEditProject = async (project: Project) => {
    setIsLoading(true);
    try {
      const detail = await apiClient.getProject(project.id);
      setSelectedProject(mapBackendProjectDetailToFrontend(detail));
      setShowModal(true);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to load project details for editing.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    setIsSaving(true);
    try {
      const submitData: any = {
        name: projectData.name!,
        client: projectData.client_id!,
        description: projectData.description,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        status: projectData.status || "Planned",
      };

      if (selectedProject) {
        await apiClient.updateProject(selectedProject.id, submitData);
        showAlert("Success", "Project updated successfully!", "success");
      } else {
        await apiClient.createProject(submitData);
        showAlert("Success", "Project created successfully!", "success");
      }
      setShowModal(false);
      setSelectedProject(null);
      fetchProjects(); // Refresh list
      fetchStatistics(); // Refresh stats
    } catch (err: any) {
      console.error("Save failed:", err);
      showAlert("Save Failed", err.message || "An error occurred during save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this project");
    if (confirmed) {
      try {
        await apiClient.deleteProject(id);
        showAlert("Deleted!", "Project has been deleted.", "success");
        fetchProjects(); // Refresh list
        fetchStatistics(); // Refresh stats
      } catch (err: any) {
        console.error("Delete failed:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planned":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Progress":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "On Hold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Planned":
        return <Calendar className="h-4 w-4" />;
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      case "On Hold":
        return <Pause className="h-4 w-4" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4" />;
      case "Canceled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <DashboardLayout title="Projects" breadcrumbs={["Home", "Projects"]}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="ml-3 text-gray-500">Loading projects...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && projects.length === 0) {
    return (
      <DashboardLayout title="Projects" breadcrumbs={["Home", "Projects"]}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading projects: {error}</p>
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
    <DashboardLayout title="Projects" breadcrumbs={["Home", "Projects"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage project pipeline and track project status
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedProject(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.total_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-sky-100 p-3 dark:bg-sky-900/30">
                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Planned</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.planned_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.in_progress_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-sky-100 p-3 dark:bg-sky-900/30">
                <Clock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Hold</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.on_hold_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Pause className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.completed_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceled</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.canceled_projects ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="All">All Status</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No projects found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first project
            </p>
            <Button
              onClick={() => {
                setSelectedProject(null);
                setShowModal(true);
              }}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-1 text-xs rounded-full flex items-center gap-1",
                            getStatusColor(project.status)
                          )}
                        >
                          {getStatusIcon(project.status)}
                          {project.status}
                        </span>
                      </div>
                      {project.client_name && (
                        <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">
                          Client: {project.client_name}
                        </p>
                      )}
                      {project.tender_name && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                          Tender: {project.tender_name}
                        </p>
                      )}
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Start: {format(new Date(project.start_date), "dd MMM yyyy")}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          End: {format(new Date(project.end_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to Tasks page with project filter
                          router.push(`/tasks?project=${encodeURIComponent(project.name)}`);
                        }}
                        title="View Tasks"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={selectedProject}
          clients={clients}
          onClose={() => {
            setShowModal(false);
            setSelectedProject(null);
          }}
          onSave={handleSaveProject}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

function ProjectModal({
  project,
  clients,
  onClose,
  onSave,
  isSaving = false,
}: {
  project: Project | null;
  clients: BackendClientListItem[];
  onClose: () => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  isSaving?: boolean;
}) {
  const [name, setName] = useState(project?.name || "");
  const [clientId, setClientId] = useState<number>(project?.client_id || clients[0]?.id || 0);
  const [description, setDescription] = useState(project?.description || "");
  const [startDate, setStartDate] = useState(
    project?.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : ""
  );
  const [endDate, setEndDate] = useState(
    project?.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : ""
  );
  const [status, setStatus] = useState<
    "Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled"
  >(project?.status || "Planned");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setClientId(project.client_id || clients[0]?.id || 0);
      setDescription(project.description || "");
      setStartDate(project.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : "");
      setEndDate(project.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : "");
      setStatus(project.status || "Planned");
    } else {
      setName("");
      setClientId(clients[0]?.id || 0);
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus("Planned");
    }
    setErrors({});
  }, [project, clients]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!clientId) {
      newErrors.client = "Client is required";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const projectData: Partial<Project> = {
      name,
      client_id: clientId,
      description,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    try {
      await onSave(projectData);
      // Only close on success - error handling is done in parent
    } catch (error) {
      // Error handling is done in parent component
      console.error("Project submit error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project ? "Edit Project" : "Create Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              {clients.length === 0 ? (
                <option value={0}>Loading clients...</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || `${client.first_name} ${client.last_name}`}
                  </option>
                ))
              )}
            </select>
            {errors.client && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.client}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Network Infrastructure Setup"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                End Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {project ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {project ? "Update" : "Create"} Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <DashboardLayout title="Projects">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-500">Loading...</div>
            </div>
          </DashboardLayout>
        }
      >
        <ProjectsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

export default ProjectsPage;

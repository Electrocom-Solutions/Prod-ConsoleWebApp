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
  ChevronDown,
} from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";
import {
  apiClient,
  ProjectStatisticsResponse,
  BackendProjectListItem,
  BackendProjectDetail,
  BackendTenderListItem,
} from "@/lib/api";
import { showDeleteConfirm, showAlert } from "@/lib/sweetalert";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

type ProjectWithNames = Project & { tender_name?: string };

/**
 * Map backend project list item to frontend Project type
 */
function mapBackendProjectListItemToFrontend(backendProject: BackendProjectListItem): ProjectWithNames {
  return {
    id: backendProject.id,
    tender_id: backendProject.tender,
    name: backendProject.name,
    description: "", // Not in list item
    start_date: backendProject.start_date,
    end_date: backendProject.end_date,
    status: backendProject.status,
    created_at: backendProject.created_at,
    updated_at: backendProject.created_at, // Fallback
    tender_name: backendProject.tender_name,
  };
}

/**
 * Map backend project detail to frontend Project type
 */
function mapBackendProjectDetailToFrontend(backendProject: BackendProjectDetail): Project {
  return {
    id: backendProject.id,
    tender_id: backendProject.tender,
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
  const [tenders, setTenders] = useState<BackendTenderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Autocomplete states
  const [allProjectsForAutocomplete, setAllProjectsForAutocomplete] = useState<ProjectWithNames[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{
    type: 'project' | 'tender';
    name: string;
    tenderName?: string;
    projectId?: number;
  }>>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

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

  // Fetch tenders for dropdown
  const fetchTenders = useCallback(async () => {
    try {
      const response = await apiClient.getTenders();
      setTenders(response.results);
    } catch (err: any) {
      console.error("Failed to fetch tenders:", err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch all projects for autocomplete (fetch multiple pages)
  const fetchAllProjectsForAutocomplete = useCallback(async () => {
    try {
      // Fetch first 5 pages (100 projects) for autocomplete suggestions
      const allProjects: ProjectWithNames[] = [];
      for (let page = 1; page <= 5; page++) {
        const response = await apiClient.getProjects({ page });
        const pageProjects = response.results.map(mapBackendProjectListItemToFrontend);
        allProjects.push(...pageProjects);
        // If we got fewer than 20 results, we've reached the last page
        if (response.results.length < 20) break;
      }
      setAllProjectsForAutocomplete(allProjects);
    } catch (err: any) {
      console.error("Failed to fetch projects for autocomplete:", err);
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

  // Generate autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestions: Array<{
      type: 'project' | 'tender';
      name: string;
      tenderName?: string;
      projectId?: number;
    }> = [];

    // Add project name suggestions
    allProjectsForAutocomplete.forEach((project) => {
      if (project.name.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'project',
          name: project.name,
          tenderName: project.tender_name,
          projectId: project.id,
        });
      }
    });

    // Add tender name suggestions (unique tenders)
    const uniqueTenders = new Set<string>();
    allProjectsForAutocomplete.forEach((project) => {
      if (project.tender_name && project.tender_name.toLowerCase().includes(query)) {
        if (!uniqueTenders.has(project.tender_name)) {
          uniqueTenders.add(project.tender_name);
          suggestions.push({
            type: 'tender',
            name: project.tender_name,
          });
        }
      }
    });

    // Limit to 10 suggestions
    setAutocompleteSuggestions(suggestions.slice(0, 10));
    setShowAutocomplete(suggestions.length > 0);
    setSelectedSuggestionIndex(-1); // Reset selection when suggestions change
  }, [searchQuery, allProjectsForAutocomplete]);

  // Close filter dropdowns and autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-filter-dropdown-container')) {
        setShowStatusDropdown(false);
      }
      if (!target.closest('.autocomplete-search-container')) {
        setShowAutocomplete(false);
      }
    };

    if (showStatusDropdown || showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown, showAutocomplete]);

  const statusFilterOptions = ['All', 'Planned', 'In Progress', 'On Hold', 'Completed', 'Canceled'];

  useEffect(() => {
    fetchStatistics();
    fetchTenders();
    fetchAllProjectsForAutocomplete();
    fetchProjects();
  }, [fetchStatistics, fetchTenders, fetchAllProjectsForAutocomplete, fetchProjects]);

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
        tender: projectData.tender_id!,
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
      fetchAllProjectsForAutocomplete(); // Refresh autocomplete data
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
        fetchAllProjectsForAutocomplete(); // Refresh autocomplete data
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
          <div className="relative flex-1 max-w-md autocomplete-search-container">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
            <Input
              type="search"
              placeholder="Search by project name or tender name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAutocomplete(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (searchQuery && autocompleteSuggestions.length > 0) {
                  setShowAutocomplete(true);
                }
              }}
              onKeyDown={(e) => {
                if (!showAutocomplete || autocompleteSuggestions.length === 0) return;
                
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) => 
                    prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                  e.preventDefault();
                  const suggestion = autocompleteSuggestions[selectedSuggestionIndex];
                  setSearchQuery(suggestion.name);
                  setShowAutocomplete(false);
                } else if (e.key === 'Escape') {
                  setShowAutocomplete(false);
                  setSelectedSuggestionIndex(-1);
                }
              }}
              className="pl-9"
            />
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {autocompleteSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.name}-${index}`}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion.name);
                      setShowAutocomplete(false);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    className={`w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                      selectedSuggestionIndex === index
                        ? 'bg-sky-100 dark:bg-sky-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {suggestion.type === 'project' ? (
                        <>
                          <FileText className="h-4 w-4 text-sky-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{suggestion.name}</div>
                            {suggestion.tenderName && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Tender: {suggestion.tenderName}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <Inbox className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{suggestion.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Tender - Click to see all projects
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative status-filter-dropdown-container">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex items-center justify-between min-w-[140px]"
            >
              <span>{statusFilter === "All" ? "All Status" : statusFilter}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {statusFilterOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {status === "All" ? "All Status" : status}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          tenders={tenders}
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
  tenders,
  onClose,
  onSave,
  isSaving = false,
}: {
  project: Project | null;
  tenders: BackendTenderListItem[];
  onClose: () => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  isSaving?: boolean;
}) {
  const [name, setName] = useState(project?.name || "");
  const [tenderId, setTenderId] = useState<number>(project?.tender_id || tenders[0]?.id || 0);
  const [description, setDescription] = useState(project?.description || "");
  const [startDate, setStartDate] = useState<string | undefined>(
    project?.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : undefined
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    project?.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : undefined
  );
  const [status, setStatus] = useState<
    "Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled"
  >(project?.status || "Planned");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tenderSearch, setTenderSearch] = useState("");
  const [showTenderDropdown, setShowTenderDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tender-dropdown-container')) {
        setShowTenderDropdown(false);
      }
      if (!target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    if (showTenderDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTenderDropdown, showStatusDropdown]);

  // Filter tenders based on search
  const filteredTenders = tenders.filter((tender) => {
    const searchTerm = tenderSearch.toLowerCase();
    return (
      tender.name.toLowerCase().includes(searchTerm) ||
      tender.reference_number?.toLowerCase().includes(searchTerm) ||
      ''
    );
  });

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setTenderId(project.tender_id || tenders[0]?.id || 0);
      setDescription(project.description || "");
      setStartDate(project.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : undefined);
      setEndDate(project.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : undefined);
      setStatus(project.status || "Planned");
      // Set tender search to tender name when editing
      const selectedTender = tenders.find(t => t.id === project.tender_id);
      setTenderSearch(selectedTender ? selectedTender.name : "");
    } else {
      setName("");
      setTenderId(tenders[0]?.id || 0);
      setDescription("");
      setStartDate(undefined);
      setEndDate(undefined);
      setStatus("Planned");
      setTenderSearch("");
    }
    setErrors({});
    // Close dropdowns when modal opens/closes
    setShowTenderDropdown(false);
    setShowStatusDropdown(false);
  }, [project, tenders]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!tenderId) {
      newErrors.tender = "Tender is required";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = "End date must be after or equal to start date";
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
      tender_id: tenderId,
      description,
      start_date: startDate || "",
      end_date: endDate || "",
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
              Tender <span className="text-red-500">*</span>
            </label>
            <div className="relative tender-dropdown-container">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Search className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={tenderSearch || (tenderId ? tenders.find(t => t.id === tenderId)?.name || '' : '')}
                    onChange={(e) => {
                      setTenderSearch(e.target.value);
                      setShowTenderDropdown(true);
                      if (!e.target.value) {
                        setTenderId(0);
                      }
                    }}
                    onFocus={() => {
                      if (tenders.length > 0) {
                        setShowTenderDropdown(true);
                      }
                    }}
                    placeholder="Search tender by name or reference number"
                    className={`flex-1 rounded-md border ${
                      errors.tender ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } bg-white dark:bg-gray-800 px-10 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500`}
              required
                  />
                  {tenderId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTenderId(0);
                        setTenderSearch("");
                        setShowTenderDropdown(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      title="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showTenderDropdown && filteredTenders.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredTenders.map((tender) => (
                      <button
                        key={tender.id}
                        type="button"
                        onClick={() => {
                          setTenderId(tender.id);
                          setTenderSearch(tender.name);
                          setShowTenderDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium">{tender.name}</div>
                        {tender.reference_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Ref: {tender.reference_number}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showTenderDropdown && filteredTenders.length === 0 && tenderSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    No tenders found
                  </div>
                )}
                {showTenderDropdown && tenders.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    Loading tenders...
                  </div>
                )}
              </div>
            </div>
            {errors.tender && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tender}</p>
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
              <DatePicker
                value={startDate}
                onChange={(value) => setStartDate(value)}
                placeholder="Select start date"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                End Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={endDate}
                onChange={(value) => setEndDate(value)}
                placeholder="Select end date"
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
            <div className="relative status-dropdown-container">
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 flex items-center justify-between"
              >
                <span>{status}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {['Planned', 'In Progress', 'On Hold', 'Completed', 'Canceled'].map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => {
                        setStatus(statusOption as any);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

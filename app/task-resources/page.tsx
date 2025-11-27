"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Package, IndianRupee, AlertCircle, Loader2, Inbox } from "lucide-react";
import { apiClient, TaskResourcesStatisticsResponse, BackendTaskResourceListItem, TaskResourcesListResponse, BackendTaskResourceBreakdown } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { showError } from "@/lib/sweetalert";

type TaskResourceSummary = {
  task_id: number;
  deadline: string | null;
  employee_name: string;
  tender_name: string;
  project_name: string;
  total_resources: number;
  total_cost: number;
  resources: {
    name: string;
    quantity: number;
    unit_cost: number;
    total: number;
  }[];
};

/**
 * Map backend task resource list item to frontend TaskResourceSummary type
 */
function mapBackendTaskResourceToFrontend(backendTask: BackendTaskResourceListItem): TaskResourceSummary {
  return {
    task_id: backendTask.id,
    deadline: backendTask.deadline,
    employee_name: backendTask.employee_name || 'N/A',
    tender_name: backendTask.tender_name || 'N/A',
    project_name: backendTask.project_name || 'N/A',
    total_resources: backendTask.resources_count,
    total_cost: backendTask.grand_total,
    resources: backendTask.resource_breakdown.map((resource: BackendTaskResourceBreakdown) => ({
      name: resource.resource_name,
      quantity: parseFloat(resource.quantity) || 0,
      unit_cost: parseFloat(resource.unit_cost) || 0,
      total: parseFloat(resource.total_cost) || 0,
    })),
  };
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function TaskResourcesPageContent() {
  const searchParams = useSearchParams();
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [taskResources, setTaskResources] = useState<TaskResourceSummary[]>([]);
  const [statistics, setStatistics] = useState<TaskResourcesStatisticsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const years = useMemo(() => {
    const startYear = 2020;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  /**
   * Fetch statistics from backend
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedMonth && selectedYear) {
        params.month = selectedMonth;
        params.year = selectedYear;
      }
      const stats = await apiClient.getTaskResourcesStatistics(params);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching task resources statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, [selectedMonth, selectedYear]);

  /**
   * Fetch task resources from backend
   */
  const fetchTaskResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      if (selectedMonth && selectedYear) {
        params.month = selectedMonth;
        params.year = selectedYear;
      }

      const response: TaskResourcesListResponse = await apiClient.getTaskResources(params);
      const mappedResources = response.results.map(mapBackendTaskResourceToFrontend);
      setTaskResources(mappedResources);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching task resources:', err);
      setError(err.message || 'Failed to fetch task resources');
      setTaskResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedMonth, selectedYear, currentPage]);

  // Fetch statistics and task resources on mount and when filters change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchTaskResources();
  }, [fetchTaskResources]);

  const handleGenerateReport = () => {
    if (taskResources.length === 0) {
      showError("No Data", "No task resources to export");
      return;
    }

    const csvContent = [
      ["Task ID", "Date", "Employee", "Tender", "Project", "Resources Used", "Total Cost"].join(","),
      ...taskResources.map(task => [
        task.task_id,
        task.deadline || 'No deadline',
        task.employee_name,
        task.tender_name,
        task.project_name,
        task.total_resources,
        task.total_cost
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `task-resources-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Task Resources" breadcrumbs={["Home", "Inventory", "Task Resources"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Task Resource Consumption</h2>
            <p className="text-gray-500 dark:text-gray-400">Track resource usage per task for cost analysis</p>
          </div>
          <Button onClick={handleGenerateReport} disabled={taskResources.length === 0}>
            <Package className="h-4 w-4 mr-2" />
            Resource Report
          </Button>
        </div>

        {/* Statistics Tiles */}
        {statistics && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</div>
                  <div className="text-2xl font-bold mt-1">{statistics.total_tasks}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-sky-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Resources Used</div>
                  <div className="text-2xl font-bold mt-1">{statistics.total_resources}</div>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                  <div className="text-2xl font-bold mt-1">
                    ₹{statistics.total_cost.toLocaleString("en-IN")}
                  </div>
                </div>
                <IndianRupee className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Avg Cost/Task</div>
                  <div className="text-2xl font-bold mt-1">
                    ₹{statistics.avg_cost_per_task.toLocaleString("en-IN")}
                  </div>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedMonth(value === '' ? null : Number(value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Months</option>
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedYear(value === '' ? null : Number(value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by employee, tender, project, or task name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading task resources...</span>
          </div>
        ) : taskResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Inbox className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No task resources found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {taskResources.map((task) => {
                const isExpanded = expandedTask === task.task_id;

                return (
                  <div
                    key={task.task_id}
                    className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Task #{task.task_id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                            </div>
                          </div>
                          <div className="mt-1 font-semibold">{task.employee_name}</div>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {task.tender_name} • {task.project_name}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Resources Used</div>
                            <div className="text-lg font-semibold">{task.total_resources}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                            <div className="text-lg font-semibold text-sky-600">
                              ₹{task.total_cost.toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-4">
                        <h4 className="font-semibold mb-3">Resource Breakdown</h4>
                        <table className="min-w-full">
                          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                            <tr>
                              <th className="text-left pb-2">Resource Name</th>
                              <th className="text-right pb-2">Quantity</th>
                              <th className="text-right pb-2">Unit Cost</th>
                              <th className="text-right pb-2">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {task.resources.map((resource, idx) => (
                              <tr key={idx} className="border-t dark:border-gray-700">
                                <td className="py-2">{resource.name}</td>
                                <td className="py-2 text-right">{resource.quantity}</td>
                                <td className="py-2 text-right">₹{resource.unit_cost.toLocaleString("en-IN")}</td>
                                <td className="py-2 text-right font-medium">₹{resource.total.toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 dark:border-gray-600 font-semibold">
                              <td className="py-2" colSpan={3}>Total</td>
                              <td className="py-2 text-right text-sky-600">
                                ₹{task.total_cost.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {taskResources.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TaskResourcesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Task Resources"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <TaskResourcesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

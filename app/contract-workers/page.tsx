"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { Plus, Search, Upload, Edit, Trash2, X, User, Phone, MapPin, Mail, Loader2, Inbox, FileText, Download, ChevronDown, Eye } from "lucide-react";
import { showDeleteConfirm, showAlert, showSuccess } from "@/lib/sweetalert";
import { apiClient, ContractWorkerStatisticsResponse, BackendContractWorkerListItem, ContractWorkerDetail, ContractWorkerCreateData, BulkUploadContractWorkerResponse, BackendProjectListItem } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

type ContractWorker = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "Male" | "Female";
  father_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  worker_type: "Unskilled" | "Semi-Skilled" | "Skilled";
  monthly_salary: number;
  aadhar_number: string;
  uan_number: string;
  esi: string;
  department: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  status: "Available" | "Assigned" | "Inactive";
  created_at: string;
  // Legacy fields for backward compatibility
  name?: string;
  worker_id?: string;
  designation?: string;
  project_id?: number;
  project_name?: string;
  availability_status?: string | null;
};

/**
 * Map backend contract worker list item to frontend ContractWorker type
 */
function mapBackendContractWorkerListItemToFrontend(backendWorker: BackendContractWorkerListItem): ContractWorker {
  const nameParts = backendWorker.full_name?.split(' ') || [];
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || '';

  return {
    id: backendWorker.id,
    first_name,
    last_name,
    email: backendWorker.email || '',
    phone: backendWorker.phone_number || '',
    date_of_birth: '',
    gender: "Male",
    father_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    worker_type: backendWorker.worker_type,
    monthly_salary: parseFloat(backendWorker.monthly_salary) || 0,
    aadhar_number: '',
    uan_number: '',
    esi: '',
    department: backendWorker.department || '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    status: backendWorker.availability_status === 'assigned' ? 'Assigned' : 'Available',
    created_at: backendWorker.created_at,
    name: backendWorker.full_name || '',
    worker_id: `CW-${backendWorker.id}`,
    designation: backendWorker.worker_type,
    project_id: backendWorker.project || undefined,
    project_name: backendWorker.project_name || undefined,
    availability_status: backendWorker.availability_status,
  };
}

/**
 * Map backend contract worker detail to frontend ContractWorker type
 */
function mapBackendContractWorkerDetailToFrontend(backendWorker: ContractWorkerDetail): ContractWorker {
  const nameParts = backendWorker.full_name?.split(' ') || [];
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || '';

  return {
    id: backendWorker.id,
    first_name,
    last_name,
    email: backendWorker.email || '',
    phone: backendWorker.phone_number || '',
    date_of_birth: backendWorker.date_of_birth || '',
    gender: (backendWorker.gender === 'male' ? 'Male' : backendWorker.gender === 'female' ? 'Female' : 'Male') as "Male" | "Female",
    father_name: backendWorker.father_name || '',
    address: backendWorker.address || '',
    city: backendWorker.city || '',
    state: backendWorker.state || '',
    pincode: backendWorker.pin_code || '',
    country: backendWorker.country || 'India',
    worker_type: backendWorker.worker_type,
    monthly_salary: parseFloat(backendWorker.monthly_salary) || 0,
    aadhar_number: backendWorker.aadhar_no || '',
    uan_number: backendWorker.uan_number || '',
    esi: backendWorker.esi || '',
    department: backendWorker.department || '',
    bank_name: backendWorker.bank_account?.bank_name || '',
    bank_account_number: backendWorker.bank_account?.account_number || '',
    bank_ifsc: backendWorker.bank_account?.ifsc_code || '',
    status: backendWorker.project ? 'Assigned' : 'Available',
    created_at: backendWorker.created_at,
    name: backendWorker.full_name || '',
    worker_id: `CW-${backendWorker.id}`,
    designation: backendWorker.worker_type,
    project_id: backendWorker.project || undefined,
    project_name: backendWorker.project_name || undefined,
    availability_status: backendWorker.project ? 'assigned' : 'available',
  };
}

function ContractWorkersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [workers, setWorkers] = useState<ContractWorker[]>([]);
  const [statistics, setStatistics] = useState<ContractWorkerStatisticsResponse | null>(null);
  const [projects, setProjects] = useState<BackendProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [workerTypeFilter, setWorkerTypeFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [showWorkerTypeDropdown, setShowWorkerTypeDropdown] = useState(false);
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<ContractWorker | null>(null);
  const [viewWorkerDetail, setViewWorkerDetail] = useState<ContractWorkerDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getContractWorkerStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch contract worker statistics:", err);
      setError(err.message || "Failed to load statistics");
    }
  }, []);

  // Fetch projects for dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const response = await apiClient.getProjects();
      setProjects(response.results);
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
    }
  }, []);

  // Fetch contract workers
  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getContractWorkers({
        search: debouncedSearchQuery || undefined,
        worker_type: workerTypeFilter !== "all" ? workerTypeFilter : undefined,
        availability: availabilityFilter !== "all" ? (availabilityFilter as 'assigned' | 'available') : undefined,
        page: currentPage,
      });

      const mappedWorkers = response.results.map(mapBackendContractWorkerListItemToFrontend);
      setWorkers(mappedWorkers);
      
      // Calculate total pages
      const totalPages = Math.ceil(response.count / 20); // Assuming 20 items per page
      setTotalPages(totalPages);
    } catch (err: any) {
      console.error("Failed to fetch contract workers:", err);
      setError(err.message || "Failed to load contract workers");
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, workerTypeFilter, availabilityFilter, currentPage]);

  // Initial data fetch
  useEffect(() => {
    fetchStatistics();
    fetchProjects();
  }, [fetchStatistics, fetchProjects]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.worker-type-filter-dropdown-container')) {
        setShowWorkerTypeDropdown(false);
      }
      if (!target.closest('.availability-filter-dropdown-container')) {
        setShowAvailabilityDropdown(false);
      }
    };

    if (showWorkerTypeDropdown || showAvailabilityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWorkerTypeDropdown, showAvailabilityDropdown]);

  // Handle URL parameter for opening modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setSelectedWorker(null);
      setShowModal(true);
      // Clean up URL
      router.replace('/contract-workers', { scroll: false });
    }
  }, [searchParams, router]);

  // Handle create contract worker
  const handleCreateContractWorker = async (workerData: ContractWorkerCreateData) => {
    setIsSaving(true);
    try {
      await apiClient.createContractWorker(workerData);
      showSuccess("Contract worker created successfully!");
      setShowModal(false);
      setSelectedWorker(null);
      await fetchWorkers();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to create contract worker:", err);
      showAlert("Create Failed", err.message || "An error occurred during contract worker creation.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update contract worker
  const handleUpdateContractWorker = async (id: number, workerData: Partial<ContractWorkerCreateData>) => {
    setIsSaving(true);
    try {
      await apiClient.updateContractWorker(id, workerData);
      showSuccess("Contract worker updated successfully!");
      setShowModal(false);
      setSelectedWorker(null);
      await fetchWorkers();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to update contract worker:", err);
      showAlert("Update Failed", err.message || "An error occurred during contract worker update.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete contract worker
  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this worker");
    if (confirmed) {
      try {
        await apiClient.deleteContractWorker(id);
        showSuccess("Contract worker deleted successfully!");
        await fetchWorkers();
        await fetchStatistics();
      } catch (err: any) {
        console.error("Failed to delete contract worker:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  // Handle edit contract worker - fetch full details first
  const handleEdit = async (worker: ContractWorker) => {
    try {
      setIsLoading(true);
      const workerDetail = await apiClient.getContractWorker(worker.id);
      const mappedWorker = mapBackendContractWorkerDetailToFrontend(workerDetail);
      setSelectedWorker(mappedWorker);
      setShowModal(true);
    } catch (err: any) {
      console.error("Failed to fetch contract worker details:", err);
      showAlert("Error", err.message || "Failed to load contract worker details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view contract worker details
  const handleView = async (worker: ContractWorker) => {
    try {
      setIsLoading(true);
      const workerDetail = await apiClient.getContractWorker(worker.id);
      setViewWorkerDetail(workerDetail);
      setShowViewModal(true);
    } catch (err: any) {
      console.error("Failed to fetch contract worker details:", err);
      showAlert("Error", err.message || "Failed to load contract worker details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk import
  const handleBulkImport = async (file: File) => {
    setIsSaving(true);
    try {
      const response = await apiClient.bulkUploadContractWorkers(file);
      
      if (response.success_count > 0) {
        showSuccess(`${response.success_count} contract worker(s) imported successfully!`);
        await fetchWorkers();
        await fetchStatistics();
      }
      
      if (response.failed_count > 0 && response.errors && response.errors.length > 0) {
        const errorMessage = `Failed to import ${response.failed_count} worker(s). Errors:\n${response.errors.slice(0, 10).join('\n')}${response.errors.length > 10 ? `\n... and ${response.errors.length - 10} more errors` : ''}`;
        showAlert("Import Partially Successful", errorMessage, "warning");
      } else if (response.failed_count > 0) {
        showAlert("Import Partially Successful", `${response.success_count} imported, ${response.failed_count} failed.`, "warning");
      }
      
      setShowBulkImport(false);
    } catch (err: any) {
      console.error("Failed to bulk import contract workers:", err);
      showAlert("Import Failed", err.message || "An error occurred during bulk import.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Get unique worker types for filter
  const uniqueWorkerTypes = useMemo(() => {
    return ['all', 'Unskilled', 'Semi-Skilled', 'Skilled'];
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Assigned":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Inactive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Contract Workers" breadcrumbs={["Home", "People", "Contract Workers"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Contract Worker Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage contract workers and bulk imports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => {
              setSelectedWorker(null);
              setShowModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </div>
        </div>

        {/* Statistics Tiles */}
        {error && !statistics && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Workers</div>
            <div className="text-2xl font-bold mt-1">
              {statistics ? statistics.total_workers : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {statistics ? statistics.total_available : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Assigned</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {statistics ? statistics.total_assigned : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total of All Salaries</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">
              {statistics ? `₹${(statistics.total_monthly_payroll / 1000).toFixed(1)}K` : isLoading ? "..." : "₹0"}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative worker-type-filter-dropdown-container">
            <button
              type="button"
              onClick={() => {
                setShowWorkerTypeDropdown(!showWorkerTypeDropdown);
                setShowAvailabilityDropdown(false);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between min-w-[150px]"
            >
              <span>{workerTypeFilter === "all" ? "All Worker Types" : workerTypeFilter}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showWorkerTypeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {uniqueWorkerTypes.map(workerType => (
                  <button
                    key={workerType}
                    type="button"
                    onClick={() => {
                      setWorkerTypeFilter(workerType);
                      setShowWorkerTypeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {workerType === "all" ? "All Worker Types" : workerType}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative availability-filter-dropdown-container">
            <button
              type="button"
              onClick={() => {
                setShowAvailabilityDropdown(!showAvailabilityDropdown);
                setShowWorkerTypeDropdown(false);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between min-w-[130px]"
            >
              <span>
                {availabilityFilter === "all" ? "All Status" : availabilityFilter === "available" ? "Available" : "Assigned"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showAvailabilityDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setAvailabilityFilter("all");
                    setShowAvailabilityDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvailabilityFilter("available");
                    setShowAvailabilityDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvailabilityFilter("assigned");
                    setShowAvailabilityDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Assigned
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contract Workers Table */}
        {isLoading && workers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : error && workers.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load contract workers
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button
              onClick={() => fetchWorkers()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : workers.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No contract workers found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first contract worker or bulk importing workers
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                onClick={() => setShowBulkImport(true)}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button
                onClick={() => {
                  setSelectedWorker(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Monthly Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                          <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <div className="font-medium">{worker.name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim()}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{worker.worker_id || `CW-${worker.id}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {worker.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{worker.email}</span>
                        </div>
                      )}
                      {worker.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          {worker.phone}
                        </div>
                      )}
                      {(worker.address || worker.city) && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{worker.address || `${worker.city || ''}, ${worker.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{worker.worker_type || worker.designation || '-'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium dark:text-gray-200">
                      ₹{worker.monthly_salary.toLocaleString('en-IN')}/mo
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {worker.project_name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(worker.status)}>
                        {worker.availability_status === 'assigned' ? 'Assigned' : worker.availability_status === 'available' ? 'Available' : worker.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(worker)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(worker)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(worker.id)}
                          className="text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <WorkerModal
          worker={selectedWorker}
          projects={projects}
          onClose={() => {
            setShowModal(false);
            setSelectedWorker(null);
          }}
          onSave={async (workerData) => {
            if (selectedWorker) {
              await handleUpdateContractWorker(selectedWorker.id, workerData);
            } else {
              await handleCreateContractWorker(workerData);
            }
          }}
          isSaving={isSaving}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImport={handleBulkImport}
          isUploading={isSaving}
        />
      )}

      {showViewModal && viewWorkerDetail && (
        <ViewDetailsModal
          workerDetail={viewWorkerDetail}
          onClose={() => {
            setShowViewModal(false);
            setViewWorkerDetail(null);
          }}
          onEdit={async () => {
            setShowViewModal(false);
            const mappedWorker = mapBackendContractWorkerDetailToFrontend(viewWorkerDetail);
            setSelectedWorker(mappedWorker);
            setShowModal(true);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function ViewDetailsModal({ workerDetail, onClose, onEdit }: {
  workerDetail: ContractWorkerDetail | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!workerDetail) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Contract Worker Details
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.full_name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Father Name</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.father_name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{formatDate(workerDetail.date_of_birth)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                <p className="text-base text-gray-900 dark:text-white mt-1 capitalize">{workerDetail.gender || "-"}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.email || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.phone_number || "-"}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.address || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.city || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.state || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Pincode</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.pin_code || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.country || "-"}</p>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Worker Type</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.worker_type || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.department || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Salary</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">₹{parseFloat(workerDetail.monthly_salary || "0").toLocaleString('en-IN')}/mo</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.project_name || "Not Assigned"}</p>
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Identity Documents</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Number</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.aadhar_no || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">UAN Number</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.uan_number || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ESI Number</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.esi || "-"}</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {workerDetail.bank_account && (
            <div className="space-y-4">
              <div className="border-b dark:border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Name</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.bank_account.bank_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.bank_account.account_number || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IFSC Code</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{workerDetail.bank_account.ifsc_code || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4 pt-4 border-t dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{formatDate(workerDetail.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{formatDate(workerDetail.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Worker
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ContractWorkersPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <DashboardLayout title="Contract Workers" breadcrumbs={["Home", "People", "Contract Workers"]}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        </DashboardLayout>
      }>
        <ContractWorkersPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function WorkerModal({ worker, projects, onClose, onSave, isSaving }: {
  worker: ContractWorker | null;
  projects: BackendProjectListItem[];
  onClose: () => void;
  onSave: (data: ContractWorkerCreateData) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    first_name: worker?.first_name || worker?.name?.split(' ')[0] || "",
    last_name: worker?.last_name || worker?.name?.split(' ').slice(1).join(' ') || "",
    father_name: worker?.father_name || "",
    email: worker?.email || "",
    phone: worker?.phone || "",
    date_of_birth: worker?.date_of_birth || "",
    gender: (worker?.gender || "Male") as "Male" | "Female",
    address: worker?.address || "",
    city: worker?.city || "",
    state: worker?.state || "",
    pincode: worker?.pincode || "",
    country: worker?.country || "India",
    worker_type: (worker?.worker_type || "Semi-Skilled") as "Unskilled" | "Semi-Skilled" | "Skilled",
    monthly_salary: worker?.monthly_salary?.toString() || "",
    aadhar_number: worker?.aadhar_number || "",
    uan_number: worker?.uan_number || "",
    esi: worker?.esi || "",
    department: worker?.department || "",
    project: worker?.project_id?.toString() || "",
    project_search: worker?.project_name || "",
    bank_name: worker?.bank_name || "",
    bank_account_number: worker?.bank_account_number || "",
    bank_ifsc: worker?.bank_ifsc || "",
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Update form data when worker changes (for editing)
  useEffect(() => {
    if (worker) {
      setFormData({
        first_name: worker.first_name || worker.name?.split(' ')[0] || "",
        last_name: worker.last_name || worker.name?.split(' ').slice(1).join(' ') || "",
        father_name: worker.father_name || "",
        email: worker.email || "",
        phone: worker.phone || "",
        date_of_birth: worker.date_of_birth || "",
        gender: (worker.gender || "Male") as "Male" | "Female",
        address: worker.address || "",
        city: worker.city || "",
        state: worker.state || "",
        pincode: worker.pincode || "",
        country: worker.country || "India",
        worker_type: (worker.worker_type || "Semi-Skilled") as "Unskilled" | "Semi-Skilled" | "Skilled",
        monthly_salary: worker.monthly_salary?.toString() || "",
        aadhar_number: worker.aadhar_number || "",
        uan_number: worker.uan_number || "",
        esi: worker.esi || "",
        department: worker.department || "",
        project: worker.project_id?.toString() || "",
        project_search: worker.project_name || "",
        bank_name: worker.bank_name || "",
        bank_account_number: worker.bank_account_number || "",
        bank_ifsc: worker.bank_ifsc || "",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        father_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "Male" as "Male" | "Female",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        worker_type: "Semi-Skilled" as "Unskilled" | "Semi-Skilled" | "Skilled",
        monthly_salary: "",
        aadhar_number: "",
        uan_number: "",
        esi: "",
        department: "",
        project: "",
        project_search: "",
        bank_name: "",
        bank_account_number: "",
        bank_ifsc: "",
      });
    }
  }, [worker]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchTerm = formData.project_search.toLowerCase();
      if (!searchTerm) return true;
      const projectName = project.name?.toLowerCase() || "";
      return projectName.includes(searchTerm);
    });
  }, [projects, formData.project_search]);

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

  const handleProjectSelect = (project: BackendProjectListItem) => {
    setFormData({
      ...formData,
      project: project.id.toString(),
      project_search: project.name,
    });
    setShowProjectDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare worker data for API
    // For updates, send empty strings for optional fields to ensure they are cleared if needed
    const workerData: ContractWorkerCreateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      father_name: formData.father_name || undefined,
      email: formData.email,
      worker_type: formData.worker_type,
      monthly_salary: parseFloat(formData.monthly_salary) || 0,
      aadhar_no: formData.aadhar_number,
      phone_number: formData.phone || (worker ? "" : undefined),
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender === "Male" ? "male" : "female",
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pin_code: formData.pincode || undefined,
      country: formData.country || undefined,
      uan_number: formData.uan_number || undefined,
      esi: formData.esi || undefined,
      department: formData.department || undefined,
      project: formData.project ? parseInt(formData.project) : undefined,
      bank_name: formData.bank_name || (worker ? "" : undefined),
      bank_account_number: formData.bank_account_number || (worker ? "" : undefined),
      ifsc_code: formData.bank_ifsc || (worker ? "" : undefined),
    };

    await onSave(workerData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {worker ? "Edit Contract Worker" : "Add Contract Worker"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Basic details about the contract worker</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Father Name
                </label>
                <Input
                  value={formData.father_name}
                  onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  placeholder="Enter father name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Date of Birth
                </label>
                <DatePicker
                  value={formData.date_of_birth || undefined}
                  onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                  placeholder="Select date of birth"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email, phone, and address information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="Enter full address"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Pincode
                </label>
                <Input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Enter pincode"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Country
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Work Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employment and designation information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Worker Type <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.worker_type}
                  onChange={(value) => setFormData({ ...formData, worker_type: value as "Unskilled" | "Semi-Skilled" | "Skilled" })}
                  options={[
                    { value: "Unskilled", label: "Unskilled" },
                    { value: "Semi-Skilled", label: "Semi-Skilled" },
                    { value: "Skilled", label: "Skilled" },
                  ]}
                  placeholder="Select worker type"
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Department
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Monthly Salary (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                  required
                  placeholder="Enter monthly salary"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Project (Optional)
                </label>
                <div className="relative project-dropdown-container">
                  <input
                    type="text"
                    value={formData.project_search}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        project_search: e.target.value,
                        project: "",
                      });
                      setShowProjectDropdown(true);
                    }}
                    onFocus={() => {
                      if (projects.length > 0) {
                        setShowProjectDropdown(true);
                      }
                    }}
                    placeholder="Search project by name"
                    disabled={isSaving}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {showProjectDropdown && filteredProjects.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            project: "",
                            project_search: "",
                          });
                          setShowProjectDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium">None (Available)</div>
                      </button>
                      {filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="font-medium">{project.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showProjectDropdown && filteredProjects.length === 0 && formData.project_search && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                      No projects found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Documents Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Identity Documents</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Official identification documents</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Aadhar Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  required
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  UAN Number
                </label>
                <Input
                  type="text"
                  value={formData.uan_number}
                  onChange={(e) => setFormData({ ...formData, uan_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="Enter UAN number"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  ESI Number
                </label>
                <Input
                  type="text"
                  value={formData.esi}
                  onChange={(e) => setFormData({ ...formData, esi: e.target.value })}
                  placeholder="Enter ESI number"
                />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Banking and account information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Bank Name
                </label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Bank Account Number
                </label>
                <Input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  IFSC Code
                </label>
                <Input
                  type="text"
                  value={formData.bank_ifsc}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                  placeholder="Enter IFSC code"
                  maxLength={11}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {worker ? "Updating..." : "Creating..."}
                </>
              ) : (
                worker ? "Update" : "Add"
              )} Worker
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onImport, isUploading }: {
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isUploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validExtensions = ['.xlsx', '.xls'];
      const fileName = selectedFile.name.toLowerCase();
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidFile) {
        setFileError('Please upload an Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      
      setFileError(null);
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setFileError('Please select a file to upload');
      return;
    }

    await onImport(file);
    setFile(null);
    setFileError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bulk Import Workers</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Upload Excel File (.xlsx or .xls) <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const blob = await apiClient.downloadContractWorkerTemplate();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'contract_workers_template.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err: any) {
                    console.error("Failed to download template:", err);
                    showAlert("Download Failed", err.message || "An error occurred while downloading the template.", "error");
                  }
                }}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400 disabled:opacity-50"
            />
            {fileError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{fileError}</p>
            )}
            {file && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {file.name}
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Excel File Format:</h4>
            <p className="text-xs text-blue-800 dark:text-blue-400 mb-2">
              The Excel file must contain the following columns (case-insensitive):
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-400 list-disc list-inside space-y-1">
              <li>Sr. No. (optional)</li>
              <li>First Name (required)</li>
              <li>Last Name (required)</li>
              <li>Father Name (optional)</li>
              <li>Email (required)</li>
              <li>Phone Number (optional)</li>
              <li>Date Of Birth (dd/mm/yy) (optional)</li>
              <li>Gender (male/female) (optional)</li>
              <li>Address, City, State, Pincode, Country (optional)</li>
              <li>Worker Type (unskilled, semiskilled, skilled) (required)</li>
              <li>Salary (required)</li>
              <li>Aadhar Number (required)</li>
              <li>UAN Number (optional)</li>
              <li>ESI (optional)</li>
              <li>Department (optional)</li>
              <li>Bank Name, Account Number, IFSC Code (optional)</li>
              <li>Project (optional)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Workers
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

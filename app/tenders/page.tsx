"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  FileText,
  Calendar,
  IndianRupee,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { Tender, TenderFinancials } from "@/types";
import TenderFormModal from "@/components/tenders/tender-form-modal";
import {
  apiClient,
  TenderStatisticsResponse,
  BackendTenderListItem,
  BackendTenderDetail,
} from "@/lib/api";
import { showDeleteConfirm, showConfirm, showAlert } from "@/lib/sweetalert";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { format } from "date-fns";

/**
 * Map backend tender list item to frontend Tender type
 */
function mapBackendTenderListItemToFrontend(backendTender: BackendTenderListItem): Tender {
  return {
    id: backendTender.id,
    name: backendTender.name,
    reference_number: backendTender.reference_number,
    description: "", // Not in list item
    filed_date: backendTender.filed_date,
    start_date: backendTender.start_date,
    end_date: backendTender.end_date,
    estimated_value: parseFloat(backendTender.estimated_value),
    status: backendTender.status,
    created_at: backendTender.created_at,
    updated_at: backendTender.created_at, // Fallback
  };
}

/**
 * Map backend tender detail to frontend Tender type
 */
function mapBackendTenderDetailToFrontend(backendTender: BackendTenderDetail): Tender {
  return {
    id: backendTender.id,
    name: backendTender.name,
    reference_number: backendTender.reference_number,
    description: backendTender.description || "",
    filed_date: backendTender.filed_date,
    start_date: backendTender.start_date,
    end_date: backendTender.end_date,
    estimated_value: parseFloat(backendTender.estimated_value),
    status: backendTender.status === "Filed" ? "Filed" : backendTender.status === "Awarded" ? "Awarded" : backendTender.status === "Lost" ? "Lost" : "Closed",
    created_at: backendTender.created_at,
    updated_at: backendTender.updated_at,
  };
}

/**
 * Map backend tender detail to frontend TenderFinancials type
 */
function mapBackendTenderDetailToFinancials(backendTender: BackendTenderDetail): TenderFinancials {
  const sd1Deposit = backendTender.deposits.find((d) => d.deposit_type === "EMD_Security1");
  const sd2Deposit = backendTender.deposits.find((d) => d.deposit_type === "EMD_Security2");

  return {
    id: backendTender.id,
    tender_id: backendTender.id,
    emd_amount: backendTender.total_emd_cost,
    emd_refundable: backendTender.status !== "Awarded",
    emd_refund_date: undefined, // Not in backend
    emd_collected: false, // Not in backend
    emd_collection_date: undefined, // Not in backend
    sd1_amount: backendTender.security_deposit_1,
    sd1_refundable: sd1Deposit?.is_refunded || false,
    sd1_refund_date: sd1Deposit?.refund_date,
    sd2_amount: backendTender.security_deposit_2,
    sd2_refundable: sd2Deposit?.is_refunded || false,
    sd2_refund_date: sd2Deposit?.refund_date,
    dd_date: sd1Deposit?.dd_date || sd2Deposit?.dd_date,
    dd_number: sd1Deposit?.dd_number || sd2Deposit?.dd_number,
    dd_amount: sd1Deposit ? parseFloat(sd1Deposit.dd_amount) : sd2Deposit ? parseFloat(sd2Deposit.dd_amount) : undefined,
    dd_beneficiary_name: sd1Deposit?.dd_beneficiary_name || sd2Deposit?.dd_beneficiary_name,
    dd_bank_name: sd1Deposit?.bank_name || sd2Deposit?.bank_name,
  };
}

function TendersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [statistics, setStatistics] = useState<TenderStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [emdFilter, setEmdFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedTenderFinancials, setSelectedTenderFinancials] = useState<TenderFinancials | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getTenderStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch tender statistics:", err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch tenders
  const fetchTenders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: {
        search?: string;
        status?: "Draft" | "Filed" | "Awarded" | "Lost" | "Closed";
        pending_emds?: boolean;
        page?: number;
      } = { page: currentPage };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== "All") {
        params.status = statusFilter as "Draft" | "Filed" | "Awarded" | "Lost" | "Closed";
      }
      if (emdFilter) params.pending_emds = true;

      const response = await apiClient.getTenders(params);
      setTenders(response.results.map(mapBackendTenderListItemToFrontend));
      setTotalPages(Math.ceil(response.count / 20)); // Assuming 20 items per page
    } catch (err: any) {
      console.error("Failed to fetch tenders:", err);
      setError(err.message || "Failed to load tenders.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, emdFilter]);

  useEffect(() => {
    fetchStatistics();
    fetchTenders();
  }, [fetchStatistics, fetchTenders]);

  // Handle URL parameters for quick actions (e.g., from dashboard)
  const handleNewTender = useCallback(() => {
    setSelectedTender(null);
    setSelectedTenderFinancials(null);
    setIsTenderModalOpen(true);
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    const editId = searchParams.get("edit");
    
    if (action === "new") {
      handleNewTender();
      router.replace("/tenders"); // Clear the query parameter
    } else if (editId) {
      const tenderId = parseInt(editId, 10);
      const tender = tenders.find((t) => t.id === tenderId);
      if (tender) {
        handleEditTender(tender);
      } else {
        // Tender not in current list, fetch it
        apiClient.getTender(tenderId)
          .then((detail) => {
            const frontendTender = mapBackendTenderDetailToFrontend(detail);
            const frontendFinancials = mapBackendTenderDetailToFinancials(detail);
            setSelectedTender(frontendTender);
            setSelectedTenderFinancials(frontendFinancials);
            setIsTenderModalOpen(true);
          })
          .catch((err) => {
            console.error("Failed to fetch tender for editing:", err);
            showAlert("Error", "Failed to load tender for editing.", "error");
          });
      }
      router.replace("/tenders"); // Clear the query parameter
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tenders]);

  const handleEditTender = async (tender: Tender) => {
    setIsLoading(true);
    try {
      const detail = await apiClient.getTender(tender.id);
      setSelectedTender(mapBackendTenderDetailToFrontend(detail));
      setSelectedTenderFinancials(mapBackendTenderDetailToFinancials(detail));
      setIsTenderModalOpen(true);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to load tender details for editing.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenderSubmit = async (
    tenderData: Omit<Tender, "id" | "created_at" | "updated_at">,
    financialsData?: Partial<TenderFinancials>
  ) => {
    setIsSaving(true);
    try {
      const submitData: any = {
        name: tenderData.name,
        reference_number: tenderData.reference_number,
        description: tenderData.description,
        filed_date: tenderData.filed_date,
        start_date: tenderData.start_date,
        end_date: tenderData.end_date,
        estimated_value: tenderData.estimated_value,
        status: tenderData.status,
      };

      // Add security deposit data if provided
      if (financialsData) {
        if (financialsData.sd1_amount && financialsData.dd_date && financialsData.dd_number) {
          submitData.security_deposit_1_dd_date = financialsData.dd_date;
          submitData.security_deposit_1_dd_number = financialsData.dd_number;
          submitData.security_deposit_1_dd_amount = financialsData.sd1_amount;
          submitData.security_deposit_1_dd_bank_name = financialsData.dd_bank_name;
          submitData.security_deposit_1_dd_beneficiary_name = financialsData.dd_beneficiary_name;
        }
        if (financialsData.sd2_amount && financialsData.dd_date && financialsData.dd_number) {
          submitData.security_deposit_2_dd_date = financialsData.dd_date;
          submitData.security_deposit_2_dd_number = financialsData.dd_number;
          submitData.security_deposit_2_dd_amount = financialsData.sd2_amount;
          submitData.security_deposit_2_dd_bank_name = financialsData.dd_bank_name;
          submitData.security_deposit_2_dd_beneficiary_name = financialsData.dd_beneficiary_name;
        }
      }

      if (selectedTender) {
        await apiClient.updateTender(selectedTender.id, submitData);
        showAlert("Success", "Tender updated successfully!", "success");
      } else {
        await apiClient.createTender(submitData);
        showAlert("Success", "Tender created successfully!", "success");
      }
      setIsTenderModalOpen(false);
      setSelectedTender(null);
      setSelectedTenderFinancials(null);
      fetchTenders(); // Refresh list
      fetchStatistics(); // Refresh stats
    } catch (err: any) {
      console.error("Save failed:", err);
      showAlert("Save Failed", err.message || "An error occurred during save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTender = async (tender: Tender) => {
    const confirmed = await showDeleteConfirm("this tender");
    if (confirmed) {
      try {
        await apiClient.deleteTender(tender.id);
        showAlert("Deleted!", "Tender has been deleted.", "success");
        fetchTenders(); // Refresh list
        fetchStatistics(); // Refresh stats
      } catch (err: any) {
        console.error("Delete failed:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  const handleMarkEMDCollected = async (tenderId: number) => {
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) return;

    const collectionType = tender.status === "Lost" ? "SD1 (2%)" : "EMD (5%)";
    const confirmed = await showConfirm(
      "Mark as Collected",
      `Mark ${collectionType} as collected for tender "${tender.name}"?`,
      "Yes, mark as collected",
      "Cancel"
    );
    if (confirmed) {
      // This would require a specific API endpoint for marking EMD as collected.
      // For now, we'll show an info message.
      showAlert("Info", "EMD collection marking functionality is a placeholder. This would require a backend API endpoint.", "info");
    }
  };

  // Search and filter - now handled by backend, but we still need to filter for display
  const filteredTenders = useMemo(() => {
    // Backend handles search and status filter, but we still need to filter for EMD if needed
    // Since backend handles pending_emds filter, filteredTenders should just be tenders
    return tenders;
  }, [tenders]);

  const getStatusBadgeClass = (status: Tender["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "Filed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Awarded":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Lost":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getFinancials = (tenderId: number) => {
    // For list view, we need to calculate financials from backend data
    // Since we don't have full detail in list, we'll use the backend's calculated values
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender) return null;

    // We'll need to fetch full detail to get financials, or use backend's calculated values
    // For now, return a placeholder based on estimated_value
    return {
      id: tender.id,
      tender_id: tender.id,
      emd_amount: tender.estimated_value * 0.05,
      emd_refundable: tender.status !== "Awarded",
      emd_collected: false,
      sd1_amount: tender.estimated_value * 0.02,
      sd1_refundable: false,
      sd2_amount: tender.estimated_value * 0.03,
      sd2_refundable: false,
    } as TenderFinancials;
  };

  // Group tenders by status for Kanban view
  const kanbanColumns = useMemo(() => {
    const columns: Record<Tender["status"], Tender[]> = {
      Draft: [],
      Filed: [],
      Awarded: [],
      Lost: [],
      Closed: [],
    };

    filteredTenders.forEach((tender) => {
      columns[tender.status].push(tender);
    });

    return columns;
  }, [filteredTenders]);

  if (isLoading && tenders.length === 0) {
    return (
      <DashboardLayout title="Tenders" breadcrumbs={["Home", "Tenders"]}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="ml-3 text-gray-500">Loading tenders...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && tenders.length === 0) {
    return (
      <DashboardLayout title="Tenders" breadcrumbs={["Home", "Tenders"]}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading tenders: {error}</p>
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
    <DashboardLayout title="Tenders" breadcrumbs={["Home", "Tenders"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenders</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage tender pipeline, EMD, security deposits, and documents
            </p>
          </div>
          <button
            onClick={handleNewTender}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            New Tender
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenders</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.total_tenders ?? "..."}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.tenders_filed ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Awarded</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.tenders_awarded ?? "..."}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ₹{(statistics ? statistics.total_value_awarded / 10000000 : 0).toFixed(1)}Cr
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{(statistics ? statistics.total_value_awarded / 10000000 : 0).toFixed(1)}Cr
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending EMDs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.pending_emds ?? "..."}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending EMD Amt</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{(statistics ? statistics.pending_emd_amount / 100000 : 0).toFixed(1)}L
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <IndianRupee className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Filed">Filed</option>
              <option value="Awarded">Awarded</option>
              <option value="Lost">Lost</option>
              <option value="Closed">Closed</option>
            </select>

            {/* EMD Filter */}
            <button
              onClick={() => setEmdFilter(!emdFilter)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                emdFilter
                  ? "bg-orange-500 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Pending EMDs
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" && filteredTenders.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Filed Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Estimated Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      EMD
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {filteredTenders.map((tender) => {
                    const financials = getFinancials(tender.id);
                    return (
                      <tr key={tender.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tender.name}
                          </div>
                          {tender.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {tender.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {tender.reference_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {tender.filed_date
                            ? format(new Date(tender.filed_date), "dd MMM yyyy")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(tender.start_date), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(tender.end_date), "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ₹{(tender.estimated_value / 100000).toFixed(2)}L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              tender.status
                            )}`}
                          >
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {financials ? `₹${(financials.emd_amount / 100000).toFixed(2)}L` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {(tender.status === "Closed" || tender.status === "Lost") && (
                              <button
                                onClick={() => handleMarkEMDCollected(tender.id)}
                                className="rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
                                title="Mark as Collected"
                              >
                                Mark Collected
                              </button>
                            )}
                            <Link
                              href={`/tenders/${tender.id}`}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleEditTender(tender)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                              title="Edit Tender"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTender(tender)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
                              title="Delete Tender"
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

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {(["Draft", "Filed", "Awarded", "Lost", "Closed"] as const).map((status) => (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between rounded-t-lg bg-white px-4 py-3 shadow dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{status}</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {kanbanColumns[status].length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {kanbanColumns[status].map((tender) => {
                    const financials = getFinancials(tender.id);
                    return (
                      <div
                        key={tender.id}
                        className="cursor-move rounded-lg bg-white p-4 shadow hover:shadow-md dark:bg-gray-800"
                      >
                        <Link href={`/tenders/${tender.id}`}>
                          <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {tender.name}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {tender.reference_number}
                          </p>
                        </Link>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <IndianRupee className="h-3 w-3" />
                            <span>₹{(tender.estimated_value / 100000).toFixed(2)}L</span>
                          </div>
                          {tender.filed_date && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>Filed: {format(new Date(tender.filed_date), "dd MMM yyyy")}</span>
                            </div>
                          )}
                          {financials && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <AlertCircle className="h-3 w-3" />
                              <span>EMD: ₹{(financials.emd_amount / 100000).toFixed(2)}L</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Link href={`/tenders/${tender.id}`} className="flex-1">
                            <button
                              className="w-full rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                              title="View Details"
                            >
                              View
                            </button>
                          </Link>
                          <button
                            onClick={() => handleEditTender(tender)}
                            className="flex-1 rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                            title="Edit"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {kanbanColumns[status].length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No tenders</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredTenders.length === 0 && !isLoading && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tenders found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first tender
            </p>
            <button
              onClick={handleNewTender}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              New Tender
            </button>
          </div>
        )}

        {/* Tender Form Modal */}
        <TenderFormModal
          isOpen={isTenderModalOpen}
          onClose={() => {
            setIsTenderModalOpen(false);
            setSelectedTender(null);
            setSelectedTenderFinancials(null);
          }}
          onSubmit={handleTenderSubmit}
          tender={selectedTender}
          existingFinancials={selectedTenderFinancials}
          isSaving={isSaving}
        />
      </div>
    </DashboardLayout>
  );
}

function TendersPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <DashboardLayout title="Tenders">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-500">Loading...</div>
            </div>
          </DashboardLayout>
        }
      >
        <TendersPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

export default TendersPage;

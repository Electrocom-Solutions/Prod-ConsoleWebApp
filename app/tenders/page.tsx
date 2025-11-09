"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Tender, TenderFinancials } from "@/types";
import TenderFormModal from "@/components/tenders/tender-form-modal";
import { mockTenders as initialTenders } from "@/lib/mock-data/tenders";
import { showDeleteConfirm, showConfirm } from "@/lib/sweetalert";

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>(initialTenders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [emdFilter, setEmdFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [financials, setFinancials] = useState<TenderFinancials[]>([]);

  // Calculate financials dynamically
  const mockFinancials: TenderFinancials[] = useMemo(() => {
    if (financials.length === 0) {
      const initialFinancials = tenders.map((tender) => ({
        id: tender.id,
        tender_id: tender.id,
        emd_amount: tender.estimated_value * 0.05,
        emd_refundable: tender.status !== "Awarded",
        emd_collected: false,
        sd1_amount: tender.estimated_value * 0.02,
        sd1_refundable: false,
        sd2_amount: tender.estimated_value * 0.03,
        sd2_refundable: false,
      }));
      setFinancials(initialFinancials);
      return initialFinancials;
    }
    return financials;
  }, [tenders, financials]);

  // CRUD handlers
  const handleNewTender = () => {
    setSelectedTender(null);
    setIsTenderModalOpen(true);
  };

  const handleEditTender = (tender: Tender) => {
    setSelectedTender(tender);
    setIsTenderModalOpen(true);
  };

  const handleCreateTender = (
    tenderData: Omit<Tender, "id" | "created_at" | "updated_at">,
    financialsData?: Partial<TenderFinancials>
  ) => {
    const newTender: Tender = {
      ...tenderData,
      id: Math.max(...tenders.map((t) => t.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTenders([...tenders, newTender]);

    // Create financials record with provided data or auto-calculated defaults
    const newFinancials: TenderFinancials = {
      id: newTender.id,
      tender_id: newTender.id,
      emd_amount: financialsData?.emd_amount ?? newTender.estimated_value * 0.05,
      emd_refundable: newTender.status !== "Awarded",
      emd_collected: false,
      sd1_amount: financialsData?.sd1_amount ?? newTender.estimated_value * 0.02,
      sd1_refundable: false,
      sd2_amount: financialsData?.sd2_amount ?? newTender.estimated_value * 0.03,
      sd2_refundable: false,
      dd_date: financialsData?.dd_date,
      dd_number: financialsData?.dd_number,
      dd_amount: financialsData?.dd_amount,
      dd_beneficiary_name: financialsData?.dd_beneficiary_name,
      dd_bank_name: financialsData?.dd_bank_name,
    };
    setFinancials([...financials, newFinancials]);
  };

  const handleUpdateTender = (
    tenderData: Omit<Tender, "id" | "created_at" | "updated_at">,
    financialsData?: Partial<TenderFinancials>
  ) => {
    if (!selectedTender) return;

    const updatedTender: Tender = {
      ...tenderData,
      id: selectedTender.id,
      created_at: selectedTender.created_at,
      updated_at: new Date().toISOString(),
    };

    setTenders(tenders.map((t) => (t.id === selectedTender.id ? updatedTender : t)));

    // Update financials record
    if (financialsData) {
      setFinancials(
        financials.map((f) =>
          f.tender_id === selectedTender.id
            ? {
                ...f,
                sd1_amount: financialsData.sd1_amount ?? f.sd1_amount,
                sd2_amount: financialsData.sd2_amount ?? f.sd2_amount,
                dd_date: financialsData.dd_date ?? f.dd_date,
                dd_number: financialsData.dd_number ?? f.dd_number,
                dd_amount: financialsData.dd_amount ?? f.dd_amount,
                dd_beneficiary_name: financialsData.dd_beneficiary_name ?? f.dd_beneficiary_name,
                dd_bank_name: financialsData.dd_bank_name ?? f.dd_bank_name,
              }
            : f
        )
      );
    }
  };

  const handleTenderSubmit = (
    tenderData: Omit<Tender, "id" | "created_at" | "updated_at">,
    financialsData?: Partial<TenderFinancials>
  ) => {
    if (selectedTender) {
      handleUpdateTender(tenderData, financialsData);
    } else {
      handleCreateTender(tenderData, financialsData);
    }
  };

  const handleDeleteTender = async (tender: Tender) => {
    const confirmed = await showConfirm(
      "Delete Tender?",
      `Are you sure you want to delete tender "${tender.name}"? This action cannot be undone.`,
      "Yes, delete it",
      "Cancel"
    );
    if (confirmed) {
      setTenders(tenders.filter((t) => t.id !== tender.id));
      setFinancials(financials.filter((f) => f.tender_id !== tender.id));
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
      setFinancials(
        financials.map((f) =>
          f.tender_id === tenderId
            ? { ...f, emd_collected: true, emd_collection_date: new Date().toISOString() }
            : f
        )
      );
    }
  };

  // Search and filter
  const filteredTenders = useMemo(() => {
    return tenders.filter((tender) => {
      const matchesSearch =
        searchQuery === "" ||
        tender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tender.reference_number.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || tender.status === statusFilter;

      const tenderFinancials = mockFinancials.find((f) => f.tender_id === tender.id);
      const needsEMDCollection = (tender.status === "Closed" || tender.status === "Lost") && !tenderFinancials?.emd_collected;
      const matchesEMD = !emdFilter || needsEMDCollection;

      return matchesSearch && matchesStatus && matchesEMD;
    });
  }, [tenders, searchQuery, statusFilter, emdFilter, mockFinancials]);

  // Stats
  const stats = useMemo(() => {
    const pendingEMDs = tenders.filter((t) => {
      const tenderFinancials = mockFinancials.find((f) => f.tender_id === t.id);
      return (t.status === "Closed" || t.status === "Lost") && !tenderFinancials?.emd_collected;
    });

    const pendingEMDAmount = pendingEMDs.reduce((sum, t) => {
      const tenderFinancials = mockFinancials.find((f) => f.tender_id === t.id);
      if (t.status === "Lost") {
        return sum + (tenderFinancials?.sd1_amount || 0);
      }
      return sum + (tenderFinancials?.emd_amount || 0);
    }, 0);

    return {
      total: tenders.length,
      draft: tenders.filter((t) => t.status === "Draft").length,
      filed: tenders.filter((t) => t.status === "Filed").length,
      awarded: tenders.filter((t) => t.status === "Awarded").length,
      lost: tenders.filter((t) => t.status === "Lost").length,
      totalValue: tenders.reduce((sum, t) => sum + t.estimated_value, 0),
      awardedValue: tenders
        .filter((t) => t.status === "Awarded")
        .reduce((sum, t) => sum + t.estimated_value, 0),
      pendingEMDCount: pendingEMDs.length,
      pendingEMDAmount: pendingEMDAmount,
    };
  }, [tenders, mockFinancials]);

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
    return mockFinancials.find((f) => f.tender_id === tenderId);
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

  return (
    <DashboardLayout
      title="Tenders"
      breadcrumbs={["Home", "Tenders"]}
    >
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
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.filed}</p>
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
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.awarded}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ₹{(stats.awardedValue / 10000000).toFixed(1)}Cr
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
                  ₹{(stats.totalValue / 10000000).toFixed(1)}Cr
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
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingEMDCount}</p>
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
                  ₹{(stats.pendingEMDAmount / 100000).toFixed(1)}L
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
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {tender.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {tender.reference_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {tender.filed_date
                            ? new Date(tender.filed_date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tender.start_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tender.end_date).toLocaleDateString("en-IN")}
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
                            {(tender.status === "Closed" || tender.status === "Lost") && !financials?.emd_collected && (
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
                              <span>Filed: {new Date(tender.filed_date).toLocaleDateString("en-IN")}</span>
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
        {filteredTenders.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
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
          }}
          onSubmit={handleTenderSubmit}
          tender={selectedTender}
          existingFinancials={
            selectedTender
              ? financials.find((f) => f.tender_id === selectedTender.id) || null
              : null
          }
        />
      </div>
    </DashboardLayout>
  );
}

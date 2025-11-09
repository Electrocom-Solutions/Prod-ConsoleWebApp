"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ArrowLeft,
  Edit,
  FileText,
  IndianRupee,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertCircle,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tender, TenderFinancials } from "@/types";
import {
  apiClient,
  BackendTenderDetail,
  BackendTenderDeposit,
  BackendTenderDocument,
  BackendTenderActivity,
} from "@/lib/api";
import { showDeleteConfirm, showAlert } from "@/lib/sweetalert";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { format } from "date-fns";

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

function TenderDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const tenderId = parseInt(params.id as string, 10);

  const [tender, setTender] = useState<Tender | null>(null);
  const [financials, setFinancials] = useState<TenderFinancials | null>(null);
  const [deposits, setDeposits] = useState<BackendTenderDeposit[]>([]);
  const [documents, setDocuments] = useState<BackendTenderDocument[]>([]);
  const [activities, setActivities] = useState<BackendTenderActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    financials: true,
    documents: true,
    activityFeed: false,
  });

  // Fetch tender details
  const fetchTenderDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await apiClient.getTender(tenderId);
      setTender(mapBackendTenderDetailToFrontend(detail));
      setFinancials(mapBackendTenderDetailToFinancials(detail));
      setDeposits(detail.deposits);
      setDocuments(detail.documents);
      setActivities(detail.activity_feed);
    } catch (err: any) {
      console.error("Failed to fetch tender details:", err);
      setError(err.message || "Failed to load tender details.");
    } finally {
      setIsLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchTenderDetail();
  }, [fetchTenderDetail]);

  const handleDownloadDocument = async (docId: number) => {
    try {
      const blob = await apiClient.downloadTenderDocument(tenderId, docId);
      const document = documents.find((d) => d.id === docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = document?.file_name || `document-${docId}`;
      a.click();
      window.URL.revokeObjectURL(url);
      showAlert("Success", "Document downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Download failed:", err);
      showAlert("Download Failed", err.message || "An error occurred during download.", "error");
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    const confirmed = await showDeleteConfirm("this document");
    if (confirmed) {
      try {
        await apiClient.deleteTenderDocument(tenderId, docId);
        showAlert("Deleted!", "Document has been deleted.", "success");
        fetchTenderDetail(); // Refresh data
      } catch (err: any) {
        console.error("Delete failed:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  const handleAttachDocument = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setIsUploading(true);
        try {
          for (const file of Array.from(files)) {
            await apiClient.attachTenderDocument(tenderId, file);
          }
          showAlert("Success", "Document(s) attached successfully!", "success");
          fetchTenderDetail(); // Refresh data
        } catch (err: any) {
          console.error("Upload failed:", err);
          showAlert("Upload Failed", err.message || "An error occurred during upload.", "error");
        } finally {
          setIsUploading(false);
        }
      }
    };
    fileInput.click();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  if (isLoading) {
    return (
      <DashboardLayout title="Tender Details" breadcrumbs={["Home", "Tenders", "Loading..."]}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="ml-3 text-gray-500">Loading tender details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tender) {
    return (
      <DashboardLayout title="Tender Not Found" breadcrumbs={["Home", "Tenders", "Not Found"]}>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {error ? "Error Loading Tender" : "Tender Not Found"}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || "The tender you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/tenders"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Tender - ${tender.reference_number}`}
      breadcrumbs={["Home", "Tenders", tender.reference_number]}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Link
          href="/tenders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenders
        </Link>

        {/* Header Card */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tender.name}
                </h1>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                    tender.status
                  )}`}
                >
                  {tender.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {tender.reference_number}
              </p>
              {tender.description && (
                <p className="mt-3 text-gray-700 dark:text-gray-300">{tender.description}</p>
              )}

              {/* Key Dates */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {tender.filed_date && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Filed Date
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tender.filed_date), "dd MMM yyyy")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(tender.start_date), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(tender.end_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/tenders?edit=${tender.id}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit Tender
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimated Value</p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹{(tender.estimated_value / 100000).toFixed(2)}L
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EMD (5%)</p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹{((financials?.emd_amount || tender.estimated_value * 0.05) / 100000).toFixed(2)}L
            </p>
            {financials?.emd_refundable && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                Refundable
              </span>
            )}
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">SD1 (2%)</p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹{((financials?.sd1_amount || tender.estimated_value * 0.02) / 100000).toFixed(2)}L
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">SD2 (3%)</p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹{((financials?.sd2_amount || tender.estimated_value * 0.03) / 100000).toFixed(2)}L
            </p>
          </div>
        </div>

        {/* Financials Panel */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <button
            onClick={() => toggleSection("financials")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Financials & Deposits
            </h2>
            {expandedSections.financials ? (
              <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          {expandedSections.financials && (
            <div className="border-t border-gray-200 p-6 dark:border-gray-700">
              <div className="space-y-6">
                {/* First Row: SD1, SD2, Total EMD Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* SD1 Card */}
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-gray-700 dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Security Deposit 1
                      </h3>
                      {financials?.sd1_refundable && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{((financials?.sd1_amount || tender.estimated_value * 0.02) / 100000).toFixed(2)}L
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">2% of Estimated Value</p>
                  </div>

                  {/* SD2 Card */}
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-white p-4 dark:border-gray-700 dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Security Deposit 2
                      </h3>
                      {financials?.sd2_refundable && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{((financials?.sd2_amount || tender.estimated_value * 0.03) / 100000).toFixed(2)}L
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">3% of Estimated Value</p>
                  </div>

                  {/* Total EMD Card */}
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-white p-4 dark:border-gray-700 dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Total EMD
                      </h3>
                      {financials?.emd_refundable && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{((financials?.emd_amount || tender.estimated_value * 0.05) / 100000).toFixed(2)}L
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">5% of Estimated Value</p>
                    {financials?.emd_refund_date && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Refunded on {format(new Date(financials.emd_refund_date), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Deposits Table */}
                {deposits.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h3 className="mb-4 font-medium text-gray-900 dark:text-white">
                      Deposit Details
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              DD Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              DD Number
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Bank
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Beneficiary
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {deposits.map((deposit) => (
                            <tr key={deposit.id}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {deposit.deposit_type === "EMD_Security1" ? "Security Deposit 1" : "Security Deposit 2"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(deposit.dd_date), "dd MMM yyyy")}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {deposit.dd_number}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                                ₹{parseFloat(deposit.dd_amount).toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {deposit.bank_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {deposit.dd_beneficiary_name}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {deposit.is_refunded ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <Check className="h-3 w-3" />
                                    Refunded
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Documents Panel */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <button
            onClick={() => toggleSection("documents")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h2>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {documents.length}
              </span>
            </div>
            {expandedSections.documents ? (
              <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          {expandedSections.documents && (
            <div className="border-t border-gray-200 p-6 dark:border-gray-700">
              <div className="mb-4">
                <button
                  onClick={handleAttachDocument}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Attach Documents
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No documents attached</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900/30">
                          <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Attached by {doc.created_by_username || "Unknown"} on{" "}
                            {format(new Date(doc.created_at), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed Panel */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <button
            onClick={() => toggleSection("activityFeed")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activity Feed
              </h2>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {activities.length}
              </span>
            </div>
            {expandedSections.activityFeed ? (
              <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          {expandedSections.activityFeed && (
            <div className="border-t border-gray-200 p-6 dark:border-gray-700">
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No activities recorded</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900/30">
                          <div className="h-2 w-2 rounded-full bg-sky-600 dark:bg-sky-400" />
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {activity.created_by_username || "System"} •{" "}
                          {format(new Date(activity.created_at), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TenderDetailPage() {
  return (
    <ProtectedRoute>
      <TenderDetailPageContent />
    </ProtectedRoute>
  );
}

export default TenderDetailPage;

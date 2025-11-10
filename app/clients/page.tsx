"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { ClientSendMailModal } from "@/components/clients/client-send-mail-modal";
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Mail,
  Phone,
  MapPin,
  Download,
  Trash2,
  Edit,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import type { Client } from "@/types";
import { format } from "date-fns";
import { showDeleteConfirm, showConfirm, showAlert } from "@/lib/sweetalert";
import {
  apiClient,
  ClientStatisticsResponse,
  BackendClientListItem,
  BackendClientListResponse,
  BackendClientDetail,
} from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend client list item to frontend Client type
 */
function mapBackendClientToFrontend(
  backendClient: BackendClientListItem,
  stats?: ClientStatisticsResponse
): Client {
  return {
    id: backendClient.id,
    name: backendClient.full_name || `${backendClient.first_name} ${backendClient.last_name}`,
    business_name: undefined, // Not available in list endpoint
    address: "", // Not available in list endpoint
    city: "", // Not available in list endpoint
    state: "", // Not available in list endpoint
    pin_code: "", // Not available in list endpoint
    country: "India", // Default
    primary_contact_name: backendClient.full_name || `${backendClient.first_name} ${backendClient.last_name}`,
    primary_contact_email: backendClient.email || "",
    primary_contact_phone: backendClient.phone_number || "",
    secondary_contact: undefined,
    notes: undefined,
    tags: [], // Not available in list endpoint
    amc_count: backendClient.has_active_amc ? 1 : 0, // Approximate
    open_projects: 0, // Not available in list endpoint
    outstanding_amount: 0, // Not available in list endpoint
    last_activity: backendClient.created_at,
    created_at: backendClient.created_at,
    updated_at: backendClient.created_at,
  };
}

/**
 * Map backend client detail to frontend Client type
 */
function mapBackendClientDetailToFrontend(
  backendClient: BackendClientDetail
): Client {
  return {
    id: backendClient.id,
    name: backendClient.full_name || `${backendClient.first_name || ''} ${backendClient.last_name || ''}`.trim() || 'Client',
    business_name: undefined,
    address: backendClient.address || "",
    city: backendClient.city || "",
    state: backendClient.state || "",
    pin_code: backendClient.pin_code || "",
    country: backendClient.country || "India",
    primary_contact_name: backendClient.primary_contact_name || backendClient.full_name || `${backendClient.first_name || ''} ${backendClient.last_name || ''}`.trim(),
    primary_contact_email: backendClient.email || "",
    primary_contact_phone: backendClient.phone_number || "",
    secondary_contact: undefined,
    notes: backendClient.notes || undefined,
    tags: [],
    amc_count: 0, // Would need to fetch separately
    open_projects: 0, // Would need to fetch separately
    outstanding_amount: 0, // Would need to fetch separately
    last_activity: backendClient.updated_at || backendClient.created_at,
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at,
  };
}

function ClientsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [statistics, setStatistics] = useState<ClientStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [hasActiveAMC, setHasActiveAMC] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [sendMailModalOpen, setSendMailModalOpen] = useState(false);
  const [selectedClientForMail, setSelectedClientForMail] = useState<Client | null>(null);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getClientStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch client statistics:", err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: {
        search?: string;
        has_active_amc?: boolean;
        page?: number;
      } = {};

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (hasActiveAMC === "yes") {
        params.has_active_amc = true;
      } else if (hasActiveAMC === "no") {
        params.has_active_amc = false;
      }

      const response: BackendClientListResponse = await apiClient.getClients(params);
      const mappedClients = response.results.map((backendClient) =>
        mapBackendClientToFrontend(backendClient, statistics || undefined)
      );
      setClients(mappedClients);
    } catch (err: any) {
      console.error("Failed to fetch clients:", err);
      setError(err.message || "Failed to load clients.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, hasActiveAMC, statistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Get unique cities, states, and tags for filters (from current clients)
  const cities = Array.from(new Set(clients.map((c) => c.city).filter(Boolean))).sort();
  const states = Array.from(new Set(clients.map((c) => c.state).filter(Boolean))).sort();
  const allTags = Array.from(new Set(clients.flatMap((c) => c.tags))).sort();

  // Filter clients (client-side filtering for city, state, tags)
  const filteredClients = clients.filter((client) => {
    const matchesCity = selectedCity === "all" || !client.city || client.city === selectedCity;
    const matchesState = selectedState === "all" || !client.state || client.state === selectedState;
    const matchesTag = selectedTag === "all" || client.tags.length === 0 || client.tags.includes(selectedTag);

    return matchesCity && matchesState && matchesTag;
  });

  // Handlers
  const handleCreateClient = () => {
    setFormMode("create");
    setEditingClient(undefined);
    setFormModalOpen(true);
  };

  // Check for action=new in URL params and open modal
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleCreateClient();
      // Remove the query parameter from URL
      router.replace("/clients");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEditClient = async (client: Client) => {
    try {
      // Fetch full client details
      const backendClient = await apiClient.getClient(client.id);
      const fullClient = mapBackendClientDetailToFrontend(backendClient);
    setFormMode("edit");
      setEditingClient(fullClient);
    setFormModalOpen(true);
    } catch (err: any) {
      console.error("Failed to fetch client details:", err);
      showAlert("Error", err.message || "Failed to load client details.", "error");
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    setIsSaving(true);
    try {
    if (formMode === "create") {
        // Map frontend Client to backend format
        // Client Name -> first_name in User model (NOT split into first_name and last_name)
        const name = (clientData.name || "").trim();
        if (!name) {
          showAlert("Error", "Client name is required.", "error");
          setIsSaving(false);
          return;
        }

        const backendData: {
          first_name: string;
          email?: string;
          phone_number?: string;
          notes?: string;
          primary_contact_name?: string;
          address?: string;
          city?: string;
          state?: string;
          pin_code?: string;
          country?: string;
        } = {
          first_name: name, // Client Name -> first_name in User model
        };

        // Add optional fields only if they have values
        if (clientData.primary_contact_email?.trim()) {
          backendData.email = clientData.primary_contact_email.trim();
        }
        if (clientData.primary_contact_phone?.trim()) {
          backendData.phone_number = clientData.primary_contact_phone.trim();
        }
        if (clientData.primary_contact_name?.trim()) {
          backendData.primary_contact_name = clientData.primary_contact_name.trim();
        }
        if (clientData.notes?.trim()) {
          backendData.notes = clientData.notes.trim();
        }
        if (clientData.address?.trim()) {
          backendData.address = clientData.address.trim();
        }
        if (clientData.city?.trim()) {
          backendData.city = clientData.city.trim();
        }
        if (clientData.state?.trim()) {
          backendData.state = clientData.state.trim();
        }
        if (clientData.pin_code?.trim()) {
          backendData.pin_code = clientData.pin_code.trim();
        }
        if (clientData.country?.trim()) {
          backendData.country = clientData.country.trim();
        }

        await apiClient.createClient(backendData);
        showAlert("Success", "Client created successfully.", "success");
        setFormModalOpen(false);
        fetchClients();
        fetchStatistics();
    } else if (editingClient) {
        // Map frontend Client to backend format
        // Client Name -> first_name in User model (NOT split into first_name and last_name)
        const backendData: Partial<{
          first_name: string;
          email: string;
          phone_number: string;
          notes: string;
          primary_contact_name: string;
          address: string;
          city: string;
          state: string;
          pin_code: string;
          country: string;
        }> = {};

        // CRITICAL: Client Name -> first_name in User model
        if (clientData.name !== undefined) {
          backendData.first_name = (clientData.name || "").trim();
        }
        if (clientData.primary_contact_email !== undefined) backendData.email = clientData.primary_contact_email;
        if (clientData.primary_contact_phone !== undefined) backendData.phone_number = clientData.primary_contact_phone;
        // CRITICAL: Send primary_contact_name even if empty string to allow clearing the field
        if (clientData.primary_contact_name !== undefined) backendData.primary_contact_name = clientData.primary_contact_name;
        if (clientData.notes !== undefined) backendData.notes = clientData.notes;
        // CRITICAL: Send address fields even if empty strings to allow clearing/updating them
        if (clientData.address !== undefined) backendData.address = clientData.address;
        if (clientData.city !== undefined) backendData.city = clientData.city;
        if (clientData.state !== undefined) backendData.state = clientData.state;
        if (clientData.pin_code !== undefined) backendData.pin_code = clientData.pin_code;
        if (clientData.country !== undefined) backendData.country = clientData.country;

        await apiClient.updateClient(editingClient.id, backendData);
        showAlert("Success", "Client updated successfully.", "success");
        setFormModalOpen(false);
        fetchClients();
        fetchStatistics();
      }
    } catch (err: any) {
      console.error("Failed to save client:", err);
      console.error("Error details:", {
        message: err?.message,
        error: err?.error,
        detail: err?.detail,
        response: err?.response,
        status: err?.status,
      });
      
      // Extract error message - handle both Error objects and plain objects
      let errorMessage = "Failed to save client.";
      
      // Check for detail field first (Django's standard error format)
      if (err?.detail) {
        errorMessage = err.detail;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // If there are validation errors in response, show them
      if (err?.response && typeof err.response === 'object') {
        const validationErrors = Object.entries(err.response)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            } else if (typeof messages === 'string') {
              return `${field}: ${messages}`;
            } else if (typeof messages === 'object') {
              return `${field}: ${JSON.stringify(messages)}`;
            }
            return `${field}: ${String(messages)}`;
          })
          .join('\n');
        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }
      
      // If error message is still generic, try to extract more info
      if (errorMessage === "Failed to save client." || errorMessage === "An unexpected error occurred") {
        if (err?.response) {
          errorMessage = JSON.stringify(err.response);
        } else if (err) {
          errorMessage = JSON.stringify(err);
        }
      }
      
      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    const confirmed = await showDeleteConfirm("this client");
    if (confirmed) {
      try {
        await apiClient.deleteClient(clientId);
        showAlert("Success", "Client deleted successfully.", "success");
        fetchClients();
        fetchStatistics();
      } catch (err: any) {
        console.error("Failed to delete client:", err);
        showAlert("Error", err.message || "Failed to delete client.", "error");
      }
    }
  };

  const toggleClientSelection = (clientId: number) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const handleBulkExportCSV = () => {
    const selectedClientData = clients.filter((c) => selectedClients.has(c.id));
    const csv = [
      ["Name", "Business Name", "City", "State", "Contact Email", "Contact Phone", "AMC Count", "Outstanding"],
      ...selectedClientData.map((c) => [
        c.name,
        c.business_name || "",
        c.city || "",
        c.state || "",
        c.primary_contact_email,
        c.primary_contact_phone,
        c.amc_count.toString(),
        c.outstanding_amount.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkEmail = async () => {
    const selectedClientData = clients.filter((c) => selectedClients.has(c.id));
    await showAlert(
      "Bulk Email",
      `Send bulk email to ${selectedClientData.length} clients:\n${selectedClientData
        .map((c) => c.primary_contact_email)
        .join(", ")}`,
      "info"
    );
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      "Delete Multiple Clients?",
      `Are you sure you want to delete ${selectedClients.size} clients? This action cannot be undone.`,
      "Yes, delete them",
      "Cancel"
    );
    if (confirmed) {
      try {
        const deletePromises = Array.from(selectedClients).map((id) => apiClient.deleteClient(id));
        await Promise.all(deletePromises);
        showAlert("Success", "Selected clients deleted successfully.", "success");
      setSelectedClients(new Set());
        fetchClients();
        fetchStatistics();
      } catch (err: any) {
        console.error("Failed to delete clients:", err);
        showAlert("Error", err.message || "Failed to delete clients.", "error");
      }
    }
  };

  if (isLoading && clients.length === 0) {
    return (
      <DashboardLayout title="Clients" breadcrumbs={["Home", "Clients"]}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="ml-3 text-gray-500">Loading clients...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && clients.length === 0) {
    return (
      <DashboardLayout title="Clients" breadcrumbs={["Home", "Clients"]}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading clients: {error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchClients();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Loader2 className="h-4 w-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clients" breadcrumbs={["Home", "Clients"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your client directory
            </p>
          </div>
          <button
            onClick={handleCreateClient}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            New Client
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Clients</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {statistics?.total_clients ?? clients.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active AMCs</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {statistics?.active_amcs_count ?? clients.filter((c) => c.amc_count > 0).length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Open Projects</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {statistics?.open_projects_count ?? clients.reduce((sum, c) => sum + c.open_projects, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              ₹{statistics?.outstanding_amount?.toLocaleString() ?? clients.reduce((sum, c) => sum + c.outstanding_amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              )}

              {states.length > 0 && (
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              )}

              <select
                value={hasActiveAMC}
                onChange={(e) => setHasActiveAMC(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Clients</option>
                <option value="yes">Has Active AMC</option>
                <option value="no">No Active AMC</option>
              </select>

              {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              )}

              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 ${
                    viewMode === "table"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedClients.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900 dark:bg-sky-900/20">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                {selectedClients.size} client{selectedClients.size > 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkExportCSV}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleBulkEmail}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No clients found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {clients.length === 0
                ? "Get started by adding your first client"
                : "Try adjusting your search or filters"}
            </p>
            {clients.length === 0 && (
            <button
              onClick={handleCreateClient}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              New Client
            </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => {
              const isSelected = selectedClients.has(client.id);
              return (
                <div
                  key={client.id}
                  className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                    isSelected ? "ring-2 ring-sky-500" : ""
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleClientSelection(client.id)}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                    />
                    {client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    )}
                  </div>

                  <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {client.name}
                  </h3>
                  {client.business_name && (
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                      {client.business_name}
                    </p>
                  )}

                  <div className="mb-4 space-y-2 text-sm">
                    {(client.city || client.state) && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                          {client.city ? `${client.city}, ` : ""}
                          {client.state || ""}
                      </span>
                    </div>
                    )}
                    {client.primary_contact_email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.primary_contact_email}</span>
                    </div>
                    )}
                    {client.primary_contact_phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{client.primary_contact_phone}</span>
                    </div>
                    )}
                  </div>

                  <div className="mb-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">AMCs</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {client.amc_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Projects</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {client.open_projects}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Outstanding</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₹{(client.outstanding_amount / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClientForMail(client);
                        setSendMailModalOpen(true);
                      }}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedClients.size === filteredClients.length &&
                        filteredClients.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Primary Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    AMC Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {filteredClients.map((client) => {
                  const isSelected = selectedClients.has(client.id);
                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isSelected ? "bg-sky-50 dark:bg-sky-900/20" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClientSelection(client.id)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </p>
                          {client.business_name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {client.business_name}
                            </p>
                          )}
                          {client.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {client.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {client.city || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {client.state || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">
                            {client.primary_contact_name}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {client.primary_contact_email}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {client.primary_contact_phone}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            client.amc_count > 0
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {client.amc_count}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        ₹{client.outstanding_amount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(client.last_activity), "MMM dd, yyyy")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClientForMail(client);
                              setSendMailModalOpen(true);
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
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
        )}
      </div>

      {/* Form Modal */}
      <ClientFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
        mode={formMode}
      />

      {/* Send Mail Modal */}
      <ClientSendMailModal
        isOpen={sendMailModalOpen}
        onClose={() => {
          setSendMailModalOpen(false);
          setSelectedClientForMail(null);
        }}
        client={selectedClientForMail}
      />
    </DashboardLayout>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <DashboardLayout title="Clients">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-500">Loading...</div>
            </div>
          </DashboardLayout>
        }
      >
        <ClientsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

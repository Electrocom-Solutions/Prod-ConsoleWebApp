"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ClientFormModal } from "@/components/clients/client-form-modal";
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
} from "lucide-react";
import type { Client } from "@/types";
import { format } from "date-fns";
import { showDeleteConfirm, showConfirm, showAlert } from "@/lib/sweetalert";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "ABC Power Solutions Ltd",
      business_name: "ABC Power",
      address: "123 Industrial Area, Sector 45",
      city: "Mumbai",
      state: "Maharashtra",
      pin_code: "400001",
      country: "India",
      primary_contact_name: "Rajesh Kumar",
      primary_contact_email: "rajesh@abcpower.com",
      primary_contact_phone: "9876543210",
      secondary_contact: "9123456789",
      notes: "Premium client with multiple AMCs",
      tags: ["premium", "long-term"],
      amc_count: 5,
      open_projects: 2,
      outstanding_amount: 125000,
      last_activity: "2025-10-30T10:30:00Z",
      created_at: "2023-01-15T00:00:00Z",
      updated_at: "2025-10-30T10:30:00Z",
    },
    {
      id: 2,
      name: "XYZ Industries",
      address: "456 Tech Park, Phase 2",
      city: "Pune",
      state: "Maharashtra",
      pin_code: "411001",
      country: "India",
      primary_contact_name: "Priya Sharma",
      primary_contact_email: "priya@xyzind.com",
      primary_contact_phone: "9765432109",
      tags: ["industrial", "regular"],
      amc_count: 3,
      open_projects: 1,
      outstanding_amount: 75000,
      last_activity: "2025-10-28T14:20:00Z",
      created_at: "2023-06-20T00:00:00Z",
      updated_at: "2025-10-28T14:20:00Z",
    },
    {
      id: 3,
      name: "TechCorp Solutions",
      business_name: "TechCorp IT Services",
      address: "789 Software City, Building A",
      city: "Bangalore",
      state: "Karnataka",
      pin_code: "560001",
      country: "India",
      primary_contact_name: "Amit Patel",
      primary_contact_email: "amit@techcorp.com",
      primary_contact_phone: "9654321098",
      secondary_contact: "amit.p@techcorp.com",
      notes: "IT infrastructure maintenance contracts",
      tags: ["tech", "corporate"],
      amc_count: 4,
      open_projects: 3,
      outstanding_amount: 0,
      last_activity: "2025-11-01T09:15:00Z",
      created_at: "2024-02-10T00:00:00Z",
      updated_at: "2025-11-01T09:15:00Z",
    },
    {
      id: 4,
      name: "Metro Mall Services",
      address: "Metro Plaza, MG Road",
      city: "Delhi",
      state: "Delhi",
      pin_code: "110001",
      country: "India",
      primary_contact_name: "Sunita Verma",
      primary_contact_email: "sunita@metromall.com",
      primary_contact_phone: "9543210987",
      tags: ["retail", "commercial"],
      amc_count: 2,
      open_projects: 0,
      outstanding_amount: 50000,
      last_activity: "2025-10-25T16:45:00Z",
      created_at: "2024-08-05T00:00:00Z",
      updated_at: "2025-10-25T16:45:00Z",
    },
  ]);

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [hasActiveAMC, setHasActiveAMC] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Get unique cities, states, and tags for filters
  const cities = Array.from(new Set(clients.map((c) => c.city))).sort();
  const states = Array.from(new Set(clients.map((c) => c.state))).sort();
  const allTags = Array.from(
    new Set(clients.flatMap((c) => c.tags))
  ).sort();

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      searchQuery === "" ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_contact_phone.includes(searchQuery);

    const matchesCity = selectedCity === "all" || client.city === selectedCity;
    const matchesState = selectedState === "all" || client.state === selectedState;
    const matchesAMC =
      hasActiveAMC === "all" ||
      (hasActiveAMC === "yes" && client.amc_count > 0) ||
      (hasActiveAMC === "no" && client.amc_count === 0);
    const matchesTag =
      selectedTag === "all" || client.tags.includes(selectedTag);

    return (
      matchesSearch && matchesCity && matchesState && matchesAMC && matchesTag
    );
  });

  // Handlers
  const handleCreateClient = () => {
    setFormMode("create");
    setEditingClient(undefined);
    setFormModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setFormMode("edit");
    setEditingClient(client);
    setFormModalOpen(true);
  };

  const handleSaveClient = (clientData: Partial<Client>) => {
    if (formMode === "create") {
      const newClient: Client = {
        ...clientData,
        id: Math.max(...clients.map((c) => c.id), 0) + 1,
        amc_count: 0,
        open_projects: 0,
        outstanding_amount: 0,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Client;
      setClients([...clients, newClient]);
    } else if (editingClient) {
      setClients(
        clients.map((c) =>
          c.id === editingClient.id
            ? { ...c, ...clientData, updated_at: new Date().toISOString() }
            : c
        )
      );
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    const confirmed = await showDeleteConfirm("this client");
    if (confirmed) {
      setClients(clients.filter((c) => c.id !== clientId));
      selectedClients.delete(clientId);
      setSelectedClients(new Set(selectedClients));
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
    const selectedClientData = clients.filter((c) =>
      selectedClients.has(c.id)
    );
    const csv = [
      ["Name", "Business Name", "City", "State", "Contact Email", "Contact Phone", "AMC Count", "Outstanding"],
      ...selectedClientData.map((c) => [
        c.name,
        c.business_name || "",
        c.city,
        c.state,
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
    const selectedClientData = clients.filter((c) =>
      selectedClients.has(c.id)
    );
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
      setClients(clients.filter((c) => !selectedClients.has(c.id)));
      setSelectedClients(new Set());
    }
  };

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
              {clients.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active AMCs</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {clients.filter((c) => c.amc_count > 0).length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Open Projects</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {clients.reduce((sum, c) => sum + c.open_projects, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              ₹{clients.reduce((sum, c) => sum + c.outstanding_amount, 0).toLocaleString()}
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
                  placeholder="Search clients, city, state, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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

              <select
                value={hasActiveAMC}
                onChange={(e) => setHasActiveAMC(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Clients</option>
                <option value="yes">Has Active AMC</option>
                <option value="no">No Active AMC</option>
              </select>

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
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No clients found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first client
            </p>
            <button
              onClick={handleCreateClient}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              New Client
            </button>
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
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {client.city}, {client.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.primary_contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{client.primary_contact_phone}</span>
                    </div>
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
                    <button className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">
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
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {client.city}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {client.state}
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
    </DashboardLayout>
  );
}

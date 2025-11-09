"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, X, Search, Loader2 } from "lucide-react";
import { showSuccess, showDeleteConfirm, showError } from "@/lib/sweetalert";
import { apiClient, BackendFirmListItem, FirmDetail, FirmCreateData, BackendEmployeeListItem, EmployeeListResponse } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend firm list item to frontend Firm type
 */
function mapBackendFirmListItemToFrontend(backendFirm: BackendFirmListItem): {
  id: number;
  firm_name: string;
  firm_type: string;
  firm_owner_profile_id: number;
  firm_owner_profile_name: string;
  firm_official_email: string;
  firm_official_mobile: string;
  address: string;
  gst_number: string;
  pan_number: string;
  created_at: string;
} {
  return {
    id: backendFirm.id,
    firm_name: backendFirm.firm_name,
    firm_type: backendFirm.type_display || backendFirm.firm_type || '',
    firm_owner_profile_id: backendFirm.firm_owner_profile || 0,
    firm_owner_profile_name: backendFirm.firm_owner_name || 'Unknown',
    firm_official_email: backendFirm.official_email || '',
    firm_official_mobile: backendFirm.official_mobile_number || '',
    address: backendFirm.address || '',
    gst_number: backendFirm.gst_number || '',
    pan_number: backendFirm.pan_number || '',
    created_at: backendFirm.created_at,
  };
}

function SettingsPageContent() {
  const [firms, setFirms] = useState<BackendFirmListItem[]>([]);
  const [employees, setEmployees] = useState<BackendEmployeeListItem[]>([]);
  const [showFirmModal, setShowFirmModal] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<BackendFirmListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch employees for firm owner profile selection
   */
  const fetchEmployees = useCallback(async () => {
    try {
      const response: EmployeeListResponse = await apiClient.getEmployees({});
      setEmployees(response.results);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      // Don't show error for employees, just log it
    }
  }, []);

  /**
   * Fetch firms from backend
   */
  const fetchFirms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (filterType !== 'all') {
        params.firm_type = filterType;
      }

      const response = await apiClient.getFirms(params);
      setFirms(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching firms:', err);
      setError(err.message || 'Failed to fetch firms');
      setFirms([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterType, currentPage]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  const handleDeleteFirm = async (id: number) => {
    const confirmed = await showDeleteConfirm("this firm");
    if (confirmed) {
      try {
        await apiClient.deleteFirm(id);
        fetchFirms();
        showSuccess("Success", "Firm deleted successfully");
      } catch (err: any) {
        showError("Error", err.message || "Failed to delete firm");
      }
    }
  };

  const handleSaveFirm = async (firmData: FirmCreateData & { id?: number }) => {
    setIsSaving(true);
    try {
      if (firmData.id) {
        // Update existing firm
        const { id, ...updateData } = firmData;
        await apiClient.updateFirm(id, updateData);
        showSuccess("Success", "Firm updated successfully");
      } else {
        // Create new firm
        await apiClient.createFirm(firmData);
        showSuccess("Success", "Firm created successfully");
      }

      fetchFirms();
      setShowFirmModal(false);
      setSelectedFirm(null);
    } catch (err: any) {
      showError("Error", err.message || "Failed to save firm");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Settings" breadcrumbs={["Home", "Settings"]}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Firm Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage your firms and company information</p>
          </div>
          <Button
            onClick={() => {
              setSelectedFirm(null);
              setShowFirmModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Firm
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by firm name, type, owner, email, GST, or PAN number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Proprietorship">Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Pvt Ltd">Pvt Ltd</option>
            <option value="LLP">LLP</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading firms...</span>
          </div>
        ) : firms.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery || filterType !== 'all' ? "No firms found" : "No firms"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || filterType !== 'all'
                ? "Try adjusting your search query or filters"
                : "Get started by creating your first firm"}
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button className="mt-4" onClick={() => setShowFirmModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Firm
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Firms Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Firm Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Firm Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Owner Profile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Mobile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        GST Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        PAN Number
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {firms.map((firm) => {
                      const mappedFirm = mapBackendFirmListItemToFrontend(firm);
                      return (
                        <tr key={firm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <div className="font-medium">{mappedFirm.firm_name}</div>
                            {mappedFirm.address && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mappedFirm.address}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">{mappedFirm.firm_type || 'N/A'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">{mappedFirm.firm_owner_profile_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mappedFirm.firm_official_email || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mappedFirm.firm_official_mobile || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mappedFirm.gst_number || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mappedFirm.pan_number || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedFirm(firm);
                                  setShowFirmModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFirm(firm.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {firms.length > 0 && totalPages > 1 && (
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

      {showFirmModal && (
        <FirmModal
          firm={selectedFirm}
          employees={employees}
          onClose={() => {
            setShowFirmModal(false);
            setSelectedFirm(null);
          }}
          onSave={handleSaveFirm}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

// Firm Modal Component
function FirmModal({
  firm,
  employees,
  onClose,
  onSave,
  isSaving,
}: {
  firm: BackendFirmListItem | null;
  employees: BackendEmployeeListItem[];
  onClose: () => void;
  onSave: (firm: FirmCreateData & { id?: number }) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    firm_name: firm?.firm_name || "",
    firm_type: firm?.firm_type || "",
    firm_owner_profile_id: firm?.firm_owner_profile || 0,
    firm_owner_profile_name: firm?.firm_owner_name || "",
    owner_search: "",
    firm_official_email: firm?.official_email || "",
    firm_official_mobile: firm?.official_mobile_number || "",
    address: "",
    gst_number: firm?.gst_number || "",
    pan_number: firm?.pan_number || "",
  });
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch full firm details when editing
  useEffect(() => {
    const fetchFirmDetail = async () => {
      if (firm && firm.id) {
        setIsLoadingDetail(true);
        try {
          const detail: FirmDetail = await apiClient.getFirm(firm.id);
          setFormData({
            firm_name: detail.firm_name,
            firm_type: detail.firm_type || "",
            firm_owner_profile_id: detail.firm_owner_profile || 0,
            firm_owner_profile_name: detail.firm_owner_name || "",
            owner_search: detail.firm_owner_name || "",
            firm_official_email: detail.official_email || "",
            firm_official_mobile: detail.official_mobile_number || "",
            address: detail.address || "",
            gst_number: detail.gst_number || "",
            pan_number: detail.pan_number || "",
          });
        } catch (err: any) {
          console.error('Error fetching firm details:', err);
          // Use list item data as fallback
          setFormData({
            firm_name: firm.firm_name,
            firm_type: firm.firm_type || "",
            firm_owner_profile_id: firm.firm_owner_profile || 0,
            firm_owner_profile_name: firm.firm_owner_name || "",
            owner_search: firm.firm_owner_name || "",
            firm_official_email: firm.official_email || "",
            firm_official_mobile: firm.official_mobile_number || "",
            address: "",
            gst_number: firm.gst_number || "",
            pan_number: firm.pan_number || "",
          });
        } finally {
          setIsLoadingDetail(false);
        }
      } else {
        setFormData({
          firm_name: "",
          firm_type: "",
          firm_owner_profile_id: 0,
          firm_owner_profile_name: "",
          owner_search: "",
          firm_official_email: "",
          firm_official_mobile: "",
          address: "",
          gst_number: "",
          pan_number: "",
        });
      }
    };

    fetchFirmDetail();
  }, [firm]);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchTerm = formData.owner_search.toLowerCase();
      if (!searchTerm) return true;
      const fullName = employee.full_name?.toLowerCase() || "";
      return (
        fullName.includes(searchTerm) ||
        employee.employee_code.toLowerCase().includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm) ||
        employee.phone_number?.includes(searchTerm)
      );
    });
  }, [employees, formData.owner_search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.owner-dropdown-container')) {
        setShowOwnerDropdown(false);
      }
    };

    if (showOwnerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOwnerDropdown]);

  const handleOwnerSelect = (employee: BackendEmployeeListItem) => {
    setFormData({
      ...formData,
      firm_owner_profile_id: employee.profile_id,
      firm_owner_profile_name: employee.full_name || employee.employee_code,
      owner_search: employee.full_name || employee.employee_code,
    });
    setShowOwnerDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const firmData: FirmCreateData & { id?: number } = {
      id: firm?.id,
      firm_name: formData.firm_name,
      firm_type: formData.firm_type ? (formData.firm_type as 'Proprietorship' | 'Partnership' | 'Pvt Ltd' | 'LLP') : null,
      firm_owner_profile: formData.firm_owner_profile_id || null,
      official_email: formData.firm_official_email || null,
      official_mobile_number: formData.firm_official_mobile || null,
      address: formData.address || null,
      gst_number: formData.gst_number || null,
      pan_number: formData.pan_number || null,
    };

    await onSave(firmData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold">
            {firm ? "Edit Firm" : "Create Firm"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving || isLoadingDetail}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading firm details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Firm Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.firm_name}
                onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Firm Type
              </label>
              <select
                value={formData.firm_type}
                onChange={(e) => setFormData({ ...formData, firm_type: e.target.value })}
                disabled={isSaving}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Firm Type</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Pvt Ltd">Pvt Ltd</option>
                <option value="LLP">LLP</option>
              </select>
            </div>

            {/* Firm Owner Profile - Searchable Dropdown */}
            <div className="relative owner-dropdown-container">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Firm Owner Profile
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.owner_search || formData.firm_owner_profile_name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      owner_search: e.target.value,
                      firm_owner_profile_id: 0,
                      firm_owner_profile_name: "",
                    });
                    setShowOwnerDropdown(true);
                  }}
                  onFocus={() => {
                    if (employees.length > 0) {
                      setShowOwnerDropdown(true);
                    }
                  }}
                  placeholder="Search by employee ID, name, email, or phone number"
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {showOwnerDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEmployees.map((employee) => {
                      const displayName = employee.full_name || employee.employee_code;
                      return (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleOwnerSelect(employee)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="font-medium">{displayName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {employee.employee_code} • {employee.email || 'N/A'} • {employee.phone_number || 'N/A'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {showOwnerDropdown && filteredEmployees.length === 0 && formData.owner_search && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                    No employees found
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Firm Official Email
                </label>
                <Input
                  type="email"
                  value={formData.firm_official_email}
                  onChange={(e) => setFormData({ ...formData, firm_official_email: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Firm Official Mobile Number
                </label>
                <Input
                  type="tel"
                  value={formData.firm_official_mobile}
                  onChange={(e) => setFormData({ ...formData, firm_official_mobile: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                disabled={isSaving}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  GST Number
                </label>
                <Input
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  placeholder="e.g., 27AABCU9603R1ZM"
                  maxLength={15}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  PAN Number
                </label>
                <Input
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  placeholder="e.g., AABCU9603R"
                  maxLength={10}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {firm ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  firm ? "Update Firm" : "Create Firm"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Settings"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <SettingsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

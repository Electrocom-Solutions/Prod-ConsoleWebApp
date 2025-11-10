"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Building2, Plus, Edit, Trash2, X, Search, Loader2 } from "lucide-react";
import { showSuccess, showDeleteConfirm, showError } from "@/lib/sweetalert";
import { apiClient, BackendFirmListItem, FirmDetail, FirmCreateData, BackendProfileListItem, ProfileListResponse, ProfileCreateData, CurrentUserProfile } from "@/lib/api";
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
  const [profiles, setProfiles] = useState<BackendProfileListItem[]>([]);
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  /**
   * Fetch profiles for firm owner profile selection
   */
  const fetchProfiles = useCallback(async (search?: string) => {
    try {
      const response: ProfileListResponse = await apiClient.getProfiles({
        search: search || undefined,
        page_size: 100, // Get more profiles for dropdown
      });
      setProfiles(response.results);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      // Don't show error for profiles, just log it
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
    fetchProfiles();
  }, [fetchProfiles]);

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

  const [onProfileCreatedCallback, setOnProfileCreatedCallback] = useState<((profile: CurrentUserProfile) => void) | null>(null);

  const handleCreateProfile = async (profileData: ProfileCreateData) => {
    setIsSaving(true);
    try {
      const createdProfile: CurrentUserProfile = await apiClient.createProfile(profileData);
      
      // Validate that the profile was created successfully
      if (!createdProfile || !createdProfile.id) {
        showError("Error", "Profile was created but invalid data was returned");
        return;
      }
      
      showSuccess("Success", "Profile created successfully");
      
      // Refresh profiles list to include the new profile
      await fetchProfiles();
      
      setShowProfileModal(false);
      
      // Call the callback if it exists (from FirmModal) to update form data
      // Only call if profile is valid
      if (onProfileCreatedCallback && createdProfile) {
        onProfileCreatedCallback(createdProfile);
      }
    } catch (err: any) {
      showError("Error", err.message || "Failed to create profile");
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
            profiles={profiles}
            onClose={() => {
              setShowFirmModal(false);
              setSelectedFirm(null);
              setOnProfileCreatedCallback(null);
            }}
            onSave={handleSaveFirm}
            isSaving={isSaving}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            onCreateProfile={handleCreateProfile}
            onSearchProfiles={fetchProfiles}
            onProfileCreated={(callback) => {
              // Store the callback from FirmModal to update its form data
              setOnProfileCreatedCallback(callback);
            }}
          />
        )}

      {showProfileModal && (
        <ProfileCreateModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={handleCreateProfile}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

// Firm Modal Component
function FirmModal({
  firm,
  profiles,
  onClose,
  onSave,
  isSaving,
  showProfileModal,
  setShowProfileModal,
  onCreateProfile,
  onSearchProfiles,
  onProfileCreated,
}: {
  firm: BackendFirmListItem | null;
  profiles: BackendProfileListItem[];
  onClose: () => void;
  onSave: (firm: FirmCreateData & { id?: number }) => Promise<void>;
  isSaving: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  onCreateProfile: (profile: ProfileCreateData) => Promise<void>;
  onSearchProfiles: (search?: string) => Promise<void>;
  onProfileCreated?: (callback: (profile: CurrentUserProfile) => void) => void;
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

  const [searchProfilesDebounced] = useDebounce(formData.owner_search, 500);
  const [filteredProfiles, setFilteredProfiles] = useState<BackendProfileListItem[]>(profiles);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);

  // Fetch profiles from backend when search changes
  useEffect(() => {
    const searchProfiles = async () => {
      if (searchProfilesDebounced) {
        setIsSearchingProfiles(true);
        try {
          const response: ProfileListResponse = await apiClient.getProfiles({
            search: searchProfilesDebounced,
            page_size: 50,
          });
          setFilteredProfiles(response.results);
        } catch (err: any) {
          console.error('Error searching profiles:', err);
          setFilteredProfiles([]);
        } finally {
          setIsSearchingProfiles(false);
        }
      } else {
        // Show all profiles when search is empty
        setFilteredProfiles(profiles.slice(0, 50));
      }
    };

    searchProfiles();
  }, [searchProfilesDebounced, profiles]);

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

  const handleOwnerSelect = (profile: BackendProfileListItem) => {
    setFormData({
      ...formData,
      firm_owner_profile_id: profile.id,
      firm_owner_profile_name: profile.full_name || profile.username,
      owner_search: profile.full_name || profile.username,
    });
    setShowOwnerDropdown(false);
  };

  // Set up callback to update form data when profile is created
  useEffect(() => {
    if (onProfileCreated) {
      // Pass a callback function that updates form data
      onProfileCreated((createdProfile: CurrentUserProfile) => {
        // Add null check to prevent runtime errors
        if (!createdProfile) {
          console.error('Created profile is null or undefined');
          return;
        }
        
        const firstName = createdProfile.first_name || '';
        const lastName = createdProfile.last_name || '';
        const fullName = (firstName + (lastName ? ` ${lastName}` : '')).trim();
        
        setFormData((prev) => ({
          ...prev,
          firm_owner_profile_id: createdProfile.id,
          firm_owner_profile_name: fullName || createdProfile.username || '',
          owner_search: fullName || createdProfile.username || '',
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filtered profiles when profiles list changes
  useEffect(() => {
    if (!formData.owner_search) {
      setFilteredProfiles(profiles.slice(0, 50));
    }
  }, [profiles, formData.owner_search]);

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
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                      if (profiles.length > 0 || formData.owner_search) {
                        setShowOwnerDropdown(true);
                      }
                    }}
                    placeholder="Search by name, email, or phone number..."
                    disabled={isSaving}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {showOwnerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingProfiles ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Searching...
                        </div>
                      ) : filteredProfiles.length > 0 ? (
                        filteredProfiles.map((profile) => {
                          const displayName = profile.full_name || profile.username;
                          return (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() => handleOwnerSelect(profile)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                            >
                              <div className="font-medium">{displayName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {profile.email || 'N/A'} • {profile.phone_number || 'N/A'}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          {formData.owner_search ? 'No profiles found' : 'Start typing to search...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  disabled={isSaving}
                  className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create New Profile"
                >
                  <Plus className="h-5 w-5" />
                </button>
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

// Profile Create Modal Component
function ProfileCreateModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: ProfileCreateData) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<ProfileCreateData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    country: "",
    aadhar_number: "",
    pan_number: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [aadharCard, setAadharCard] = useState<File | null>(null);
  const [panCard, setPanCard] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        date_of_birth: "",
        gender: "",
        address: "",
        city: "",
        state: "",
        pin_code: "",
        country: "",
        aadhar_number: "",
        pan_number: "",
      });
      setPhoto(null);
      setAadharCard(null);
      setPanCard(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.email) {
      showError("Error", "First name and email are required");
      return;
    }

    const profileData: ProfileCreateData = {
      ...formData,
      photo: photo || undefined,
      aadhar_card: aadharCard || undefined,
      pan_card: panCard || undefined,
    };

    await onSave(profileData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold">Create New Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b dark:border-gray-800 pb-2">User Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Last Name
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b dark:border-gray-800 pb-2">Profile Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Date of Birth
                </label>
                <DatePicker
                  value={formData.date_of_birth || undefined}
                  onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                  placeholder="Select date of birth"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Photo
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                disabled={isSaving}
              />
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Pin Code
                </label>
                <Input
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Country
              </label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Identity Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b dark:border-gray-800 pb-2">Identity Documents</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Aadhar Number
                </label>
                <Input
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
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
                  maxLength={10}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Aadhar Card
                </label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setAadharCard(e.target.files?.[0] || null)}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  PAN Card
                </label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setPanCard(e.target.files?.[0] || null)}
                  disabled={isSaving}
                />
              </div>
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
                  Creating...
                </>
              ) : (
                "Create Profile"
              )}
            </Button>
          </div>
        </form>
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

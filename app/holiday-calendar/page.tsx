"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Calendar, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { apiClient, HolidayCalendarStatisticsResponse, BackendHolidayCalendarListItem, HolidayCalendarDetail, HolidayCalendarCreateData } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DatePicker } from "@/components/ui/date-picker";

/**
 * Map backend holiday type to frontend type
 */
function mapBackendTypeToFrontend(backendType: 'National' | 'Festival' | 'Company'): 'Public' | 'Optional' | 'Restricted' {
  switch (backendType) {
    case 'National':
      return 'Public';
    case 'Festival':
      return 'Optional';
    case 'Company':
      return 'Restricted';
    default:
      return 'Public';
  }
}

/**
 * Map frontend type to backend type
 */
function mapFrontendTypeToBackend(frontendType: 'Public' | 'Optional' | 'Restricted'): 'National' | 'Festival' | 'Company' {
  switch (frontendType) {
    case 'Public':
      return 'National';
    case 'Optional':
      return 'Festival';
    case 'Restricted':
      return 'Company';
    default:
      return 'National';
  }
}

/**
 * Map backend holiday list item to frontend Holiday type
 */
function mapBackendHolidayListItemToFrontend(backendHoliday: BackendHolidayCalendarListItem): {
  id: number;
  name: string;
  date: string;
  type: 'Public' | 'Optional' | 'Restricted';
  created_at: string;
} {
  return {
    id: backendHoliday.id,
    name: backendHoliday.name,
    date: backendHoliday.date,
    type: mapBackendTypeToFrontend(backendHoliday.type),
    created_at: backendHoliday.created_at,
  };
}

function HolidayCalendarPageContent() {
  const [holidays, setHolidays] = useState<BackendHolidayCalendarListItem[]>([]);
  const [statistics, setStatistics] = useState<HolidayCalendarStatisticsResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<BackendHolidayCalendarListItem | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  /**
   * Fetch holiday calendar statistics from backend
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getHolidayCalendarStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching holiday calendar statistics:', err);
      // Don't show error for statistics, just log it
    }
  }, []);

  /**
   * Fetch holidays from backend
   */
  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        year: selectedYear,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // Map frontend filter type to backend type
      if (filterType !== 'all') {
        const backendType = mapFrontendTypeToBackend(filterType as 'Public' | 'Optional' | 'Restricted');
        params.type = backendType;
      }

      const response = await apiClient.getHolidays(params);
      setHolidays(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching holidays:', err);
      setError(err.message || 'Failed to fetch holidays');
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterType, currentPage, selectedYear]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this holiday");
    if (confirmed) {
      try {
        await apiClient.deleteHoliday(id);
        fetchHolidays();
        fetchStatistics(); // Refresh statistics
        showSuccess("Success", "Holiday deleted successfully");
      } catch (err: any) {
        showError("Error", err.message || "Failed to delete holiday");
      }
    }
  };

  const handleSave = async (holidayData: HolidayCalendarCreateData & { id?: number }) => {
    setIsSaving(true);
    try {
      if (holidayData.id) {
        // Update existing holiday
        const { id, ...updateData } = holidayData;
        await apiClient.updateHoliday(id, updateData);
        showSuccess("Success", "Holiday updated successfully");
      } else {
        // Create new holiday
        await apiClient.createHoliday(holidayData);
        showSuccess("Success", "Holiday created successfully");
      }

      fetchHolidays();
      fetchStatistics(); // Refresh statistics
      setShowModal(false);
      setSelectedHoliday(null);
    } catch (err: any) {
      showError("Error", err.message || "Failed to save holiday");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Public":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Optional":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Restricted":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Holiday Calendar" breadcrumbs={["Home", "Settings", "Holiday Calendar"]}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Holiday Calendar</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage holidays and leave calendar</p>
          </div>
          <Button
            onClick={() => {
              setSelectedHoliday(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>

        {/* Statistics Tiles */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Holidays</div>
            <div className="text-2xl font-bold mt-1">
              {statistics ? statistics.total_holidays : (
                <Loader2 className="h-5 w-5 animate-spin inline" />
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Public Holidays</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {statistics ? statistics.public_holidays : (
                <Loader2 className="h-5 w-5 animate-spin inline" />
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Optional Holidays</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {statistics ? statistics.optional_holidays : (
                <Loader2 className="h-5 w-5 animate-spin inline" />
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search holidays..."
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
            <option value="Public">Public</option>
            <option value="Optional">Optional</option>
            <option value="Restricted">Restricted</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading holidays...</span>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">No holidays found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filterType === "all"
                ? "Get started by adding your first holiday"
                : `No ${filterType} holidays found`}
            </p>
            {filterType === "all" && (
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Holiday Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {holidays.map((holiday) => {
                    const mappedHoliday = mapBackendHolidayListItemToFrontend(holiday);
                    return (
                      <tr key={holiday.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {format(new Date(mappedHoliday.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{mappedHoliday.name}</td>
                        <td className="px-6 py-4">
                          <Badge className={getTypeColor(mappedHoliday.type)}>
                            {mappedHoliday.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedHoliday(holiday);
                                setShowModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(holiday.id)}
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

            {holidays.length > 0 && totalPages > 1 && (
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

      {showModal && (
        <HolidayModal
          holiday={selectedHoliday}
          onClose={() => {
            setShowModal(false);
            setSelectedHoliday(null);
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

function HolidayModal({
  holiday,
  onClose,
  onSave,
  isSaving,
}: {
  holiday: BackendHolidayCalendarListItem | null;
  onClose: () => void;
  onSave: (hol: HolidayCalendarCreateData & { id?: number }) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: holiday?.name || "",
    date: holiday?.date || format(new Date(), "yyyy-MM-dd"),
    type: holiday ? mapBackendTypeToFrontend(holiday.type) : ("Public" as 'Public' | 'Optional' | 'Restricted'),
  });

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name,
        date: holiday.date,
        type: mapBackendTypeToFrontend(holiday.type),
      });
    } else {
      setFormData({
        name: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "Public",
      });
    }
  }, [holiday]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      showError("Validation Error", "Holiday name is required");
      return;
    }
    
    if (!formData.date) {
      showError("Validation Error", "Date is required");
      return;
    }
    
    const holidayData: HolidayCalendarCreateData & { id?: number } = {
      id: holiday?.id,
      name: formData.name,
      date: formData.date,
      type: mapFrontendTypeToBackend(formData.type),
    };

    await onSave(holidayData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {holiday ? "Edit Holiday" : "Add Holiday"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.date}
              onChange={(value) => {
                if (value) {
                  setFormData({ ...formData, date: value });
                }
              }}
              placeholder="Select holiday date"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Public' | 'Optional' | 'Restricted' })}
              disabled={isSaving}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Public">Public</option>
              <option value="Optional">Optional</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {holiday ? "Updating..." : "Creating..."}
                </>
              ) : (
                holiday ? "Update Holiday" : "Add Holiday"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HolidayCalendarPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Holiday Calendar"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <HolidayCalendarPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

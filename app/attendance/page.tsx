"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Check, X as XIcon, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, Edit2, Loader2, Inbox, Trash2, ChevronDown, Eye, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { showConfirm, showSuccess, showDeleteConfirm, showAlert } from "@/lib/sweetalert";
import { apiClient, AttendanceStatisticsResponse, BackendAttendanceListItem, AttendanceDetail, AttendanceCreateData, BackendEmployeeListItem, EmployeeListResponse, EmployeeDetail } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomDropdown } from "@/components/ui/custom-dropdown";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type AttendanceRecord = {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  date: string;
  status: "Present" | "Absent" | "Leave" | "Half Day";
  approval_status: ApprovalStatus;
  check_in?: string;
  check_out?: string;
  check_in_selfie_url?: string | null;
  notes?: string;
  rejection_reason?: string;
};

type Employee = {
  id: number;
  name: string;
  employee_id: string;
  status: "Active" | "On Leave" | "Terminated";
};

/**
 * Map backend attendance list item to frontend AttendanceRecord type
 */
function mapBackendAttendanceListItemToFrontend(backendAttendance: BackendAttendanceListItem): AttendanceRecord {
  return {
    id: backendAttendance.id,
    employee_id: backendAttendance.employee,
    employee_name: backendAttendance.employee_name || '',
    employee_code: backendAttendance.employee_code || '',
    date: backendAttendance.attendance_date,
    status: backendAttendance.attendance_status === 'Half-Day' ? 'Half Day' : backendAttendance.attendance_status as "Present" | "Absent" | "Leave" | "Half Day",
    approval_status: backendAttendance.approval_status as ApprovalStatus,
    check_in: backendAttendance.check_in_time ? format(parseISO(backendAttendance.check_in_time), 'h:mm a') : undefined,
    check_out: backendAttendance.check_out_time ? format(parseISO(backendAttendance.check_out_time), 'h:mm a') : undefined,
    check_in_selfie_url: backendAttendance.check_in_selfie_url || null,
    notes: backendAttendance.notes || undefined,
  };
}

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatisticsResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "All">("All");
  const [showApprovalDropdown, setShowApprovalDropdown] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkPresentModal, setShowBulkPresentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [attendanceDetail, setAttendanceDetail] = useState<AttendanceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedAttendanceRecords, setSelectedAttendanceRecords] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  /**
   * Fetch statistics from backend
   */
  const fetchStatistics = useCallback(async (date?: string) => {
    try {
      const stats = await apiClient.getAttendanceStatistics(date);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching attendance statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, []);

  /**
   * Fetch employees from backend
   */
  const fetchEmployees = useCallback(async () => {
    try {
      const response: EmployeeListResponse = await apiClient.getEmployees({ page: 1 });
      const mappedEmployees: Employee[] = response.results.map(emp => ({
        id: emp.id,
        name: emp.full_name || '',
        employee_id: emp.employee_code || '',
        status: emp.availability_status === 'Present' ? 'Active' : 
                emp.availability_status === 'Absent' ? 'On Leave' : 'Active',
      }));
      setEmployees(mappedEmployees);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    }
  }, []);

  /**
   * Fetch attendance records from backend
   */
  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
        page: currentPage,
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      if (approvalFilter !== "All") {
        params.approval_status = approvalFilter;
      }

      const response = await apiClient.getAttendanceRecords(params);
      const mappedAttendance = response.results.map(mapBackendAttendanceListItemToFrontend);
      setAttendance(mappedAttendance);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching attendance records:', err);
      setError(err.message || 'Failed to fetch attendance records');
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, debouncedSearch, selectedDate, approvalFilter, currentPage]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.approval-filter-dropdown-container')) {
        setShowApprovalDropdown(false);
      }
    };

    if (showApprovalDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showApprovalDropdown]);

  const approvalFilterOptions = ['All', 'Pending', 'Approved', 'Rejected'];

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch statistics when selected date changes (including initial mount)
  useEffect(() => {
    fetchStatistics(selectedDate || undefined);
  }, [selectedDate, fetchStatistics]);

  // Fetch attendance records when filters change
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle action=new URL parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setEditingRecord(null);
      setShowMarkModal(true);
    }
  }, [searchParams]);

  const activeEmployees = useMemo(() => {
    return employees.filter(emp => emp.status === "Active");
  }, [employees]);

  const stats = useMemo(() => {
    if (!statistics) {
      return {
        workingDays: 26,
        present: 0,
        absent: 0,
        leave: 0,
        pending: 0,
      };
    }
    
    return {
      workingDays: statistics.total_working_days,
      present: statistics.total_employees_present,
      absent: statistics.total_employees_absent,
      leave: 0, // Not available in statistics
      pending: statistics.total_pending_approvals,
    };
  }, [statistics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Leave":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Half Day":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleBulkApprove = async () => {
    if (selectedAttendanceRecords.length === 0) {
      showAlert("No Selection", "Please select at least one attendance record to approve.", "info");
      return;
    }

    const confirmed = await showConfirm(
      "Bulk Approve Attendance",
      `Are you sure you want to approve ${selectedAttendanceRecords.length} attendance record(s)?`
    );

    if (!confirmed) return;

    try {
      await apiClient.bulkApproveAttendance({
        attendance_ids: selectedAttendanceRecords,
        approval_status: "Approved",
      });
      await showSuccess(`Successfully approved ${selectedAttendanceRecords.length} attendance record(s)`);
      setSelectedAttendanceRecords([]);
      setSelectedEmployees([]);
      fetchAttendance();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to bulk approve attendance");
    }
  };

  const handleApprove = async (record: AttendanceRecord) => {
    const confirmed = await showConfirm(
      "Approve Attendance",
      `Approve attendance for ${record.employee_name} on ${format(new Date(record.date), "dd MMM yyyy")}?`,
      "Approve",
      "Cancel"
    );

    if (!confirmed) return;

    try {
      await apiClient.bulkApproveAttendance({
        attendance_ids: [record.id],
        approval_status: "Approved",
      });
      await showSuccess("Attendance approved successfully");
      fetchAttendance();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to approve attendance");
    }
  };

  const handleReject = async (record: AttendanceRecord) => {
    const { default: Swal } = await import("sweetalert2");
    
    const result = await Swal.fire({
      title: "Reject Attendance",
      text: "Enter rejection reason:",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Reason for rejection",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a reason";
        }
        return null;
      },
      background: "#1f2937",
      color: "#f3f4f6",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await apiClient.bulkApproveAttendance({
        attendance_ids: [record.id],
        approval_status: "Rejected",
        rejection_reason: result.value as string,
      });
      await showSuccess("Attendance rejected");
      fetchAttendance();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to reject attendance");
    }
  };

  const getApprovalStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getApprovalIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4" />;
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setShowMarkModal(true);
  };

  const handleDelete = async (record: AttendanceRecord) => {
    const confirmed = await showConfirm(
      "Delete Attendance",
      `Are you sure you want to delete attendance for ${record.employee_name} on ${format(new Date(record.date), "dd MMM yyyy")}? This action cannot be undone.`,
      "Yes, delete it",
      "Cancel"
    );

    if (!confirmed) return;

    try {
      await apiClient.deleteAttendance(record.id);
      await showSuccess("Attendance deleted successfully");
      fetchAttendance();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to delete attendance");
    }
  };

  const handleViewDetails = async (attendanceId: number) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const detail = await apiClient.getAttendanceRecord(attendanceId);
      setAttendanceDetail(detail);
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to fetch attendance details");
      setShowDetailModal(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveAttendance = async (record: AttendanceRecord) => {
    setIsSaving(true);
    try {
      const attendanceData: AttendanceCreateData = {
        employee: record.employee_id,
        attendance_date: record.date,
        attendance_status: record.status === "Half Day" ? "Half-Day" : record.status,
        check_in_time: record.check_in ? `${record.date} ${record.check_in}:00` : undefined,
        check_out_time: record.check_out ? `${record.date} ${record.check_out}:00` : undefined,
        notes: record.notes,
      };

      if (editingRecord) {
        await apiClient.updateAttendance(editingRecord.id, attendanceData);
        await showSuccess("Attendance updated successfully");
      } else {
        await apiClient.createAttendance(attendanceData);
        await showSuccess("Attendance marked successfully");
      }
      
      setShowMarkModal(false);
      setEditingRecord(null);
      fetchAttendance();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Attendance" breadcrumbs={["Home", "People", "Attendance"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Attendance Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Track daily attendance and approvals for employees</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => { setEditingRecord(null); setShowMarkModal(true); }}>
              <Calendar className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Working Days (Monthly)</div>
            <div className="text-2xl font-bold mt-1 dark:text-white">{stats.workingDays}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Employees Present</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.present}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.absent}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">On Leave</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.leave}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentMonth(subMonths(currentMonth, 1));
                setCurrentPage(1);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentMonth(addMonths(currentMonth, 1));
                setCurrentPage(1);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-gray-300">Date:</label>
              <DatePicker
                value={selectedDate || undefined}
                onChange={(dateString) => {
                  setSelectedDate(dateString || "");
                }}
                placeholder="Select date"
              />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="search"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <div className="relative approval-filter-dropdown-container">
              <button
                type="button"
                onClick={() => setShowApprovalDropdown(!showApprovalDropdown)}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left dark:text-gray-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between min-w-[140px]"
              >
                <span>{approvalFilter === "All" ? "All Approvals" : approvalFilter}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showApprovalDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {approvalFilterOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setApprovalFilter(status as ApprovalStatus | "All");
                        setShowApprovalDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {status === "All" ? "All Approvals" : status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {selectedAttendanceRecords.length > 0 && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm font-medium dark:text-sky-200">
              {selectedAttendanceRecords.length} employee{selectedAttendanceRecords.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedEmployees([]);
                  setSelectedAttendanceRecords([]);
                }}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={handleBulkApprove}
              >
                <Check className="h-4 w-4 mr-2" />
                Bulk Approve
              </Button>
            </div>
          </div>
        )}

        {viewMode === "list" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedAttendanceRecords.length > 0 && selectedAttendanceRecords.length === attendance.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allRecordIds = attendance.map(record => record.id);
                            setSelectedAttendanceRecords(allRecordIds);
                            // Also update selectedEmployees for backward compatibility
                            const uniqueEmployeeIds = [...new Set(attendance.map(record => record.employee_id))];
                            setSelectedEmployees(uniqueEmployeeIds);
                          } else {
                            setSelectedAttendanceRecords([]);
                            setSelectedEmployees([]);
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Selfie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Approval Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading attendance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : attendance.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or mark attendance for employees</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record) => {
                      const employee = activeEmployees.find(emp => emp.id === record.employee_id);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            {employee && (
                              <input
                                type="checkbox"
                                checked={selectedAttendanceRecords.includes(record.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAttendanceRecords(prev => [...prev, record.id]);
                                    // Also update selectedEmployees for backward compatibility
                                    if (!selectedEmployees.includes(employee.id)) {
                                      setSelectedEmployees(prev => [...prev, employee.id]);
                                    }
                                  } else {
                                    setSelectedAttendanceRecords(prev => prev.filter(id => id !== record.id));
                                    // Check if there are any other records for this employee selected
                                    const otherRecordsForEmployee = attendance.filter(
                                      r => r.employee_id === employee.id && r.id !== record.id
                                    );
                                    const hasOtherSelected = otherRecordsForEmployee.some(
                                      r => selectedAttendanceRecords.includes(r.id)
                                    );
                                    if (!hasOtherSelected) {
                                      setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                                    }
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {record.check_in_selfie_url ? (
                              <div className="relative inline-block group">
                                <img
                                  src={record.check_in_selfie_url}
                                  alt="Punch in selfie"
                                  className="h-12 w-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                                />
                                {/* Eye Icon - Shows on Hover */}
                                <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setFullSizeImage(record.check_in_selfie_url || null);
                                     }}>
                                  <Eye className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium dark:text-gray-200">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </td>
                          <td className="px-6 py-4 text-sm dark:text-gray-300">{record.employee_name}</td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {record.check_in || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {record.check_out || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {record.notes || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <Badge className={`inline-flex items-center gap-1 ${getApprovalStatusColor(record.approval_status)}`}>
                              {getApprovalIcon(record.approval_status)}
                              {record.approval_status}
                            </Badge>
                          </div>
                          {record.rejection_reason && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Reason: {record.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {record.approval_status === "Pending" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(record)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(record)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Reject"
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(record.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
                  {day}
                </div>
              ))}
              {monthDays.map((day, idx) => {
                const dayAttendance = attendance.filter(r => isSameDay(new Date(r.date), day));
                const presentCount = dayAttendance.filter(r => r.status === "Present").length;
                const absentCount = dayAttendance.filter(r => r.status === "Absent").length;
                const leaveCount = dayAttendance.filter(r => r.status === "Leave").length;

                return (
                  <div
                    key={idx}
                    className="border dark:border-gray-700 rounded-lg p-2 min-h-[80px] hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="text-sm font-medium mb-1 dark:text-gray-200">{format(day, "d")}</div>
                    {dayAttendance.length > 0 && (
                      <div className="space-y-1 text-xs">
                        {presentCount > 0 && (
                          <div className="text-green-600">✓ {presentCount}</div>
                        )}
                        {absentCount > 0 && (
                          <div className="text-red-600">✗ {absentCount}</div>
                        )}
                        {leaveCount > 0 && (
                          <div className="text-blue-600">L {leaveCount}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showMarkModal && (
        <MarkAttendanceModal
          employees={activeEmployees}
          editingRecord={editingRecord}
          isSaving={isSaving}
          onClose={() => {
            setShowMarkModal(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveAttendance}
        />
      )}

      {showExportModal && (
        <ExportReportModal
          onClose={() => setShowExportModal(false)}
          attendance={attendance}
        />
      )}

      {showBulkPresentModal && (
        <BulkMarkPresentModal
          employees={activeEmployees.filter(emp => selectedEmployees.includes(emp.id))}
          isSaving={isSaving}
          onClose={() => setShowBulkPresentModal(false)}
          onSave={async (date, checkIn, checkOut) => {
            setIsSaving(true);
            try {
              const promises = selectedEmployees.map(async (empId) => {
                const employee = activeEmployees.find(e => e.id === empId);
                if (!employee) return null;

                const attendanceData: AttendanceCreateData = {
                  employee: empId,
                  attendance_date: date,
                  attendance_status: "Present",
                  check_in_time: checkIn ? `${date} ${checkIn}:00` : undefined,
                  check_out_time: checkOut ? `${date} ${checkOut}:00` : undefined,
                };

                try {
                  await apiClient.createAttendance(attendanceData);
                  return true;
                } catch (err) {
                  console.error(`Failed to mark attendance for employee ${empId}:`, err);
                  return false;
                }
              });

              const results = await Promise.all(promises);
              const successCount = results.filter(r => r === true).length;
              
              await showSuccess(`Marked ${successCount} employee${successCount > 1 ? 's' : ''} as present`);
              setSelectedEmployees([]);
              setShowBulkPresentModal(false);
              fetchAttendance();
              fetchStatistics();
            } catch (err: any) {
              await showAlert("Error", err.message || "Failed to mark attendance");
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      {attendance.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showDetailModal && (
        <AttendanceDetailModal
          detail={attendanceDetail}
          isLoading={isLoadingDetail}
          onClose={() => {
            setShowDetailModal(false);
            setAttendanceDetail(null);
          }}
        />
      )}

      {/* Full Size Image Modal */}
      {fullSizeImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullSizeImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setFullSizeImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              title="Close"
            >
              <XIcon className="h-8 w-8" />
            </button>
            <img
              src={fullSizeImage}
              alt="Full size selfie"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function AttendanceDetailModal({
  detail,
  isLoading,
  onClose,
}: {
  detail: AttendanceDetail | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const [employeePhoto, setEmployeePhoto] = useState<string | null>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [checkInAddress, setCheckInAddress] = useState<string | null>(null);
  const [checkOutAddress, setCheckOutAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    const fetchEmployeePhoto = async () => {
      if (detail?.employee) {
        try {
          const employee = await apiClient.getEmployee(detail.employee);
          setEmployeePhoto(employee.photo_url || null);
        } catch (err) {
          console.error('Failed to fetch employee photo:', err);
        }
      }
    };

    if (detail) {
      fetchEmployeePhoto();
    }
  }, [detail]);

  // Reverse geocoding to convert coordinates to human-readable address
  useEffect(() => {
    const reverseGeocode = async (lat: string | null, lng: string | null): Promise<string | null> => {
      if (!lat || !lng) return null;

      try {
        // Using OpenStreetMap Nominatim (free, no API key required)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Electrocom-ERP/1.0' // Required by Nominatim
            }
          }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.address) {
          const address = data.address;
          const parts: string[] = [];

          // Build address in a readable format
          if (address.road || address.street) {
            parts.push(address.road || address.street);
          }
          if (address.house_number) {
            parts.push(address.house_number);
          }
          if (address.suburb || address.neighbourhood) {
            parts.push(address.suburb || address.neighbourhood);
          }
          if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
          }
          if (address.state) {
            parts.push(address.state);
          }
          if (address.postcode) {
            parts.push(address.postcode);
          }
          if (address.country) {
            parts.push(address.country);
          }

          return parts.length > 0 ? parts.join(', ') : data.display_name || null;
        }

        return data.display_name || null;
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        return null;
      }
    };

    const fetchAddresses = async () => {
      if (!detail) return;

      setIsLoadingAddress(true);
      try {
        // Fetch check-in address
        if (detail.check_in_location_latitude && detail.check_in_location_longitude) {
          const address = await reverseGeocode(
            detail.check_in_location_latitude,
            detail.check_in_location_longitude
          );
          setCheckInAddress(address);
        }

        // Fetch check-out address
        if (detail.check_out_location_latitude && detail.check_out_location_longitude) {
          const address = await reverseGeocode(
            detail.check_out_location_latitude,
            detail.check_out_location_longitude
          );
          setCheckOutAddress(address);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    if (detail) {
      fetchAddresses();
    } else {
      setCheckInAddress(null);
      setCheckOutAddress(null);
    }
  }, [detail]);

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "-";
    try {
      const date = parseISO(dateTimeString);
      return format(date, "dd MMM yyyy, h:mm a");
    } catch {
      return dateTimeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Leave":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Half-Day":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const openGoogleMaps = (lat: string | null, lng: string | null, location: string | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else if (location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Attendance Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">Loading details...</span>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Employee Info Section */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Employee Information</h3>
                <div className="flex items-start gap-4">
                  {employeePhoto ? (
                    <img
                      src={employeePhoto}
                      alt={detail.employee_name}
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                        {detail.employee_name?.charAt(0).toUpperCase() || 'E'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold dark:text-white">{detail.employee_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Employee Code: {detail.employee_code}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Date and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance Date</label>
                  <p className="mt-1 text-sm dark:text-gray-200">{formatDate(detail.attendance_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(detail.attendance_status)}>
                      {detail.attendance_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Check In Section */}
              {detail.check_in_time && (
                <div className="border-t dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Check In Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Check In Time</label>
                        <p className="mt-1 text-sm dark:text-gray-200">{formatDateTime(detail.check_in_time)}</p>
                      </div>
                      {detail.check_in_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                          <div className="mt-1 flex items-center gap-2">
                            {isLoadingAddress ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                <p className="text-sm text-gray-400 dark:text-gray-500">Loading address...</p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm dark:text-gray-200">
                                  {checkInAddress || detail.check_in_location}
                                </p>
                                {(detail.check_in_location_latitude || detail.check_in_location_longitude) && (
                                  <button
                                    onClick={() => openGoogleMaps(
                                      detail.check_in_location_latitude,
                                      detail.check_in_location_longitude,
                                      detail.check_in_location
                                    )}
                                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                                    title="View on Google Maps"
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {detail.check_in_selfie_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Check In Selfie</label>
                        <div 
                          className="relative inline-block cursor-pointer group"
                          onClick={() => setFullSizeImage(detail.check_in_selfie_url || null)}
                        >
                          <img
                            src={detail.check_in_selfie_url}
                            alt="Check in selfie"
                            className="h-48 w-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600 hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white text-sm opacity-0 group-hover:opacity-100">Click to view full size</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Check Out Section */}
              {detail.check_out_time && (
                <div className="border-t dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Check Out Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Check Out Time</label>
                        <p className="mt-1 text-sm dark:text-gray-200">{formatDateTime(detail.check_out_time)}</p>
                      </div>
                      {detail.check_out_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                          <div className="mt-1 flex items-center gap-2">
                            {isLoadingAddress ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                <p className="text-sm text-gray-400 dark:text-gray-500">Loading address...</p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm dark:text-gray-200">
                                  {checkOutAddress || detail.check_out_location}
                                </p>
                                {(detail.check_out_location_latitude || detail.check_out_location_longitude) && (
                                  <button
                                    onClick={() => openGoogleMaps(
                                      detail.check_out_location_latitude,
                                      detail.check_out_location_longitude,
                                      detail.check_out_location
                                    )}
                                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                                    title="View on Google Maps"
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {detail.check_out_selfie_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Check Out Selfie</label>
                        <div 
                          className="relative inline-block cursor-pointer group"
                          onClick={() => setFullSizeImage(detail.check_out_selfie_url || null)}
                        >
                          <img
                            src={detail.check_out_selfie_url}
                            alt="Check out selfie"
                            className="h-48 w-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600 hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white text-sm opacity-0 group-hover:opacity-100">Click to view full size</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              <div className="border-t dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Status</label>
                    <div className="mt-1">
                      <Badge className={getApprovalStatusColor(detail.approval_status)}>
                        {detail.approval_status}
                      </Badge>
                    </div>
                  </div>
                  {detail.rejection_reason && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rejection Reason</label>
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{detail.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {detail.notes && (
                <div className="border-t dark:border-gray-700 pt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <p className="mt-1 text-sm dark:text-gray-200 whitespace-pre-wrap">{detail.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Created:</span> {formatDateTime(detail.created_at)}
                  </div>
                  {detail.updated_at && (
                    <div>
                      <span className="font-medium">Last Updated:</span> {formatDateTime(detail.updated_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No details available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Full Size Image Modal */}
      {fullSizeImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullSizeImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setFullSizeImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              title="Close"
            >
              <XIcon className="h-8 w-8" />
            </button>
            <img
              src={fullSizeImage}
              alt="Full size selfie"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Attendance" breadcrumbs={["Home", "People", "Attendance"]}><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <AttendancePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function MarkAttendanceModal({ 
  employees, 
  editingRecord,
  isSaving,
  onClose, 
  onSave 
}: {
  employees: Employee[];
  editingRecord: AttendanceRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    employee_id: editingRecord?.employee_id || 0,
    employee_name: editingRecord?.employee_name || "",
    employee_search: "",
    date: editingRecord?.date || format(new Date(), "yyyy-MM-dd"),
    status: editingRecord?.status === "Half Day" ? "Half-Day" : (editingRecord?.status || "Present") as "Present" | "Absent" | "Half-Day" | "Leave",
    check_in: editingRecord?.check_in || "",
    check_out: editingRecord?.check_out || "",
  });
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(formData.employee_search.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(formData.employee_search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    if (showEmployeeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmployeeDropdown]);

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData({
      ...formData,
      employee_id: employee.id,
      employee_name: employee.name,
      employee_search: employee.name,
    });
    setShowEmployeeDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      await import("@/lib/sweetalert").then(({ showAlert }) => 
        showAlert("Validation Error", "Please select an employee")
      );
      return;
    }

    const newRecord: AttendanceRecord = {
      id: editingRecord?.id || Date.now(),
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      employee_code: "",
      date: formData.date,
      status: formData.status === "Half-Day" ? "Half Day" : formData.status,
      approval_status: editingRecord ? editingRecord.approval_status : "Pending",
      check_in: formData.check_in || undefined,
      check_out: formData.check_out || undefined,
    };
    await onSave(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">
            {editingRecord ? "Edit Attendance" : "Mark Attendance"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee - Searchable Dropdown */}
          <div className="relative employee-dropdown-container">
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Employee <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.employee_search || formData.employee_name}
                onChange={(e) => {
                  setFormData({ ...formData, employee_search: e.target.value, employee_id: 0, employee_name: "" });
                  setShowEmployeeDropdown(true);
                }}
                onFocus={() => {
                  if (employees.length > 0) {
                    setShowEmployeeDropdown(true);
                  }
                }}
                placeholder="Search and select employee"
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {showEmployeeDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleEmployeeSelect(employee)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {employee.name} ({employee.employee_id})
                    </button>
                  ))}
                </div>
              )}
              {showEmployeeDropdown && filteredEmployees.length === 0 && formData.employee_search && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                  No employees found
                </div>
              )}
            </div>
            {!editingRecord && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                If a record exists for this employee on the selected date, it will be replaced.
              </p>
            )}
          </div>

          {/* Attendance Date */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Attendance Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              placeholder="Select attendance date"
              required
              disabled={isSaving}
            />
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Attendance Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as "Present" | "Absent" | "Half-Day" | "Leave" })}
              options={[
                { value: "Present", label: "Present" },
                { value: "Absent", label: "Absent" },
                { value: "Half-Day", label: "Half-Day" },
                { value: "Leave", label: "Leave" },
              ]}
              placeholder="Select attendance status"
              required
              disabled={isSaving}
            />
          </div>

          {/* Check In and Check Out Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Check In Time
              </label>
              <Input
                type="time"
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Check Out Time
              </label>
              <Input
                type="time"
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingRecord ? "Updating..." : "Marking..."}
                </>
              ) : (
                editingRecord ? "Update Attendance" : "Mark Attendance"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExportReportModal({
  onClose,
  attendance,
}: {
  onClose: () => void;
  attendance: AttendanceRecord[];
}) {
  const currentYear = new Date().getFullYear();
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(currentYear);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  const handleExport = () => {
    const filteredRecords = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === exportMonth && recordDate.getFullYear() === exportYear;
    });

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      ["Date", "Employee", "Status", "Check In", "Check Out", "Notes", "Approval Status", "Approved By"].join(","),
      ...filteredRecords.map(record => [
        record.date,
        escapeCSV(record.employee_name),
        record.status,
        record.check_in || "",
        record.check_out || "",
        escapeCSV(record.notes || ""),
        record.approval_status,
        "" // approved_by not available in AttendanceRecord
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${exportYear}-${String(exportMonth).padStart(2, "0")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess("Report exported successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Export Attendance Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">Month</label>
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">Year</label>
            <select
              value={exportYear}
              onChange={(e) => setExportYear(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkMarkPresentModal({
  employees,
  isSaving,
  onClose,
  onSave,
}: {
  employees: Employee[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (date: string, checkIn: string, checkOut: string) => Promise<void>;
}) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(date, checkIn, checkOut);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Mark Employees as Present</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Selected Employees
            </label>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {employees.map((emp) => (
                  <div key={emp.id} className="text-sm dark:text-gray-300">
                    • {emp.name} ({emp.employee_id})
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {employees.length} employee{employees.length > 1 ? 's' : ''} will be marked as present
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
              >
                Today
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Check In (Optional)</label>
              <Input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Check Out (Optional)</label>
              <Input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> All attendance records will be created with &quot;Pending&quot; approval status and need to be approved by the owner.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Present
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

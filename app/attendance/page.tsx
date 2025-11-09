"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Check, X as XIcon, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, Edit2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { showConfirm, showSuccess } from "@/lib/sweetalert";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type AttendanceRecord = {
  id: number;
  employee_id: number;
  employee_name: string;
  date: string;
  status: "Present" | "Absent" | "Leave" | "Half Day";
  approval_status: ApprovalStatus;
  check_in?: string;
  check_out?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
};

type Employee = {
  id: number;
  name: string;
  employee_id: string;
  status: "Active" | "On Leave" | "Terminated";
};

const mockEmployees: Employee[] = [
  { id: 1, name: "Rajesh Kumar", employee_id: "EMP-001", status: "Active" },
  { id: 2, name: "Priya Sharma", employee_id: "EMP-002", status: "Active" },
  { id: 3, name: "Amit Patel", employee_id: "EMP-003", status: "Active" },
  { id: 4, name: "Sunita Verma", employee_id: "EMP-004", status: "Active" },
  { id: 5, name: "Vikram Singh", employee_id: "EMP-005", status: "Active" },
  { id: 6, name: "Neha Gupta", employee_id: "EMP-006", status: "Active" },
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Rajesh Kumar",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "Present",
    approval_status: "Pending",
    check_in: "09:15",
    check_out: "18:30",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Priya Sharma",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "Present",
    approval_status: "Pending",
    check_in: "09:00",
    check_out: "18:00",
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: "Amit Patel",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "Leave",
    approval_status: "Pending",
    notes: "Medical leave",
  },
  {
    id: 4,
    employee_id: 4,
    employee_name: "Sunita Verma",
    date: "2025-11-02",
    status: "Present",
    approval_status: "Approved",
    check_in: "09:00",
    check_out: "18:15",
    approved_by: "Admin",
    approved_at: "2025-11-02T18:30:00Z",
  },
  {
    id: 5,
    employee_id: 5,
    employee_name: "Vikram Singh",
    date: "2025-11-02",
    status: "Half Day",
    approval_status: "Approved",
    check_in: "09:00",
    check_out: "13:00",
    notes: "Personal work",
    approved_by: "Admin",
    approved_at: "2025-11-02T13:30:00Z",
  },
];

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(mockAttendance);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "All">("All");
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkPresentModal, setShowBulkPresentModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [workingDaysPerMonth] = useState(26);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      const matchesMonth = isSameMonth(recordDate, currentMonth);
      const matchesDate = !selectedDate || record.date === selectedDate;
      const matchesSearch = searchQuery === "" || record.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesApproval = approvalFilter === "All" || record.approval_status === approvalFilter;
      return matchesMonth && matchesDate && matchesSearch && matchesApproval;
    });
  }, [attendance, currentMonth, selectedDate, searchQuery, approvalFilter]);

  const activeEmployees = useMemo(() => {
    return mockEmployees.filter(emp => emp.status === "Active");
  }, []);

  const stats = useMemo(() => {
    const monthRecords = attendance.filter(r => isSameMonth(new Date(r.date), currentMonth));
    const uniqueEmployeePresent = new Set(monthRecords.filter(r => r.status === "Present" && r.approval_status === "Approved").map(r => r.employee_id)).size;
    const uniqueEmployeeAbsent = new Set(monthRecords.filter(r => r.status === "Absent").map(r => r.employee_id)).size;
    const uniqueEmployeeLeave = new Set(monthRecords.filter(r => r.status === "Leave" && r.approval_status === "Approved").map(r => r.employee_id)).size;
    
    return {
      workingDays: workingDaysPerMonth,
      present: uniqueEmployeePresent,
      absent: uniqueEmployeeAbsent,
      leave: uniqueEmployeeLeave,
      pending: monthRecords.filter(r => r.approval_status === "Pending").length,
    };
  }, [attendance, currentMonth, workingDaysPerMonth]);

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

  const handleApprove = async (record: AttendanceRecord) => {
    const confirmed = await showConfirm(
      "Approve Attendance",
      `Approve attendance for ${record.employee_name} on ${format(new Date(record.date), "dd MMM yyyy")}?`,
      "Approve",
      "Cancel"
    );

    if (!confirmed) return;

    setAttendance(prev => prev.map(r =>
      r.id === record.id
        ? {
            ...r,
            approval_status: "Approved" as ApprovalStatus,
            approved_by: "Admin",
            approved_at: new Date().toISOString(),
          }
        : r
    ));

    await showSuccess("Attendance approved successfully");
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

    setAttendance(prev => prev.map(r =>
      r.id === record.id
        ? {
            ...r,
            approval_status: "Rejected" as ApprovalStatus,
            approved_by: "Admin",
            approved_at: new Date().toISOString(),
            rejection_reason: result.value as string,
          }
        : r
    ));

    await showSuccess("Attendance rejected");
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

  const handleSaveAttendance = (record: AttendanceRecord) => {
    if (editingRecord) {
      setAttendance(prev => prev.map(r => r.id === editingRecord.id ? record : r));
      showSuccess("Attendance updated successfully");
    } else {
      const existingIndex = attendance.findIndex(
        r => r.employee_id === record.employee_id && r.date === record.date
      );
      
      if (existingIndex >= 0) {
        setAttendance(prev => prev.map((r, idx) => idx === existingIndex ? { ...record, id: r.id } : r));
        showSuccess("Attendance record replaced successfully");
      } else {
        setAttendance(prev => [record, ...prev]);
        showSuccess("Attendance marked successfully");
      }
    }
    setShowMarkModal(false);
    setEditingRecord(null);
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
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-gray-300">Date:</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
              >
                Today
              </Button>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate("")}
                >
                  Clear
                </Button>
              )}
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

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-200"
            >
              <option value="All">All Approvals</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

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

        {selectedEmployees.length > 0 && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm font-medium dark:text-sky-200">
              {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEmployees([])}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkPresentModal(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Present
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
                        checked={selectedEmployees.length > 0 && selectedEmployees.length === activeEmployees.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees(activeEmployees.map(emp => emp.id));
                          } else {
                            setSelectedEmployees([]);
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500"
                      />
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
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const employee = activeEmployees.find(emp => emp.id === record.employee_id);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            {employee && (
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(employee.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEmployees(prev => [...prev, employee.id]);
                                  } else {
                                    setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500"
                              />
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
                            ) : (
                              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                {record.approved_by && `By ${record.approved_by}`}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
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
          onClose={() => setShowBulkPresentModal(false)}
          onSave={(date, checkIn, checkOut) => {
            const newRecords: AttendanceRecord[] = selectedEmployees
              .map(empId => {
                const employee = activeEmployees.find(e => e.id === empId);
                if (!employee) return null;

                const existingIndex = attendance.findIndex(
                  r => r.employee_id === empId && r.date === date
                );

                if (existingIndex >= 0) {
                  return null;
                }

                const record: AttendanceRecord = {
                  id: Date.now() + empId,
                  employee_id: empId,
                  employee_name: employee.name,
                  date,
                  status: "Present",
                  approval_status: "Pending",
                  check_in: checkIn || undefined,
                  check_out: checkOut || undefined,
                };
                return record;
              })
              .filter(r => r !== null) as AttendanceRecord[];

            setAttendance(prev => [...newRecords, ...prev]);
            setSelectedEmployees([]);
            setShowBulkPresentModal(false);
            showSuccess(`Marked ${newRecords.length} employee${newRecords.length > 1 ? 's' : ''} as present`);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function MarkAttendanceModal({ 
  employees, 
  editingRecord,
  onClose, 
  onSave 
}: {
  employees: Employee[];
  editingRecord: AttendanceRecord | null;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
}) {
  const [formData, setFormData] = useState({
    employee_id: editingRecord?.employee_id || 0,
    employee_name: editingRecord?.employee_name || "",
    employee_search: "",
    date: editingRecord?.date || format(new Date(), "yyyy-MM-dd"),
    status: (editingRecord?.status || "Present") as "Present" | "Absent" | "Half-Day" | "Leave",
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
      date: formData.date,
      status: formData.status === "Half-Day" ? "Half Day" : formData.status,
      approval_status: editingRecord ? editingRecord.approval_status : "Pending",
      check_in: formData.check_in || undefined,
      check_out: formData.check_out || undefined,
      approved_by: editingRecord?.approved_by,
      approved_at: editingRecord?.approved_at,
    };
    onSave(newRecord);
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
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Attendance Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status === "Half Day" ? "Half-Day" : formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "Present" | "Absent" | "Half-Day" | "Leave" })}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Leave">Leave</option>
            </select>
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
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRecord ? "Update Attendance" : "Mark Attendance"}
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
        escapeCSV(record.approved_by || "")
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
  onClose,
  onSave,
}: {
  employees: Employee[];
  onClose: () => void;
  onSave: (date: string, checkIn: string, checkOut: string) => void;
}) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(date, checkIn, checkOut);
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
              <strong>Note:</strong> All attendance records will be created with "Pending" approval status and need to be approved by the owner.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4 mr-2" />
              Mark as Present
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

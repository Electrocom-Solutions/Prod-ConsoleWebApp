"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, X, User, Briefcase, Loader2, Inbox } from "lucide-react";
import { showDeleteConfirm, showAlert, showSuccess } from "@/lib/sweetalert";
import { apiClient, EmployeeStatisticsResponse, BackendEmployeeListItem, EmployeeDetail, EmployeeCreateData } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  email: string;
  phone: string;
  photo?: string;
  date_of_birth: string;
  gender: "Male" | "Female";
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  aadhar_number: string;
  pan_number: string;
  designation: "Technician" | "Field Staff" | "Computer Operator" | "Other";
  joining_date: string;
  monthly_salary: number;
  status: "Active" | "On Leave" | "Terminated";
  created_at: string;
  availability_status?: string | null;
  // Legacy fields for backward compatibility
  name?: string;
  department?: string;
  role?: string;
  salary?: number;
};

/**
 * Map backend employee list item to frontend Employee type
 */
function mapBackendEmployeeListItemToFrontend(backendEmployee: BackendEmployeeListItem): Employee {
  const nameParts = backendEmployee.full_name?.split(' ') || [];
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || '';

  return {
    id: backendEmployee.id,
    first_name,
    last_name,
    employee_id: backendEmployee.employee_code,
    email: backendEmployee.email || '',
    phone: backendEmployee.phone_number || '',
    date_of_birth: '',
    gender: "Male",
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    aadhar_number: '',
    pan_number: '',
    designation: backendEmployee.designation,
    joining_date: backendEmployee.created_at,
    monthly_salary: 0,
    status: backendEmployee.availability_status === 'Present' ? 'Active' : 
            backendEmployee.availability_status === 'Absent' ? 'On Leave' : 'Active',
    created_at: backendEmployee.created_at,
    availability_status: backendEmployee.availability_status,
    name: backendEmployee.full_name || '',
    department: backendEmployee.designation,
    role: backendEmployee.designation,
    salary: 0,
  };
}

/**
 * Map backend employee detail to frontend Employee type
 */
function mapBackendEmployeeDetailToFrontend(backendEmployee: EmployeeDetail): Employee {
  const nameParts = backendEmployee.full_name?.split(' ') || [];
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || '';

  return {
    id: backendEmployee.id,
    first_name,
    last_name,
    employee_id: backendEmployee.employee_code,
    email: backendEmployee.email || '',
    phone: backendEmployee.phone_number || '',
    photo: backendEmployee.photo_url || undefined,
    date_of_birth: backendEmployee.date_of_birth || '',
    gender: (backendEmployee.gender === 'male' ? 'Male' : backendEmployee.gender === 'female' ? 'Female' : 'Male') as "Male" | "Female",
    address: backendEmployee.address || '',
    city: backendEmployee.city || '',
    state: backendEmployee.state || '',
    pincode: backendEmployee.pin_code || '',
    country: backendEmployee.country || 'India',
    aadhar_number: backendEmployee.aadhar_number || '',
    pan_number: backendEmployee.pan_number || '',
    designation: backendEmployee.designation,
    joining_date: backendEmployee.joining_date,
    monthly_salary: parseFloat(backendEmployee.monthly_salary) || 0,
    status: 'Active' as const,
    created_at: backendEmployee.created_at,
    name: backendEmployee.full_name || '',
    department: backendEmployee.designation,
    role: backendEmployee.designation,
    salary: parseFloat(backendEmployee.monthly_salary) || 0,
  };
}

function EmployeesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<EmployeeStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getEmployeeStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch employee statistics:", err);
      setError(err.message || "Failed to load statistics");
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getEmployees({
        search: debouncedSearchQuery || undefined,
        designation: designationFilter !== "all" ? designationFilter : undefined,
        availability: availabilityFilter !== "all" ? (availabilityFilter as 'present' | 'absent') : undefined,
        page: currentPage,
      });

      const mappedEmployees = response.results.map(mapBackendEmployeeListItemToFrontend);
      setEmployees(mappedEmployees);
      
      // Calculate total pages
      const totalPages = Math.ceil(response.count / 20); // Assuming 20 items per page
      setTotalPages(totalPages);
    } catch (err: any) {
      console.error("Failed to fetch employees:", err);
      setError(err.message || "Failed to load employees");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, designationFilter, availabilityFilter, currentPage]);

  // Initial data fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle URL parameter for opening modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setSelectedEmployee(null);
      setShowModal(true);
      // Clean up URL
      router.replace('/employees', { scroll: false });
    }
  }, [searchParams, router]);

  // Handle create employee
  const handleCreateEmployee = async (employeeData: EmployeeCreateData) => {
    setIsSaving(true);
    try {
      await apiClient.createEmployee(employeeData);
      showSuccess("Employee created successfully!");
      setShowModal(false);
      setSelectedEmployee(null);
      await fetchEmployees();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to create employee:", err);
      showAlert("Create Failed", err.message || "An error occurred during employee creation.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update employee
  const handleUpdateEmployee = async (id: number, employeeData: Partial<EmployeeCreateData>) => {
    setIsSaving(true);
    try {
      await apiClient.updateEmployee(id, employeeData);
      showSuccess("Employee updated successfully!");
      setShowModal(false);
      setSelectedEmployee(null);
      await fetchEmployees();
      await fetchStatistics();
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      showAlert("Update Failed", err.message || "An error occurred during employee update.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete employee
  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this employee");
    if (confirmed) {
      try {
        await apiClient.deleteEmployee(id);
        showSuccess("Employee deleted successfully!");
        await fetchEmployees();
        await fetchStatistics();
      } catch (err: any) {
        console.error("Failed to delete employee:", err);
        showAlert("Delete Failed", err.message || "An error occurred during deletion.", "error");
      }
    }
  };

  // Handle edit employee - fetch full details first
  const handleEdit = async (employee: Employee) => {
    try {
      setIsLoading(true);
      const employeeDetail = await apiClient.getEmployee(employee.id);
      const mappedEmployee = mapBackendEmployeeDetailToFrontend(employeeDetail);
      setSelectedEmployee(mappedEmployee);
      setShowModal(true);
    } catch (err: any) {
      console.error("Failed to fetch employee details:", err);
      showAlert("Error", err.message || "Failed to load employee details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique designations for filter
  const uniqueDesignations = useMemo(() => {
    return ['all', 'Technician', 'Field Staff', 'Computer Operator', 'Other'];
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "On Leave":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Terminated":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Employees" breadcrumbs={["Home", "People", "Employees"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Employee Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage employee records and profiles</p>
          </div>
          <Button onClick={() => {
            setSelectedEmployee(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Statistics Tiles */}
        {error && !statistics && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Employees</div>
            <div className="text-2xl font-bold mt-1">
              {statistics ? statistics.total_employees : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Active (Present)</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {statistics ? statistics.total_present : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">On Leave (Absent)</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {statistics ? statistics.total_absent : isLoading ? "..." : "0"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Payroll</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">
              {statistics ? `₹${(statistics.monthly_payroll / 1000).toFixed(1)}K` : isLoading ? "..." : "₹0"}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {uniqueDesignations.map(designation => (
              <option key={designation} value={designation}>
                {designation === "all" ? "All Designations" : designation}
              </option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Employees Table */}
        {isLoading && employees.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : error && employees.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load employees
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button
              onClick={() => fetchEmployees()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No employees found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first employee
            </p>
            <Button
              onClick={() => {
                setSelectedEmployee(null);
                setShowModal(true);
              }}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Joining Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                          {employee.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={employee.photo} alt={employee.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          {employee.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{employee.designation || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(employee.joining_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.availability_status || employee.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowModal(false);
            setSelectedEmployee(null);
          }}
          onSave={async (employeeData) => {
            if (selectedEmployee) {
              await handleUpdateEmployee(selectedEmployee.id, employeeData);
            } else {
              await handleCreateEmployee(employeeData);
            }
          }}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <DashboardLayout title="Employees" breadcrumbs={["Home", "People", "Employees"]}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        </DashboardLayout>
      }>
        <EmployeesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function EmployeeModal({ employee, onClose, onSave, isSaving }: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (data: EmployeeCreateData) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || employee?.name?.split(' ')[0] || "",
    last_name: employee?.last_name || employee?.name?.split(' ').slice(1).join(' ') || "",
    employee_code: employee?.employee_id || `EMP-${Date.now().toString().slice(-3)}`,
    email: employee?.email || "",
    phone: employee?.phone || "",
    photo: employee?.photo || "",
    date_of_birth: employee?.date_of_birth || "",
    gender: (employee?.gender || "Male") as "Male" | "Female",
    address: employee?.address || "",
    city: employee?.city || "",
    state: employee?.state || "",
    pincode: employee?.pincode || "",
    country: employee?.country || "India",
    aadhar_number: employee?.aadhar_number || "",
    pan_number: employee?.pan_number || "",
    designation: (employee?.designation || "Technician") as "Technician" | "Field Staff" | "Computer Operator" | "Other",
    joining_date: employee?.joining_date || new Date().toISOString().split('T')[0],
    monthly_salary: employee?.monthly_salary?.toString() || employee?.salary?.toString() || "",
    status: employee?.status || "Active",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadharCardFile, setAadharCardFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare employee data for API
    const employeeData: EmployeeCreateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      employee_code: formData.employee_code,
      designation: formData.designation,
      joining_date: formData.joining_date,
      monthly_salary: parseFloat(formData.monthly_salary) || 0,
      phone_number: formData.phone || undefined,
      photo: photoFile || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender === "Male" ? "male" : formData.gender === "Female" ? "female" : "other",
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pin_code: formData.pincode || undefined,
      country: formData.country || undefined,
      aadhar_number: formData.aadhar_number || undefined,
      pan_number: formData.pan_number || undefined,
      aadhar_card: aadharCardFile || undefined,
      pan_card: panCardFile || undefined,
    };

    await onSave(employeeData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {employee ? "Edit Employee" : "Add Employee"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Basic details about the employee</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Employee Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  required
                  placeholder="Enter employee code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Photo
                </label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.photo} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email, phone, and address information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="Enter full address"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Pincode
                </label>
                <Input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Enter pincode"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Country
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Identity Documents Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Identity Documents</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Official identification documents</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Aadhar Number
                </label>
                <Input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  PAN Number
                </label>
                <Input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                  placeholder="Enter PAN number"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Aadhar Card (File)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setAadharCardFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  PAN Card (File)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPanCardFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Work Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employment and designation information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value as "Technician" | "Field Staff" | "Computer Operator" | "Other" })}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Technician">Technician</option>
                  <option value="Field Staff">Field Staff</option>
                  <option value="Computer Operator">Computer Operator</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Monthly Salary (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                  required
                  placeholder="Enter monthly salary"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {employee ? "Updating..." : "Creating..."}
                </>
              ) : (
                employee ? "Update" : "Add"
              )} Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

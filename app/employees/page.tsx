"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, X, User, Briefcase } from "lucide-react";
import { showDeleteConfirm } from "@/lib/sweetalert";

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
  designation: "Technician" | "Field Staff" | "Computer Operator";
  joining_date: string;
  monthly_salary: number;
  status: "Active" | "On Leave" | "Terminated";
  created_at: string;
  // Legacy fields for backward compatibility
  name?: string;
  department?: string;
  role?: string;
  salary?: number;
};

const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "Rajesh Kumar",
    employee_id: "EMP-001",
    email: "rajesh@electrocom.in",
    phone: "+91 98765 43210",
    department: "Technical",
    role: "Senior Engineer",
    joining_date: "2020-01-15",
    status: "Active",
    salary: 45000,
    address: "Mumbai, Maharashtra",
    emergency_contact: "+91 98765 43211",
    created_at: "2020-01-15T00:00:00Z",
  },
  {
    id: 2,
    name: "Priya Sharma",
    employee_id: "EMP-002",
    email: "priya@electrocom.in",
    phone: "+91 98765 43220",
    department: "Administration",
    role: "Office Manager",
    joining_date: "2021-03-20",
    status: "Active",
    salary: 35000,
    address: "Mumbai, Maharashtra",
    created_at: "2021-03-20T00:00:00Z",
  },
  {
    id: 3,
    name: "Amit Patel",
    employee_id: "EMP-003",
    email: "amit@electrocom.in",
    phone: "+91 98765 43230",
    department: "Technical",
    role: "Field Technician",
    joining_date: "2019-06-10",
    status: "Active",
    salary: 28000,
    address: "Pune, Maharashtra",
    created_at: "2019-06-10T00:00:00Z",
  },
  {
    id: 4,
    name: "Suresh Reddy",
    employee_id: "EMP-004",
    email: "suresh@electrocom.in",
    phone: "+91 98765 43240",
    department: "Sales",
    role: "Sales Executive",
    joining_date: "2022-01-05",
    status: "On Leave",
    salary: 32000,
    address: "Bangalore, Karnataka",
    created_at: "2022-01-05T00:00:00Z",
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const departments = ["all", ...Array.from(new Set(employees.map(e => e.department)))];
  
  const filteredEmployees = employees.filter((emp) => {
    const fullName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    const matchesSearch = searchQuery === "" ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this employee");
    if (confirmed) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

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

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Employees</div>
            <div className="text-2xl font-bold mt-1">{employees.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {employees.filter(e => e.status === "Active").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">On Leave</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {employees.filter(e => e.status === "On Leave").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Payroll</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">
              ₹{employees.filter(e => e.status === "Active").reduce((sum, e) => sum + (e.monthly_salary || e.salary || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

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
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === "all" ? "All Departments" : dept}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>

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
                  Department & Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Salary
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
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
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      {employee.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{employee.designation || employee.role || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{employee.department || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(employee.joining_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ₹{(employee.monthly_salary || employee.salary || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowModal(true);
                        }}
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
      </div>

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSave={(emp) => {
            if (selectedEmployee) {
              setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
            } else {
              setEmployees(prev => [emp, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function EmployeeModal({ employee, onClose, onSave }: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (emp: Employee) => void;
}) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || employee?.name?.split(' ')[0] || "",
    last_name: employee?.last_name || employee?.name?.split(' ').slice(1).join(' ') || "",
    employee_id: employee?.employee_id || `EMP-${Date.now().toString().slice(-3)}`,
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
    designation: (employee?.designation || "Technician") as "Technician" | "Field Staff" | "Computer Operator",
    joining_date: employee?.joining_date || new Date().toISOString().split('T')[0],
    monthly_salary: employee?.monthly_salary?.toString() || employee?.salary?.toString() || "",
    status: employee?.status || "Active",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedEmployee: Employee = {
      id: employee?.id || Date.now(),
      ...formData,
      monthly_salary: parseInt(formData.monthly_salary) || 0,
      created_at: employee?.created_at || new Date().toISOString(),
      // Legacy fields for backward compatibility
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      salary: parseInt(formData.monthly_salary) || 0,
    };
    onSave(savedEmployee);
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
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })}
                  required
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
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={2}
                  placeholder="Enter full address"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                  placeholder="Enter pincode"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Country <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
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
                  Aadhar Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  required
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                  required
                  placeholder="Enter PAN number"
                  maxLength={10}
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
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value as "Technician" | "Field Staff" | "Computer Operator" })}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Technician">Technician</option>
                  <option value="Field Staff">Field Staff</option>
                  <option value="Computer Operator">Computer Operator</option>
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
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {employee ? "Update" : "Add"} Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

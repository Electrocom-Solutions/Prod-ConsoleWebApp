"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, Edit, Trash2, X, User, Phone, MapPin, Mail } from "lucide-react";
import { showDeleteConfirm } from "@/lib/sweetalert";

type ContractWorker = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "Male" | "Female";
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  worker_type: "Unskilled" | "Semi-Skilled" | "Skilled";
  monthly_salary: number;
  aadhar_number: string;
  uan_number: string;
  department: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_branch: string;
  status: "Available" | "Assigned" | "Inactive";
  created_at: string;
  // Legacy fields for backward compatibility
  name?: string;
  worker_id?: string;
  designation?: string;
  project_id?: number;
  project_name?: string;
};

type Project = {
  id: number;
  name: string;
};

const mockProjects: Project[] = [
  { id: 1, name: "BSNL Network Project" },
  { id: 2, name: "Reliance Telecom Tower" },
  { id: 3, name: "Vodafone Network Expansion" },
  { id: 4, name: "Airtel Fiber Installation" },
];

const mockWorkers: ContractWorker[] = [
  {
    id: 1,
    name: "Ram Prakash",
    worker_id: "CW-001",
    phone: "+91 98765 11111",
    designation: "Electrician",
    monthly_salary: 24000,
    address: "Andheri, Mumbai",
    status: "Available",
    bank_name: "State Bank of India",
    bank_account_number: "1234567890",
    bank_ifsc: "SBIN0001234",
    uan_number: "101234567890",
    aadhar_number: "1234 5678 9012",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Vikram Singh",
    worker_id: "CW-002",
    phone: "+91 98765 22222",
    designation: "Supervisor",
    monthly_salary: 35000,
    address: "Thane, Mumbai",
    project_id: 1,
    project_name: "BSNL Network Project",
    status: "Assigned",
    bank_name: "HDFC Bank",
    bank_account_number: "0987654321",
    bank_ifsc: "HDFC0001234",
    uan_number: "101234567891",
    created_at: "2025-01-05T00:00:00Z",
  },
  {
    id: 3,
    name: "Sunil Kumar",
    worker_id: "CW-003",
    phone: "+91 98765 33333",
    designation: "Fitter",
    monthly_salary: 22000,
    address: "Vashi, Navi Mumbai",
    status: "Available",
    aadhar_number: "9876 5432 1098",
    created_at: "2025-01-10T00:00:00Z",
  },
];

export default function ContractWorkersPage() {
  const [workers, setWorkers] = useState<ContractWorker[]>(mockWorkers);
  const [searchQuery, setSearchQuery] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<ContractWorker | null>(null);

  const designations = ["all", ...Array.from(new Set(workers.map(w => w.worker_type || w.designation).filter(Boolean)))];

  const filteredWorkers = workers.filter((worker) => {
    const fullName = worker.name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim();
    const matchesSearch = searchQuery === "" ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.worker_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone.includes(searchQuery) ||
      worker.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDesignation = designationFilter === "all" || worker.designation === designationFilter || worker.worker_type === designationFilter;
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
    
    return matchesSearch && matchesDesignation && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this worker");
    if (confirmed) {
      setWorkers(prev => prev.filter(w => w.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Assigned":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Inactive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Contract Workers" breadcrumbs={["Home", "People", "Contract Workers"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Contract Worker Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage contract workers and bulk imports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => {
              setSelectedWorker(null);
              setShowModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Workers</div>
            <div className="text-2xl font-bold mt-1">{workers.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {workers.filter(w => w.status === "Available").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Assigned</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {workers.filter(w => w.status === "Assigned").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total of All Salaries</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">
              ₹{workers.reduce((sum, w) => sum + w.monthly_salary, 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search workers..."
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
            {designations.map(designation => (
              <option key={designation} value={designation}>
                {designation === "all" ? "All Designations" : designation}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Assignment
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
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <div className="font-medium">{worker.name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim()}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{worker.worker_id || `CW-${worker.id.toString().padStart(3, '0')}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {worker.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{worker.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      {worker.phone}
                    </div>
                    {(worker.address || worker.city) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {worker.address || `${worker.city || ''}, ${worker.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{worker.worker_type || worker.designation || '-'}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-gray-200">
                    ₹{worker.monthly_salary.toLocaleString('en-IN')}/mo
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {worker.project_name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(worker.status)}>
                      {worker.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(worker.id)}
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
        <WorkerModal
          worker={selectedWorker}
          onClose={() => setShowModal(false)}
          onSave={(worker) => {
            if (selectedWorker) {
              setWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
            } else {
              setWorkers(prev => [worker, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImport={(newWorkers) => {
            setWorkers(prev => [...newWorkers, ...prev]);
            setShowBulkImport(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function WorkerModal({ worker, onClose, onSave }: {
  worker: ContractWorker | null;
  onClose: () => void;
  onSave: (worker: ContractWorker) => void;
}) {
  const [formData, setFormData] = useState({
    first_name: worker?.first_name || worker?.name?.split(' ')[0] || "",
    last_name: worker?.last_name || worker?.name?.split(' ').slice(1).join(' ') || "",
    email: worker?.email || "",
    phone: worker?.phone || "",
    date_of_birth: worker?.date_of_birth || "",
    gender: (worker?.gender || "Male") as "Male" | "Female",
    address: worker?.address || "",
    city: worker?.city || "",
    state: worker?.state || "",
    pincode: worker?.pincode || "",
    country: worker?.country || "India",
    worker_type: (worker?.worker_type || "Semi-Skilled") as "Unskilled" | "Semi-Skilled" | "Skilled",
    monthly_salary: worker?.monthly_salary?.toString() || "",
    aadhar_number: worker?.aadhar_number || "",
    uan_number: worker?.uan_number || "",
    department: worker?.department || "",
    bank_name: worker?.bank_name || "",
    bank_account_number: worker?.bank_account_number || "",
    bank_ifsc: worker?.bank_ifsc || "",
    bank_branch: worker?.bank_branch || "",
    status: worker?.status || "Available",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedWorker: ContractWorker = {
      id: worker?.id || Date.now(),
      ...formData,
      monthly_salary: parseInt(formData.monthly_salary) || 0,
      created_at: worker?.created_at || new Date().toISOString(),
      // Legacy fields for backward compatibility
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      worker_id: worker?.worker_id || `CW-${Date.now().toString().slice(-3)}`,
      designation: formData.worker_type,
    };
    onSave(savedWorker);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {worker ? "Edit Contract Worker" : "Add Contract Worker"}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Basic details about the contract worker</p>
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
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
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

          {/* Work Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employment and designation information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Worker Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.worker_type}
                  onChange={(e) => setFormData({ ...formData, worker_type: e.target.value as "Unskilled" | "Semi-Skilled" | "Skilled" })}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Unskilled">Unskilled</option>
                  <option value="Semi-Skilled">Semi-Skilled</option>
                  <option value="Skilled">Skilled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Department <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  placeholder="Enter department"
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
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  UAN Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.uan_number}
                  onChange={(e) => setFormData({ ...formData, uan_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  required
                  placeholder="Enter UAN number"
                  maxLength={12}
                />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Banking and account information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Bank Account Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value.replace(/\D/g, '') })}
                  required
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.bank_ifsc}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                  required
                  placeholder="Enter IFSC code"
                  maxLength={11}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Bank Branch <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                  required
                  placeholder="Enter bank branch name"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {worker ? "Update" : "Add"} Worker
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (workers: ContractWorker[]) => void;
}) {
  const [csvData, setCsvData] = useState("");

  const handleImport = () => {
    const sampleWorkers: ContractWorker[] = [
      { id: Date.now() + 1, name: "Sample Worker 1", worker_id: "CW-101", phone: "+91 98765 44444", designation: "Electrician", monthly_salary: 25000, status: "Available", created_at: new Date().toISOString() },
      { id: Date.now() + 2, name: "Sample Worker 2", worker_id: "CW-102", phone: "+91 98765 55555", designation: "Fitter", monthly_salary: 28000, status: "Available", created_at: new Date().toISOString() },
    ];
    onImport(sampleWorkers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Bulk Import Workers</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format: Name, Phone, Skill, Daily Rate, Address
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Import Workers (Sample)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

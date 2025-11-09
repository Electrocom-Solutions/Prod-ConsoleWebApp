"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, X, Search } from "lucide-react";
import { showSuccess, showDeleteConfirm } from "@/lib/sweetalert";

type Employee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  name?: string; // Legacy field
};

type Firm = {
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
};

// Mock employees list for Firm Owner Profile
const mockEmployees: Employee[] = [
  {
    id: 1,
    employee_id: "EMP-001",
    first_name: "Rajesh",
    last_name: "Kumar",
    name: "Rajesh Kumar",
    email: "rajesh@electrocom.in",
    phone: "+91 98765 43210",
  },
  {
    id: 2,
    employee_id: "EMP-002",
    first_name: "Priya",
    last_name: "Sharma",
    name: "Priya Sharma",
    email: "priya@electrocom.in",
    phone: "+91 98765 43220",
  },
  {
    id: 3,
    employee_id: "EMP-003",
    first_name: "Amit",
    last_name: "Patel",
    name: "Amit Patel",
    email: "amit@electrocom.in",
    phone: "+91 98765 43230",
  },
];

const mockFirms: Firm[] = [
  {
    id: 1,
    firm_name: "Electrocom Pvt. Ltd.",
    firm_type: "Private Limited",
    firm_owner_profile_id: 1,
    firm_owner_profile_name: "Rajesh Kumar",
    firm_official_email: "info@electrocom.in",
    firm_official_mobile: "+91 98765 43210",
    address: "123, Andheri West, Mumbai, Maharashtra - 400053",
    gst_number: "27AABCU9603R1ZM",
    pan_number: "AABCU9603R",
    created_at: "2024-01-15T00:00:00Z",
  },
];

export default function SettingsPage() {
  const [firms, setFirms] = useState<Firm[]>(mockFirms);
  const [showFirmModal, setShowFirmModal] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFirms = useMemo(() => {
    if (!searchQuery) return firms;
    const query = searchQuery.toLowerCase();
    return firms.filter(firm =>
      firm.firm_name.toLowerCase().includes(query) ||
      firm.firm_type.toLowerCase().includes(query) ||
      firm.firm_owner_profile_name.toLowerCase().includes(query) ||
      firm.firm_official_email.toLowerCase().includes(query) ||
      firm.gst_number.toLowerCase().includes(query) ||
      firm.pan_number.toLowerCase().includes(query)
    );
  }, [firms, searchQuery]);

  const handleDeleteFirm = async (id: number) => {
    const confirmed = await showDeleteConfirm("this firm");
    if (confirmed) {
      setFirms(prev => prev.filter(f => f.id !== id));
      await showSuccess("Firm Deleted", "Firm has been deleted successfully!");
    }
  };

  return (
    <DashboardLayout title="Settings" breadcrumbs={["Home", "Settings"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Firm Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage your firms and company information</p>
          </div>
          <Button onClick={() => {
            setSelectedFirm(null);
            setShowFirmModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Firm
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by firm name, type, owner, email, GST, or PAN number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

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
                {filteredFirms.map((firm) => (
                  <tr key={firm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{firm.firm_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{firm.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{firm.firm_type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">{firm.firm_owner_profile_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{firm.firm_official_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{firm.firm_official_mobile}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{firm.gst_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{firm.pan_number}</td>
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
                ))}
              </tbody>
            </table>
          </div>

          {filteredFirms.length === 0 && firms.length > 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium">No firms found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search query
              </p>
            </div>
          )}

          {firms.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium">No firms</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first firm
              </p>
              <Button className="mt-4" onClick={() => setShowFirmModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Firm
              </Button>
            </div>
          )}
        </div>
      </div>

      {showFirmModal && (
        <FirmModal
          firm={selectedFirm}
          employees={mockEmployees}
          onClose={() => {
            setShowFirmModal(false);
            setSelectedFirm(null);
          }}
          onSave={(firm) => {
            if (selectedFirm) {
              setFirms(prev => prev.map(f => f.id === firm.id ? firm : f));
              showSuccess("Firm Updated", "Firm has been updated successfully!");
            } else {
              setFirms(prev => [firm, ...prev]);
              showSuccess("Firm Created", "Firm has been created successfully!");
            }
            setShowFirmModal(false);
            setSelectedFirm(null);
          }}
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
}: {
  firm: Firm | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (firm: Firm) => void;
}) {
  const [formData, setFormData] = useState({
    firm_name: firm?.firm_name || "",
    firm_type: firm?.firm_type || "",
    firm_owner_profile_id: firm?.firm_owner_profile_id || 0,
    firm_owner_profile_name: firm?.firm_owner_profile_name || "",
    owner_search: "",
    firm_official_email: firm?.firm_official_email || "",
    firm_official_mobile: firm?.firm_official_mobile || "",
    address: firm?.address || "",
    gst_number: firm?.gst_number || "",
    pan_number: firm?.pan_number || "",
  });
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  // Update form data when firm changes (for editing)
  useEffect(() => {
    if (firm) {
      setFormData({
        firm_name: firm.firm_name,
        firm_type: firm.firm_type,
        firm_owner_profile_id: firm.firm_owner_profile_id,
        firm_owner_profile_name: firm.firm_owner_profile_name,
        owner_search: firm.firm_owner_profile_name,
        firm_official_email: firm.firm_official_email,
        firm_official_mobile: firm.firm_official_mobile,
        address: firm.address,
        gst_number: firm.gst_number,
        pan_number: firm.pan_number,
      });
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
  }, [firm]);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchTerm = formData.owner_search.toLowerCase();
      if (!searchTerm) return true;
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      const name = employee.name?.toLowerCase() || fullName;
      return (
        name.includes(searchTerm) ||
        employee.employee_id.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.phone.includes(searchTerm)
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

  const handleOwnerSelect = (employee: Employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    setFormData({
      ...formData,
      firm_owner_profile_id: employee.id,
      firm_owner_profile_name: employee.name || fullName,
      owner_search: employee.name || fullName,
    });
    setShowOwnerDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firm_owner_profile_id) {
      alert("Please select a Firm Owner Profile");
      return;
    }
    const savedFirm: Firm = {
      id: firm?.id || Date.now(),
      firm_name: formData.firm_name,
      firm_type: formData.firm_type,
      firm_owner_profile_id: formData.firm_owner_profile_id,
      firm_owner_profile_name: formData.firm_owner_profile_name,
      firm_official_email: formData.firm_official_email,
      firm_official_mobile: formData.firm_official_mobile,
      address: formData.address,
      gst_number: formData.gst_number,
      pan_number: formData.pan_number,
      created_at: firm?.created_at || new Date().toISOString(),
    };
    onSave(savedFirm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold">
            {firm ? "Edit Firm" : "Create Firm"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Firm Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.firm_name}
              onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Firm Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.firm_type}
              onChange={(e) => setFormData({ ...formData, firm_type: e.target.value })}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white"
            >
              <option value="">Select Firm Type</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="Private Limited">Private Limited</option>
              <option value="Public Limited">Public Limited</option>
              <option value="LLP">Limited Liability Partnership (LLP)</option>
              <option value="HUF">Hindu Undivided Family (HUF)</option>
            </select>
          </div>

          {/* Firm Owner Profile - Searchable Dropdown */}
          <div className="relative owner-dropdown-container">
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Firm Owner Profile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.owner_search || formData.firm_owner_profile_name}
                onChange={(e) => {
                  setFormData({ ...formData, owner_search: e.target.value, firm_owner_profile_id: 0, firm_owner_profile_name: "" });
                  setShowOwnerDropdown(true);
                }}
                onFocus={() => {
                  if (employees.length > 0) {
                    setShowOwnerDropdown(true);
                  }
                }}
                placeholder="Search by employee ID, name, email, or phone number"
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {showOwnerDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => {
                    const fullName = `${employee.first_name} ${employee.last_name}`;
                    const displayName = employee.name || fullName;
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleOwnerSelect(employee)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {employee.employee_id} • {employee.email} • {employee.phone}
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
                Firm Official Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.firm_official_email}
                onChange={(e) => setFormData({ ...formData, firm_official_email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Firm Official Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={formData.firm_official_mobile}
                onChange={(e) => setFormData({ ...formData, firm_official_mobile: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {firm ? "Update" : "Create"} Firm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

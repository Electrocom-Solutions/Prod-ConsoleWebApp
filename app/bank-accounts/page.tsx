"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Building2, CreditCard, Search } from "lucide-react";
import { showDeleteConfirm } from "@/lib/sweetalert";

type Employee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  name?: string; // Legacy field
};

type BankAccount = {
  id: number;
  profile_id: number;
  profile_name: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  branch: string;
  created_at: string;
};

// Mock employees list
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
  {
    id: 4,
    employee_id: "EMP-004",
    first_name: "Suresh",
    last_name: "Reddy",
    name: "Suresh Reddy",
    email: "suresh@electrocom.in",
    phone: "+91 98765 43240",
  },
];

const mockBankAccounts: BankAccount[] = [
  {
    id: 1,
    profile_id: 1,
    profile_name: "Rajesh Kumar",
    bank_name: "HDFC Bank",
    account_number: "50100123456789",
    account_holder_name: "Rajesh Kumar",
    ifsc_code: "HDFC0001234",
    branch: "Andheri West, Mumbai",
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    id: 2,
    profile_id: 2,
    profile_name: "Priya Sharma",
    bank_name: "ICICI Bank",
    account_number: "602305987654",
    account_holder_name: "Priya Sharma",
    ifsc_code: "ICIC0006023",
    branch: "Vashi, Navi Mumbai",
    created_at: "2024-06-20T00:00:00Z",
  },
];

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    const query = searchQuery.toLowerCase();
    return accounts.filter(account =>
      account.profile_name.toLowerCase().includes(query) ||
      account.bank_name.toLowerCase().includes(query) ||
      account.account_number.includes(query)
    );
  }, [accounts, searchQuery]);

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this bank account");
    if (confirmed) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <DashboardLayout title="Bank Accounts" breadcrumbs={["Home", "Settings", "Bank Accounts"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bank Account Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Employee bank accounts for payments</p>
          </div>
          <Button onClick={() => {
            setSelectedAccount(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by employee name, bank name, or account number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-900 rounded-lg border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{account.bank_name}</h3>
                      <Badge variant="secondary">{account.profile_name}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {account.account_holder_name}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Account: {account.account_number}</span>
                      </div>
                      <p>IFSC: {account.ifsc_code}</p>
                      <p>Branch: {account.branch}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAccounts.length === 0 && accounts.length > 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">No bank accounts found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search query
            </p>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">No bank accounts</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first bank account
            </p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>
        )}
      </div>

      {showModal && (
        <BankAccountModal
          account={selectedAccount}
          employees={mockEmployees}
          onClose={() => setShowModal(false)}
          onSave={(acc) => {
            if (selectedAccount) {
              setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            } else {
              setAccounts(prev => [acc, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function BankAccountModal({ account, employees, onClose, onSave }: {
  account: BankAccount | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (acc: BankAccount) => void;
}) {
  const [formData, setFormData] = useState({
    profile_id: account?.profile_id || 0,
    profile_name: account?.profile_name || "",
    profile_search: account?.profile_name || "",
    bank_name: account?.bank_name || "",
    account_number: account?.account_number || "",
    account_holder_name: account?.account_holder_name || "",
    ifsc_code: account?.ifsc_code || "",
    branch: account?.branch || "",
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Update form data when account changes (for editing)
  useEffect(() => {
    if (account) {
      setFormData({
        profile_id: account.profile_id,
        profile_name: account.profile_name,
        profile_search: account.profile_name,
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_holder_name: account.account_holder_name,
        ifsc_code: account.ifsc_code,
        branch: account.branch,
      });
    } else {
      setFormData({
        profile_id: 0,
        profile_name: "",
        profile_search: "",
        bank_name: "",
        account_number: "",
        account_holder_name: "",
        ifsc_code: "",
        branch: "",
      });
    }
  }, [account]);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchTerm = formData.profile_search.toLowerCase();
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
  }, [employees, formData.profile_search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  const handleProfileSelect = (employee: Employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    setFormData({
      ...formData,
      profile_id: employee.id,
      profile_name: employee.name || fullName,
      profile_search: employee.name || fullName,
    });
    setShowProfileDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profile_id) {
      alert("Please select a profile");
      return;
    }
    const savedAccount: BankAccount = {
      id: account?.id || Date.now(),
      profile_id: formData.profile_id,
      profile_name: formData.profile_name,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      account_holder_name: formData.account_holder_name,
      ifsc_code: formData.ifsc_code,
      branch: formData.branch,
      created_at: account?.created_at || new Date().toISOString(),
    };
    onSave(savedAccount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {account ? "Edit Bank Account" : "Add Bank Account"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Selection - Searchable Dropdown */}
          <div className="relative profile-dropdown-container">
            <label className="block text-sm font-medium mb-2">
              Profile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.profile_search || formData.profile_name}
                onChange={(e) => {
                  setFormData({ ...formData, profile_search: e.target.value, profile_id: 0, profile_name: "" });
                  setShowProfileDropdown(true);
                }}
                onFocus={() => {
                  if (employees.length > 0) {
                    setShowProfileDropdown(true);
                  }
                }}
                placeholder="Search by employee ID, name, email, or phone number"
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {showProfileDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => {
                    const fullName = `${employee.first_name} ${employee.last_name}`;
                    const displayName = employee.name || fullName;
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleProfileSelect(employee)}
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
              {showProfileDropdown && filteredEmployees.length === 0 && formData.profile_search && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
                  No employees found
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <Input
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {account ? "Update" : "Add"} Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

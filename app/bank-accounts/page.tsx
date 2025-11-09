"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Building2, CreditCard, Search, Loader2 } from "lucide-react";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { apiClient, BackendBankAccountListItem, BankAccountDetail, BankAccountCreateData, BackendEmployeeListItem, EmployeeListResponse } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend bank account list item to frontend BankAccount type
 */
function mapBackendBankAccountListItemToFrontend(backendAccount: BackendBankAccountListItem): {
  id: number;
  profile_id: number;
  profile_name: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  branch: string;
  created_at: string;
} {
  return {
    id: backendAccount.id,
    profile_id: backendAccount.profile_id,
    profile_name: backendAccount.profile_name || 'Unknown',
    bank_name: backendAccount.bank_name,
    account_number: backendAccount.account_number,
    account_holder_name: backendAccount.account_holder_name || backendAccount.profile_name || 'Unknown',
    ifsc_code: backendAccount.ifsc_code,
    branch: backendAccount.branch || '',
    created_at: backendAccount.created_at,
  };
}

function BankAccountsPageContent() {
  const [accounts, setAccounts] = useState<BackendBankAccountListItem[]>([]);
  const [employees, setEmployees] = useState<BackendEmployeeListItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BackendBankAccountListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch employees for profile selection
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
   * Fetch bank accounts from backend
   */
  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await apiClient.getBankAccounts(params);
      setAccounts(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching bank accounts:', err);
      setError(err.message || 'Failed to fetch bank accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this bank account");
    if (confirmed) {
      try {
        await apiClient.deleteBankAccount(id);
        fetchBankAccounts();
        showSuccess("Success", "Bank account deleted successfully");
      } catch (err: any) {
        showError("Error", err.message || "Failed to delete bank account");
      }
    }
  };

  const handleSave = async (accountData: BankAccountCreateData & { id?: number }) => {
    setIsSaving(true);
    try {
      if (accountData.id) {
        // Update existing account
        const { id, ...updateData } = accountData;
        await apiClient.updateBankAccount(id, updateData);
        showSuccess("Success", "Bank account updated successfully");
      } else {
        // Create new account
        await apiClient.createBankAccount(accountData);
        showSuccess("Success", "Bank account created successfully");
      }

      fetchBankAccounts();
      setShowModal(false);
      setSelectedAccount(null);
    } catch (err: any) {
      showError("Error", err.message || "Failed to save bank account");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    // Backend handles search, but we can do client-side filtering if needed
    return accounts;
  }, [accounts]);

  return (
    <DashboardLayout title="Bank Accounts" breadcrumbs={["Home", "Settings", "Bank Accounts"]}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bank Account Management</h2>
            <p className="text-gray-500 dark:text-gray-400">Employee bank accounts for payments</p>
          </div>
          <Button
            onClick={() => {
              setSelectedAccount(null);
              setShowModal(true);
            }}
          >
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading bank accounts...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? "No bank accounts found" : "No bank accounts"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first bank account"}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {filteredAccounts.map((account) => {
                const mappedAccount = mapBackendBankAccountListItemToFrontend(account);
                return (
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
                            <h3 className="text-lg font-semibold">{mappedAccount.bank_name}</h3>
                            <Badge variant="secondary">{mappedAccount.profile_name}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {mappedAccount.account_holder_name}
                          </p>
                          <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              <span>Account: {mappedAccount.account_number}</span>
                            </div>
                            <p>IFSC: {mappedAccount.ifsc_code}</p>
                            {mappedAccount.branch && <p>Branch: {mappedAccount.branch}</p>}
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
                );
              })}
            </div>

            {filteredAccounts.length > 0 && totalPages > 1 && (
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
        <BankAccountModal
          account={selectedAccount}
          employees={employees}
          onClose={() => {
            setShowModal(false);
            setSelectedAccount(null);
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </DashboardLayout>
  );
}

function BankAccountModal({
  account,
  employees,
  onClose,
  onSave,
  isSaving,
}: {
  account: BackendBankAccountListItem | null;
  employees: BackendEmployeeListItem[];
  onClose: () => void;
  onSave: (acc: BankAccountCreateData & { id?: number }) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    profile_id: account?.profile_id || 0,
    profile_name: account?.profile_name || "",
    profile_search: account?.profile_name || "",
    bank_name: account?.bank_name || "",
    account_number: account?.account_number || "",
    account_holder_name: account?.account_holder_name || account?.profile_name || "",
    ifsc_code: account?.ifsc_code || "",
    branch: account?.branch || "",
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Update form data when account changes (for editing)
  useEffect(() => {
    if (account) {
      setFormData({
        profile_id: account.profile_id,
        profile_name: account.profile_name || "",
        profile_search: account.profile_name || "",
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_holder_name: account.account_holder_name || account.profile_name || "",
        ifsc_code: account.ifsc_code,
        branch: account.branch || "",
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
      const fullName = employee.full_name?.toLowerCase() || "";
      return (
        fullName.includes(searchTerm) ||
        employee.employee_code.toLowerCase().includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm) ||
        employee.phone_number?.includes(searchTerm)
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

  const handleProfileSelect = (employee: BackendEmployeeListItem) => {
    setFormData({
      ...formData,
      profile_id: employee.profile_id,
      profile_name: employee.full_name || employee.employee_code,
      profile_search: employee.full_name || employee.employee_code,
      account_holder_name: employee.full_name || employee.employee_code,
    });
    setShowProfileDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profile_id) {
      showError("Error", "Please select a profile");
      return;
    }

    const accountData: BankAccountCreateData & { id?: number } = {
      id: account?.id,
      profile_id: formData.profile_id,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      branch: formData.branch || null,
    };

    await onSave(accountData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {account ? "Edit Bank Account" : "Add Bank Account"}
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
          {/* Profile Selection - Searchable Dropdown */}
          <div className="relative profile-dropdown-container">
            <label className="block text-sm font-medium mb-2">
              Profile (Employee) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.profile_search || formData.profile_name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    profile_search: e.target.value,
                    profile_id: 0,
                    profile_name: "",
                  });
                  setShowProfileDropdown(true);
                }}
                onFocus={() => {
                  if (employees.length > 0) {
                    setShowProfileDropdown(true);
                  }
                }}
                placeholder="Search by employee ID, name, email, or phone number"
                required
                disabled={isSaving}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {showProfileDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => {
                    const displayName = employee.full_name || employee.employee_code;
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleProfileSelect(employee)}
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
              disabled={isSaving}
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
              disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <Input
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {account ? "Updating..." : "Creating..."}
                </>
              ) : (
                account ? "Update Account" : "Add Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BankAccountsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Bank Accounts"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <BankAccountsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

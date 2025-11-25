'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AMC, AMCBilling, Client } from '@/types';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Mail,
  FileText,
  AlertCircle,
  Calendar,
  IndianRupee,
  Filter,
  Clock,
  Loader2,
  Inbox,
  X,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AMCFormModal } from '@/components/amcs/amc-form-modal';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
import {
  apiClient,
  AMCStatisticsResponse,
  AMCExpiringCountResponse,
  BackendAMCListItem,
  BackendAMCListResponse,
  BackendAMCDetail,
  BackendAMCBilling,
  BackendClientListItem,
  BackendClientListResponse,
} from '@/lib/api';
import { useDebounce } from 'use-debounce';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { showAlert, showDeleteConfirm } from '@/lib/sweetalert';

/**
 * Map backend AMC list item to frontend AMC type
 */
function mapBackendAMCToFrontend(backendAMC: BackendAMCListItem): AMC {
  return {
    id: backendAMC.id,
    client_id: backendAMC.client_id,
    client_name: backendAMC.client_name,
    amc_number: backendAMC.amc_number,
    start_date: backendAMC.start_date,
    end_date: backendAMC.end_date,
    status: backendAMC.status,
    billing_cycle: backendAMC.billing_cycle,
    amount: parseFloat(backendAMC.amount),
    description: undefined, // Not available in list endpoint
    notes: undefined, // Not available in list endpoint
    created_at: backendAMC.created_at,
    updated_at: backendAMC.created_at,
  };
}

/**
 * Map backend AMC detail to frontend AMC type
 */
function mapBackendAMCDetailToFrontend(backendAMC: BackendAMCDetail): AMC {
  return {
    id: backendAMC.id,
    client_id: backendAMC.client_id,
    client_name: backendAMC.client_name,
    amc_number: backendAMC.amc_number,
    start_date: backendAMC.start_date,
    end_date: backendAMC.end_date,
    status: backendAMC.status,
    billing_cycle: backendAMC.billing_cycle,
    amount: parseFloat(backendAMC.amount),
    description: undefined,
    notes: backendAMC.notes || undefined,
    created_at: backendAMC.created_at,
    updated_at: backendAMC.updated_at,
  };
}

/**
 * Map backend AMC billing to frontend AMCBilling type
 */
function mapBackendBillingToFrontend(backendBilling: BackendAMCBilling, amcId: number): AMCBilling {
  return {
    id: backendBilling.id,
    amc_id: amcId,
    bill_number: backendBilling.bill_number,
    period_from: backendBilling.period_from,
    period_to: backendBilling.period_to,
    amount: parseFloat(backendBilling.amount),
    paid: backendBilling.paid,
    payment_date: backendBilling.payment_date,
    payment_mode: backendBilling.payment_mode,
  };
}

/**
 * Map backend client list item to frontend Client type (for AMC form)
 */
function mapBackendClientToFrontendForAMC(backendClient: BackendClientListItem): Client {
  return {
    id: backendClient.id,
    name: backendClient.full_name || `${backendClient.first_name} ${backendClient.last_name}`,
    business_name: undefined,
    address: '',
    city: '',
    state: '',
    pin_code: '',
    country: 'India',
    primary_contact_name: backendClient.full_name || `${backendClient.first_name} ${backendClient.last_name}`,
    primary_contact_email: backendClient.email || '',
    primary_contact_phone: backendClient.phone_number || '',
    secondary_contact: undefined,
    notes: undefined,
    tags: [],
    amc_count: backendClient.has_active_amc ? 1 : 0,
    open_projects: 0,
    outstanding_amount: 0,
    last_activity: backendClient.created_at,
    created_at: backendClient.created_at,
    updated_at: backendClient.created_at,
  };
}

function AMCsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [statistics, setStatistics] = useState<AMCStatisticsResponse | null>(null);
  const [expiringCount, setExpiringCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingCycleFilter, setBillingCycleFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState<number | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBillingCycleDropdown, setShowBillingCycleDropdown] = useState(false);
  const [isAMCModalOpen, setIsAMCModalOpen] = useState(false);
  const [selectedAMC, setSelectedAMC] = useState<AMC | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [billingAMC, setBillingAMC] = useState<AMC | null>(null);
  const [emailAMC, setEmailAMC] = useState<AMC | null>(null);
  const [billingAMCDetail, setBillingAMCDetail] = useState<BackendAMCDetail | null>(null);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getAMCStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to fetch AMC statistics:', err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch expiring count
  const fetchExpiringCount = useCallback(async () => {
    try {
      const response = await apiClient.getAMCExpiringCount();
      setExpiringCount(response.count);
    } catch (err: any) {
      console.error('Failed to fetch expiring AMC count:', err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch clients for form modal
  const fetchClients = useCallback(async () => {
    try {
      const response: BackendClientListResponse = await apiClient.getClients();
      const mappedClients = response.results.map(mapBackendClientToFrontendForAMC);
      setClients(mappedClients);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      // Don't set error here, just log it
    }
  }, []);

  // Fetch AMCs
  const fetchAMCs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: {
        search?: string;
        status?: 'Pending' | 'Active' | 'Expired' | 'Canceled';
        billing_cycle?: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
        expiring_days?: number;
        page?: number;
      } = {};

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter as 'Pending' | 'Active' | 'Expired' | 'Canceled';
      }

      if (billingCycleFilter !== 'all') {
        params.billing_cycle = billingCycleFilter as 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
      }

      if (expiryFilter !== null) {
        params.expiring_days = expiryFilter;
      }

      const response: BackendAMCListResponse = await apiClient.getAMCs(params);
      const mappedAMCs = response.results.map(mapBackendAMCToFrontend);
      setAmcs(mappedAMCs);
    } catch (err: any) {
      console.error('Failed to fetch AMCs:', err);
      setError(err.message || 'Failed to load AMCs.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, statusFilter, billingCycleFilter, expiryFilter]);

  useEffect(() => {
    fetchStatistics();
    fetchExpiringCount();
    fetchClients();
  }, [fetchStatistics, fetchExpiringCount, fetchClients]);

  useEffect(() => {
    fetchAMCs();
  }, [fetchAMCs]);

  // Refresh expiring count when AMCs change
  useEffect(() => {
    fetchExpiringCount();
  }, [amcs, fetchExpiringCount]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-filter-dropdown-container')) {
        setShowStatusDropdown(false);
      }
      if (!target.closest('.billing-cycle-filter-dropdown-container')) {
        setShowBillingCycleDropdown(false);
      }
    };

    if (showStatusDropdown || showBillingCycleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown, showBillingCycleDropdown]);

  const statusFilterOptions = ['all', 'Active', 'Pending', 'Expired', 'Canceled'];
  const billingCycleFilterOptions = ['all', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly'];

  const getAMCStats = (amc: AMC) => {
    // For now, we'll need to fetch the detail to get billing info
    // This is a simplified version
    const daysToEnd = differenceInDays(new Date(amc.end_date), new Date());
    return { totalBills: 0, paidBills: 0, outstanding: 0, nextBill: null, daysToEnd };
  };

  const filteredAMCs = amcs; // Backend already filters, so we just use the results

  const handleCreateAMC = async (data: Partial<AMC>) => {
    setIsSaving(true);
    try {
      // Backend doesn't support 'Pending' status - only 'Active', 'Expired', 'Canceled'
      // Default to 'Active' if status is 'Pending' or not provided
      const status = data.status && data.status !== 'Pending' 
        ? data.status as 'Active' | 'Expired' | 'Canceled'
        : 'Active';
      
      const backendData = {
        client: data.client_id!,
        amc_number: data.amc_number!,
        amount: data.amount!,
        start_date: data.start_date!,
        end_date: data.end_date!,
        billing_cycle: data.billing_cycle!,
        status: status,
        notes: data.notes,
      };

      await apiClient.createAMC(backendData);
      showAlert('Success', 'AMC created successfully.', 'success');
      setIsAMCModalOpen(false);
      setSelectedAMC(null);
      fetchAMCs();
      fetchStatistics();
      fetchExpiringCount();
    } catch (err: any) {
      console.error('Failed to create AMC:', err);
      showAlert('Error', err.message || 'Failed to create AMC.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAMC = async (data: Partial<AMC>) => {
    if (!selectedAMC) return;

    setIsSaving(true);
    try {
      const backendData: Partial<{
        client: number;
        amc_number: string;
        amount: number;
        start_date: string;
        end_date: string;
        billing_cycle: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
        status: 'Active' | 'Expired' | 'Canceled';
        notes: string;
      }> = {};

      if (data.client_id) backendData.client = data.client_id;
      if (data.amc_number) backendData.amc_number = data.amc_number;
      if (data.amount !== undefined) backendData.amount = data.amount;
      if (data.start_date) backendData.start_date = data.start_date;
      if (data.end_date) backendData.end_date = data.end_date;
      if (data.billing_cycle) backendData.billing_cycle = data.billing_cycle;
      // Only include status if it's a valid backend status (exclude 'Pending')
      if (data.status && data.status !== 'Pending') {
        backendData.status = data.status as 'Active' | 'Expired' | 'Canceled';
      }
      if (data.notes !== undefined) backendData.notes = data.notes;

      await apiClient.updateAMC(selectedAMC.id, backendData);
      showAlert('Success', 'AMC updated successfully.', 'success');
      setIsAMCModalOpen(false);
      setSelectedAMC(null);
      fetchAMCs();
      fetchStatistics();
      fetchExpiringCount();
    } catch (err: any) {
      console.error('Failed to update AMC:', err);
      showAlert('Error', err.message || 'Failed to update AMC.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAMCSubmit = (data: Partial<AMC>) => {
    if (selectedAMC) {
      handleUpdateAMC(data);
    } else {
      handleCreateAMC(data);
    }
  };

  const handleNewAMC = () => {
    setSelectedAMC(null);
    setIsAMCModalOpen(true);
  };

  // Check for action=new in URL params and open modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      handleNewAMC();
      // Remove the query parameter from URL
      router.replace('/amcs');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEditAMC = async (amc: AMC) => {
    try {
      // Fetch full AMC details
      const backendAMC = await apiClient.getAMC(amc.id);
      const fullAMC = mapBackendAMCDetailToFrontend(backendAMC);
      setSelectedAMC(fullAMC);
    setIsAMCModalOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch AMC details:', err);
      showAlert('Error', err.message || 'Failed to load AMC details.', 'error');
    }
  };

  const handleDeleteAMC = async (amcId: number) => {
    const confirmed = await showDeleteConfirm('this AMC');
    if (confirmed) {
      try {
        await apiClient.deleteAMC(amcId);
        showAlert('Success', 'AMC deleted successfully.', 'success');
        fetchAMCs();
        fetchStatistics();
        fetchExpiringCount();
      } catch (err: any) {
        console.error('Failed to delete AMC:', err);
        showAlert('Error', err.message || 'Failed to delete AMC.', 'error');
      }
    }
  };

  const handleViewBilling = async (amc: AMC) => {
    try {
      const backendAMC = await apiClient.getAMC(amc.id);
      setBillingAMCDetail(backendAMC);
      setBillingAMC(amc);
      setShowBillingModal(true);
    } catch (err: any) {
      console.error('Failed to fetch AMC billing details:', err);
      showAlert('Error', err.message || 'Failed to load billing details.', 'error');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      Canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
    return classes[status as keyof typeof classes] || classes.Pending;
  };

  const getExpiryBadgeClass = (days: number) => {
    if (days <= 7) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 15) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    if (days <= 30) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  if (isLoading && amcs.length === 0) {
    return (
      <DashboardLayout title="AMCs" breadcrumbs={['Home', 'AMCs']}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="ml-3 text-gray-500">Loading AMCs...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && amcs.length === 0) {
    return (
      <DashboardLayout title="AMCs" breadcrumbs={['Home', 'AMCs']}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading AMCs: {error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchAMCs();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Loader2 className="h-4 w-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AMCs" breadcrumbs={['Home', 'AMCs']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AMCs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage Annual Maintenance Contracts and billing
            </p>
          </div>
          <button 
            onClick={handleNewAMC}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            New AMC
          </button>
        </div>

        {/* Alert Banner - Show only if expiringCount > 0 */}
        {expiringCount > 0 && expiryFilter === null && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-300">
                {expiringCount} AMC{expiringCount > 1 ? 's' : ''} expiring in next 30 days
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                Review and plan renewals to avoid service interruptions
              </p>
            </div>
            <button
              onClick={() => setExpiryFilter(30)}
              className="text-sm font-medium text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
            >
              View
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total AMCs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.total_amcs ?? amcs.length}
                </p>
              </div>
              <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-900/20">
                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active AMCs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.active_amcs ?? amcs.filter((a) => a.status === 'Active').length}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.expiring_soon ?? expiringCount}
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Bills</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics?.pending_bills ?? 0}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <IndianRupee className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by AMC Number or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <div className="relative status-filter-dropdown-container">
              <button
                type="button"
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowBillingCycleDropdown(false);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex items-center justify-between min-w-[120px]"
              >
                <span>{statusFilter === "all" ? "All Status" : statusFilter}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {statusFilterOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {status === "all" ? "All Status" : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative billing-cycle-filter-dropdown-container">
            <button
              type="button"
              onClick={() => {
                setShowBillingCycleDropdown(!showBillingCycleDropdown);
                setShowStatusDropdown(false);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex items-center justify-between min-w-[130px]"
            >
              <span>{billingCycleFilter === "all" ? "All Cycles" : billingCycleFilter}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
            </button>
            {showBillingCycleDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {billingCycleFilterOptions.map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => {
                      setBillingCycleFilter(cycle);
                      setShowBillingCycleDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {cycle === "all" ? "All Cycles" : cycle}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setExpiryFilter(expiryFilter === 7 ? null : 7)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                expiryFilter === 7
                  ? 'bg-sky-500 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setExpiryFilter(expiryFilter === 15 ? null : 15)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                expiryFilter === 15
                  ? 'bg-sky-500 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              15 days
            </button>
            <button
              onClick={() => setExpiryFilter(expiryFilter === 30 ? null : 30)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                expiryFilter === 30
                  ? 'bg-sky-500 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              30 days
            </button>
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            <FileText className="h-4 w-4" />
            Generate Missing Bills
          </button>
        </div>

        {/* AMC Table */}
        {filteredAMCs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No AMCs found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {amcs.length === 0
                ? 'Get started by creating your first AMC contract'
                : 'Try adjusting your search or filters'}
            </p>
            {amcs.length === 0 && (
              <button
                onClick={handleNewAMC}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Plus className="h-4 w-4" />
                New AMC
              </button>
            )}
          </div>
        ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    AMC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Billing Cycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Days Until Expiry
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAMCs.map((amc) => {
                  const stats = getAMCStats(amc);
                    const daysToEnd = differenceInDays(new Date(amc.end_date), new Date());
                  return (
                      <tr key={amc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                            onClick={() => handleViewBilling(amc)}
                          className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                        >
                          {amc.amc_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{amc.client_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {format(new Date(amc.start_date), 'dd MMM yyyy')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(amc.end_date), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {amc.billing_cycle}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹{amc.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            amc.status
                          )}`}
                        >
                          {amc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          {daysToEnd >= 0 ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getExpiryBadgeClass(
                                daysToEnd
                            )}`}
                          >
                              {daysToEnd} days left
                          </span>
                        ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                              onClick={() => handleViewBilling(amc)}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            title="View Billing Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditAMC(amc)}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            title="Edit AMC"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEmailAMC(amc);
                              setShowEmailModal(true);
                            }}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAMC(amc.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                            title="Delete AMC"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* AMC Form Modal */}
        <AMCFormModal
          isOpen={isAMCModalOpen}
          onClose={() => {
            setIsAMCModalOpen(false);
            setSelectedAMC(null);
          }}
          onSubmit={handleAMCSubmit}
          amc={selectedAMC}
          clients={clients}
        />

        {/* Billing Details Modal */}
        {showBillingModal && billingAMC && billingAMCDetail && (
          <AMCBillingModal
            amc={billingAMC}
            billings={billingAMCDetail.billings.map((b) => mapBackendBillingToFrontend(b, billingAMC.id))}
            onClose={() => {
              setShowBillingModal(false);
              setBillingAMC(null);
              setBillingAMCDetail(null);
            }}
            onUpdateBilling={async (billingId: number, updates: Partial<AMCBilling>) => {
              try {
                await apiClient.updateAMCBilling(billingId, {
                  paid: updates.paid ?? false,
                  payment_date: updates.payment_date,
                  payment_mode: updates.payment_mode,
                  notes: updates.notes,
                });
                // Refresh billing details
                if (billingAMC) {
                  const backendAMC = await apiClient.getAMC(billingAMC.id);
                  setBillingAMCDetail(backendAMC);
                }
              } catch (err: any) {
                console.error('Failed to update billing:', err);
                showAlert('Error', err.message || 'Failed to update billing status.', 'error');
              }
            }}
          />
        )}

        {/* Email Template Modal */}
        {showEmailModal && emailAMC && (
          <EmailTemplateModal
            amc={emailAMC}
            onClose={() => {
              setShowEmailModal(false);
              setEmailAMC(null);
            }}
            onSend={(template, message) => {
              showAlert('Info', 'Email sending functionality will be implemented in the backend API.', 'info');
              setShowEmailModal(false);
              setEmailAMC(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AMCsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <DashboardLayout title="AMCs">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-500">Loading...</div>
            </div>
          </DashboardLayout>
        }
      >
        <AMCsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function AMCBillingModal({
  amc,
  billings,
  onClose,
  onUpdateBilling,
}: {
  amc: AMC;
  billings: AMCBilling[];
  onClose: () => void;
  onUpdateBilling: (billingId: number, updates: Partial<AMCBilling>) => void;
}) {
  const totalAmount = billings.reduce((sum, b) => sum + b.amount, 0);
  const paidAmount = billings.filter((b) => b.paid).reduce((sum, b) => sum + b.amount, 0);
  const outstandingAmount = totalAmount - paidAmount;

  const handleTogglePaid = async (billing: AMCBilling) => {
    const newPaidStatus = !billing.paid;
    const updates: Partial<AMCBilling> = {
      paid: newPaidStatus,
      payment_date: newPaidStatus ? new Date().toISOString().split('T')[0] : undefined,
      payment_mode: newPaidStatus ? 'Bank Transfer' : undefined,
    };
    await onUpdateBilling(billing.id, updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">AMC Billing Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {amc.amc_number} - {amc.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-400">Paid</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
                ₹{paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">Outstanding</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
                ₹{outstandingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Billing Table */}
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Bill Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Payment Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {billings.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {bill.bill_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(bill.period_from), 'dd MMM yyyy')} -{' '}
                      {format(new Date(bill.period_to), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{bill.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {bill.paid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {bill.paid && bill.payment_date ? (
                        <div>
                          <div>{format(new Date(bill.payment_date), 'dd MMM yyyy')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{bill.payment_mode}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePaid(bill)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          bill.paid
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {bill.paid ? 'Mark Pending' : 'Mark Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {billings.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">No billing records found</p>
            </div>
          )}
        </div>

        <div className="border-t dark:border-gray-800 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailTemplateModal({
  amc,
  onClose,
  onSend,
}: {
  amc: AMC;
  onClose: () => void;
  onSend: (template: string, message: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const emailTemplates = [
    {
      id: 'renewal_reminder',
      name: 'AMC Renewal Reminder',
      subject: 'AMC Renewal Due - {{amc_number}}',
      placeholders: ['{{client_name}}', '{{amc_number}}', '{{end_date}}', '{{amount}}'],
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      subject: 'Payment Due for AMC - {{amc_number}}',
      placeholders: ['{{client_name}}', '{{amc_number}}', '{{outstanding_amount}}', '{{due_date}}'],
    },
    {
      id: 'service_notification',
      name: 'Service Notification',
      subject: 'Scheduled Service - {{amc_number}}',
      placeholders: ['{{client_name}}', '{{amc_number}}', '{{service_date}}', '{{location}}'],
    },
  ];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setEmailMessage(
        `Dear {{client_name}},\n\nThis is regarding your AMC contract {{amc_number}}.\n\n[Your message here]\n\nBest regards,\nElectrocom Team`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="border-b dark:border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Send Email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              To: {amc.client_name} - {amc.amc_number}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Template
            </label>
            <CustomDropdown
              value={selectedTemplate}
              onChange={(value) => handleTemplateChange(value)}
              options={[
                { value: 'renewal_reminder', label: 'AMC Renewal Reminder' },
                { value: 'payment_reminder', label: 'Payment Reminder' },
                { value: 'service_notification', label: 'Service Notification' },
              ]}
              placeholder="Select a template"
            />
          </div>

          {selectedTemplate && (
            <>
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-sky-900 dark:text-sky-300 mb-2">
                  Available Placeholders:
                </p>
                <div className="flex flex-wrap gap-2">
                  {emailTemplates
                    .find((t) => t.id === selectedTemplate)
                    ?.placeholders.map((placeholder) => (
                    <code
                      key={placeholder}
                      className="px-2 py-1 bg-white dark:bg-gray-800 border border-sky-200 dark:border-sky-800 rounded text-xs font-mono text-sky-700 dark:text-sky-400"
                    >
                      {placeholder}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Type your message here..."
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t dark:border-gray-800 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedTemplate && onSend(selectedTemplate, emailMessage)}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

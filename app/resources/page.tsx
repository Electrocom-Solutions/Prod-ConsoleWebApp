"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Package, X, Loader2, Inbox } from "lucide-react";
import { Resource } from "@/types";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showError, showSuccess, showAlert, showConfirm } from "@/lib/sweetalert";
import { apiClient, StockStatisticsResponse, BackendStockListItem, StockListResponse, StockDetail, StockCreateData } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Map backend stock list item to frontend Resource type
 */
function mapBackendStockToFrontend(backendStock: BackendStockListItem): Resource {
  return {
    id: backendStock.id,
    name: backendStock.name,
    unit_of_measure: backendStock.unit_of_measure,
    stock_count: parseFloat(backendStock.quantity) || 0,
    unit_price: parseFloat(backendStock.price) || 0,
    description: backendStock.description || undefined,
    created_at: backendStock.created_at,
    updated_at: backendStock.updated_at,
  };
}

function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [statistics, setStatistics] = useState<StockStatisticsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [showModal, setShowModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch statistics from backend
   */
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await apiClient.getStockStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching stock statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, []);

  /**
   * Fetch resources from backend
   */
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response: StockListResponse = await apiClient.getStocks(params);
      const mappedResources = response.results.map(mapBackendStockToFrontend);
      setResources(mappedResources);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching stock items:', err);
      setError(err.message || 'Failed to fetch stock items');
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  // Fetch statistics and resources on mount and when filters change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Check for action=new URL parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setSelectedResource(null);
      setShowModal(true);
    }
  }, [searchParams]);

  const handleDelete = async (resource: Resource) => {
    const confirmed = await showConfirm(
      "Delete Resource",
      `Are you sure you want to delete ${resource.name}? This action cannot be undone.`,
      "Yes, delete it",
      "Cancel"
    );

    if (!confirmed) return;

    try {
      await apiClient.deleteStock(resource.id);
      await showSuccess("Resource deleted successfully");
      fetchResources();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to delete resource");
    }
  };

  const handleSaveResource = async (resourceData: StockCreateData) => {
    setIsSaving(true);
    try {
      if (selectedResource) {
        // Update existing resource
        await apiClient.updateStock(selectedResource.id, resourceData);
        await showSuccess("Resource updated successfully");
      } else {
        // Create new resource
        await apiClient.createStock(resourceData);
        await showSuccess("Resource created successfully");
      }
      setShowModal(false);
      setSelectedResource(null);
      fetchResources();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to save resource");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustStock = async (newStock: number) => {
    if (!selectedResource) return;

    setIsSaving(true);
    try {
      await apiClient.updateStock(selectedResource.id, { quantity: newStock });
      await showSuccess("Stock adjusted successfully");
      setShowStockModal(false);
      setSelectedResource(null);
      fetchResources();
      fetchStatistics();
    } catch (err: any) {
      await showAlert("Error", err.message || "Failed to adjust stock");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Resources" breadcrumbs={["Home", "Inventory", "Resources"]}>
      <div className="space-y-6">
        {/* Statistics Tiles - Moved to Top */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
              <div className="text-2xl font-bold mt-1">{statistics.total_resources}</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Inventory Value</div>
              <div className="text-2xl font-bold mt-1 text-sky-600">
                ₹{statistics.total_inventory_value.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</div>
              <div className="text-2xl font-bold mt-1 text-red-600">
                {statistics.low_stock_items}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => {
            setSelectedResource(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit of Measure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading resources...</span>
                      </div>
                    </td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No resources found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or add a new resource</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => {
                    const totalValue = (resource.stock_count || 0) * (resource.unit_price || 0);
                    const isLowStock = resource.stock_count !== undefined && resource.stock_count < 100;
                    
                    return (
                      <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{resource.name}</div>
                              {resource.description && (
                                <div className="text-xs text-gray-500">{resource.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {resource.unit_of_measure}
                        </td>
                        <td className="px-6 py-4">
                          {resource.stock_count !== undefined ? (
                            <div className={cn(
                              "text-sm font-medium",
                              isLowStock && "text-red-600 dark:text-red-400"
                            )}>
                              {resource.stock_count.toLocaleString()}
                              {isLowStock && (
                                <span className="ml-2 text-xs">(Low Stock)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {resource.unit_price ? `₹${resource.unit_price.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {totalValue > 0 ? `₹${totalValue.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {resource.stock_count !== undefined && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedResource(resource);
                                  setShowStockModal(true);
                                }}
                                title="Adjust Stock"
                                className="text-sky-600"
                              >
                                Adjust
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedResource(resource);
                                setShowModal(true);
                              }}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(resource)}
                              title="Delete"
                              className="text-red-600"
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
          
          {resources.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
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
        </div>
      </div>

      {showModal && (
        <ResourceModal
          resource={selectedResource}
          isSaving={isSaving}
          onClose={() => {
            setShowModal(false);
            setSelectedResource(null);
          }}
          onSave={handleSaveResource}
        />
      )}

      {showStockModal && selectedResource && (
        <StockAdjustModal
          resource={selectedResource}
          isSaving={isSaving}
          onClose={() => {
            setShowStockModal(false);
            setSelectedResource(null);
          }}
          onSave={handleAdjustStock}
        />
      )}
    </DashboardLayout>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardLayout title="Resources"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div></DashboardLayout>}>
        <ResourcesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function ResourceModal({
  resource,
  isSaving,
  onClose,
  onSave,
}: {
  resource: Resource | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (resourceData: StockCreateData) => Promise<void>;
}) {
  const [name, setName] = useState(resource?.name || "");
  const [unitOfMeasure, setUnitOfMeasure] = useState(resource?.unit_of_measure || "");
  const [stockCount, setStockCount] = useState(resource?.stock_count?.toString() || "0");
  const [unitPrice, setUnitPrice] = useState(resource?.unit_price?.toString() || "0");
  const [description, setDescription] = useState(resource?.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resourceData: StockCreateData = {
      name,
      unit_of_measure: unitOfMeasure,
      quantity: stockCount ? parseFloat(stockCount) : 0,
      price: unitPrice ? parseFloat(unitPrice) : 0,
      description: description || undefined,
    };
    await onSave(resourceData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {resource ? "Edit Resource" : "Add Resource"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Resource Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Network Cable"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <Input
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              placeholder="e.g., meters, pieces, units"
              required
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stock Count <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="0"
                min="0"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Unit Price (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Optional description"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {resource ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  {resource ? "Update" : "Add"} Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockAdjustModal({
  resource,
  isSaving,
  onClose,
  onSave,
}: {
  resource: Resource;
  isSaving: boolean;
  onClose: () => void;
  onSave: (newStock: number) => Promise<void>;
}) {
  const [adjustment, setAdjustment] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adjustValue = parseFloat(adjustment);
    if (isNaN(adjustValue) || adjustValue <= 0) {
      await showError("Invalid Input", "Please enter a valid positive number");
      return;
    }
    
    const currentStock = resource.stock_count || 0;
    const newStock = type === "add" ? currentStock + adjustValue : currentStock - adjustValue;
    
    if (newStock < 0) {
      await showError("Invalid Stock", "Stock cannot be negative!");
      return;
    }
    
    await onSave(newStock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resource</label>
            <Input value={resource.name} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Current Stock</label>
            <Input value={`${resource.stock_count || 0} ${resource.unit_of_measure}`} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Adjustment Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={type === "add"}
                  onChange={() => setType("add")}
                  disabled={isSaving}
                  className="text-sky-600"
                />
                <span>Add Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={type === "remove"}
                  onChange={() => setType("remove")}
                  disabled={isSaving}
                  className="text-sky-600"
                />
                <span>Remove Stock</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="Enter quantity"
              min="0.01"
              required
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                "Adjust Stock"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Package, X } from "lucide-react";
import { Resource } from "@/types";
import { mockResources } from "@/lib/mock-data/resources";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showError } from "@/lib/sweetalert";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const filteredResources = resources.filter((resource) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this resource");
    if (confirmed) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <DashboardLayout title="Resources" breadcrumbs={["Home", "Inventory", "Resources"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredResources.map((resource) => {
                  const totalValue = (resource.stock_count || 0) * (resource.unit_price || 0);
                  const isLowStock = resource.stock_count && resource.stock_count < 100;
                  
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
                        {resource.unit_price ? `₹${resource.unit_price.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {totalValue > 0 ? `₹${totalValue.toLocaleString()}` : "-"}
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
                            onClick={() => handleDelete(resource.id)}
                            title="Delete"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
            <div className="text-2xl font-bold mt-1">{resources.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Inventory Value</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">
              ₹{resources.reduce((sum, r) => sum + ((r.stock_count || 0) * (r.unit_price || 0)), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {resources.filter(r => r.stock_count && r.stock_count < 100).length}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ResourceModal
          resource={selectedResource}
          onClose={() => setShowModal(false)}
          onSave={(resource) => {
            if (selectedResource) {
              setResources(prev => prev.map(r => r.id === resource.id ? resource : r));
            } else {
              setResources(prev => [resource, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}

      {showStockModal && selectedResource && (
        <StockAdjustModal
          resource={selectedResource}
          onClose={() => setShowStockModal(false)}
          onSave={(newStock) => {
            setResources(prev => prev.map(r => 
              r.id === selectedResource.id ? { ...r, stock_count: newStock, updated_at: new Date().toISOString() } : r
            ));
            setShowStockModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function ResourceModal({
  resource,
  onClose,
  onSave,
}: {
  resource: Resource | null;
  onClose: () => void;
  onSave: (resource: Resource) => void;
}) {
  const [name, setName] = useState(resource?.name || "");
  const [unitOfMeasure, setUnitOfMeasure] = useState(resource?.unit_of_measure || "");
  const [stockCount, setStockCount] = useState(resource?.stock_count?.toString() || "");
  const [unitPrice, setUnitPrice] = useState(resource?.unit_price?.toString() || "");
  const [description, setDescription] = useState(resource?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedResource: Resource = {
      id: resource?.id || Date.now(),
      name,
      unit_of_measure: unitOfMeasure,
      stock_count: stockCount ? parseInt(stockCount) : undefined,
      unit_price: unitPrice ? parseFloat(unitPrice) : undefined,
      description: description || undefined,
      created_at: resource?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(savedResource);
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Count</label>
              <Input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Unit Price (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {resource ? "Update" : "Add"} Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockAdjustModal({
  resource,
  onClose,
  onSave,
}: {
  resource: Resource;
  onClose: () => void;
  onSave: (newStock: number) => void;
}) {
  const [adjustment, setAdjustment] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustValue = parseInt(adjustment);
    const currentStock = resource.stock_count || 0;
    const newStock = type === "add" ? currentStock + adjustValue : currentStock - adjustValue;
    
    if (newStock < 0) {
      showError("Invalid Stock", "Stock cannot be negative!");
      return;
    }
    
    onSave(newStock);
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
                  className="text-sky-600"
                />
                <span>Add Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={type === "remove"}
                  onChange={() => setType("remove")}
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
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Adjust Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

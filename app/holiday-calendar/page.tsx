"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { showDeleteConfirm } from "@/lib/sweetalert";

type Holiday = {
  id: number;
  name: string;
  date: string;
  type: "Public" | "Optional" | "Restricted";
  description?: string;
  created_at: string;
};

const mockHolidays: Holiday[] = [
  {
    id: 1,
    name: "Republic Day",
    date: "2026-01-26",
    type: "Public",
    description: "National holiday celebrating India's constitution",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Holi",
    date: "2026-03-14",
    type: "Public",
    description: "Festival of colors",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Good Friday",
    date: "2026-04-03",
    type: "Optional",
    description: "Christian holiday",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "Independence Day",
    date: "2026-08-15",
    type: "Public",
    description: "National holiday celebrating India's independence",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "Diwali",
    date: "2026-11-01",
    type: "Public",
    description: "Festival of lights",
    created_at: "2025-01-01T00:00:00Z",
  },
];

export default function HolidayCalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays);
  const [showModal, setShowModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [filterType, setFilterType] = useState("all");

  const filteredHolidays = holidays
    .filter(h => filterType === "all" || h.type === filterType)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this holiday");
    if (confirmed) {
      setHolidays(prev => prev.filter(h => h.id !== id));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Public":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Optional":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Restricted":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Holiday Calendar" breadcrumbs={["Home", "Settings", "Holiday Calendar"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Holiday Calendar</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage holidays and leave calendar</p>
          </div>
          <Button onClick={() => {
            setSelectedHoliday(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Holidays</div>
            <div className="text-2xl font-bold mt-1">{holidays.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Public Holidays</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {holidays.filter(h => h.type === "Public").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Optional Holidays</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {holidays.filter(h => h.type === "Optional").length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Public">Public</option>
            <option value="Optional">Optional</option>
            <option value="Restricted">Restricted</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Holiday Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredHolidays.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {format(new Date(holiday.date), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{holiday.name}</td>
                  <td className="px-6 py-4">
                    <Badge className={getTypeColor(holiday.type)}>
                      {holiday.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHoliday(holiday);
                          setShowModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(holiday.id)}
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

        {filteredHolidays.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium">No holidays found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filterType === "all" 
                ? "Get started by adding your first holiday"
                : `No ${filterType} holidays found`}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <HolidayModal
          holiday={selectedHoliday}
          onClose={() => setShowModal(false)}
          onSave={(hol) => {
            if (selectedHoliday) {
              setHolidays(prev => prev.map(h => h.id === hol.id ? hol : h));
            } else {
              setHolidays(prev => [hol, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function HolidayModal({ holiday, onClose, onSave }: {
  holiday: Holiday | null;
  onClose: () => void;
  onSave: (hol: Holiday) => void;
}) {
  const [formData, setFormData] = useState({
    name: holiday?.name || "",
    date: holiday?.date || "",
    type: holiday?.type || "Public",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedHoliday: Holiday = {
      id: holiday?.id || Date.now(),
      ...formData,
      created_at: holiday?.created_at || new Date().toISOString(),
    };
    onSave(savedHoliday);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {holiday ? "Edit Holiday" : "Add Holiday"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="Public">Public</option>
              <option value="Optional">Optional</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {holiday ? "Update" : "Add"} Holiday
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

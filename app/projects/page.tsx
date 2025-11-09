"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, Trash2, X } from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showAlert } from "@/lib/sweetalert";
import { mockClients, getClientById } from "@/lib/mock-data/clients";

const mockProjects: Project[] = [
  {
    id: 1,
    client_id: 1,
    name: "BSNL Network Expansion",
    description: "Installation of HT panels and network equipment",
    start_date: "2025-01-15",
    end_date: "2025-06-15",
    status: "In Progress",
    created_at: "2025-01-10T10:00:00Z",
    updated_at: "2025-01-10T10:00:00Z",
  },
  {
    id: 2,
    client_id: 2,
    name: "DataNet Server Room Setup",
    description: "Complete server room infrastructure setup",
    start_date: "2025-02-01",
    end_date: "2025-04-30",
    status: "Planned",
    created_at: "2025-01-20T10:00:00Z",
    updated_at: "2025-01-20T10:00:00Z",
  },
  {
    id: 3,
    client_id: 3,
    name: "PowerGrid Transformer Maintenance",
    description: "Annual maintenance of transformers",
    start_date: "2024-11-01",
    end_date: "2024-12-31",
    status: "Completed",
    created_at: "2024-10-25T10:00:00Z",
    updated_at: "2025-01-05T10:00:00Z",
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = await showDeleteConfirm("this project");
    if (confirmed) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planned":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Progress":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "On Hold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <DashboardLayout title="Projects" breadcrumbs={["Home", "Projects"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => {
            setSelectedProject(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(project.status))}>
                      {project.status}
                    </span>
                  </div>
                  {project.client_id && (
                    <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">
                      Client: {getClientById(project.client_id)?.name || `Client #${project.client_id}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Navigate to Tasks page with project filter
                      router.push(`/tasks?project=${encodeURIComponent(project.name)}`);
                    }}
                    title="View Tasks"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowModal(true);
                    }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    title="Delete"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setShowModal(false)}
          onSave={(project) => {
            if (selectedProject) {
              setProjects(prev => prev.map(p => p.id === project.id ? project : p));
            } else {
              setProjects(prev => [project, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function ProjectModal({
  project,
  onClose,
  onSave,
}: {
  project: Project | null;
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  const [name, setName] = useState(project?.name || "");
  const [clientId, setClientId] = useState(project?.client_id || mockClients[0]?.id || 1);
  const [description, setDescription] = useState(project?.description || "");
  const [startDate, setStartDate] = useState(project?.start_date || "");
  const [endDate, setEndDate] = useState(project?.end_date || "");
  const [status, setStatus] = useState<"Planned" | "In Progress" | "On Hold" | "Completed" | "Canceled">(project?.status || "Planned");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedProject: Project = {
      id: project?.id || Date.now(),
      client_id: clientId,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      status: status as any,
      created_at: project?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(savedProject);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-semibold">
            {project ? "Edit Project" : "Create Project"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              {mockClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Network Infrastructure Setup"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? "Update" : "Create"} Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

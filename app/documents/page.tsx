'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UploadTemplateModal } from '@/components/documents/upload-template-modal';
import { VersionHistoryModal } from '@/components/documents/version-history-modal';
import { PreviewModal } from '@/components/documents/preview-modal';
import { DocumentTemplate, DocumentVersion, Client } from '@/types';
import {
  Search,
  Plus,
  Grid3x3,
  List,
  Download,
  Eye,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Tag,
  Filter,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { showDeleteConfirm, showAlert } from '@/lib/sweetalert';

const mockClients: Client[] = [
  {
    id: 1,
    name: "ABC Power Solutions Ltd",
    business_name: "ABC Power",
    address: "123 Industrial Area, Sector 45",
    city: "Mumbai",
    state: "Maharashtra",
    pin_code: "400001",
    country: "India",
    primary_contact_name: "Rajesh Kumar",
    primary_contact_email: "rajesh@abcpower.com",
    primary_contact_phone: "9876543210",
    tags: ["premium", "long-term"],
    amc_count: 5,
    open_projects: 2,
    outstanding_amount: 125000,
    last_activity: "2025-10-30T10:30:00Z",
    created_at: "2023-01-15T00:00:00Z",
    updated_at: "2025-10-30T10:30:00Z",
  },
  {
    id: 2,
    name: "XYZ Industries",
    address: "456 Tech Park, Phase 2",
    city: "Pune",
    state: "Maharashtra",
    pin_code: "411001",
    country: "India",
    primary_contact_name: "Priya Sharma",
    primary_contact_email: "priya@xyzind.com",
    primary_contact_phone: "9765432109",
    tags: ["industrial", "regular"],
    amc_count: 3,
    open_projects: 1,
    outstanding_amount: 75000,
    last_activity: "2025-10-28T14:20:00Z",
    created_at: "2023-06-20T00:00:00Z",
    updated_at: "2025-10-28T14:20:00Z",
  },
  {
    id: 3,
    name: "TechCorp Solutions",
    business_name: "TechCorp IT Services",
    address: "789 Software City, Building A",
    city: "Bangalore",
    state: "Karnataka",
    pin_code: "560001",
    country: "India",
    primary_contact_name: "Amit Patel",
    primary_contact_email: "amit@techcorp.com",
    primary_contact_phone: "9654321098",
    tags: ["tech", "corporate"],
    amc_count: 4,
    open_projects: 3,
    outstanding_amount: 0,
    last_activity: "2025-11-01T09:15:00Z",
    created_at: "2024-02-10T00:00:00Z",
    updated_at: "2025-11-01T09:15:00Z",
  },
  {
    id: 4,
    name: "Metro Mall Services",
    address: "Metro Plaza, MG Road",
    city: "Delhi",
    state: "Delhi",
    pin_code: "110001",
    country: "India",
    primary_contact_name: "Sunita Verma",
    primary_contact_email: "sunita@metromall.com",
    primary_contact_phone: "9543210987",
    tags: ["retail", "commercial"],
    amc_count: 2,
    open_projects: 0,
    outstanding_amount: 50000,
    last_activity: "2025-10-25T16:45:00Z",
    created_at: "2024-08-05T00:00:00Z",
    updated_at: "2025-10-25T16:45:00Z",
  },
];

const mockTemplates: DocumentTemplate[] = [
  {
    id: 1,
    title: 'AMC Service Agreement - ABC Power',
    category: 'AMC',
    firm_id: 1,
    tags: ['agreement', 'service', 'contract'],
    latest_version_number: 3,
    created_by: 'Admin User',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-10-20T14:30:00Z',
  },
  {
    id: 2,
    title: 'Tender Document - National Electrical Grid',
    category: 'Tender Document',
    firm_id: 2,
    tags: ['tender', 'national', 'grid'],
    latest_version_number: 2,
    created_by: 'John Doe',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-09-15T11:20:00Z',
  },
  {
    id: 3,
    title: 'Work Order - IT Infrastructure Setup',
    category: 'Work Order',
    firm_id: 3,
    tags: ['work-order', 'infrastructure', 'it'],
    latest_version_number: 5,
    created_by: 'Finance Team',
    created_at: '2024-11-10T08:00:00Z',
    updated_at: '2025-10-28T16:45:00Z',
  },
  {
    id: 4,
    title: 'Experience Certificate Template',
    category: 'Experience Certificate',
    tags: ['employee', 'hr', 'certificate'],
    latest_version_number: 4,
    created_by: 'HR Manager',
    created_at: '2025-03-05T12:00:00Z',
    updated_at: '2025-10-10T10:15:00Z',
  },
  {
    id: 5,
    title: 'Affidavit - License Compliance',
    category: 'Affidavit',
    firm_id: 4,
    tags: ['affidavit', 'compliance', 'legal'],
    latest_version_number: 1,
    created_by: 'Legal Team',
    created_at: '2025-10-01T07:30:00Z',
    updated_at: '2025-10-01T07:30:00Z',
  },
  {
    id: 6,
    title: 'Invoice Template - Standard',
    category: 'Invoice',
    firm_id: 1,
    tags: ['invoice', 'billing', 'payment'],
    latest_version_number: 2,
    created_by: 'Finance Officer',
    created_at: '2025-05-20T14:00:00Z',
    updated_at: '2025-08-25T09:40:00Z',
  },
  {
    id: 7,
    title: 'Work Order - Electrical Panel Installation',
    category: 'Work Order',
    firm_id: 2,
    tags: ['work-order', 'installation', 'electrical'],
    latest_version_number: 1,
    created_by: 'Project Manager',
    created_at: '2025-09-10T08:00:00Z',
    updated_at: '2025-09-10T08:00:00Z',
  },
];

const mockVersions: Record<number, DocumentVersion[]> = {
  1: [
    {
      id: 1,
      template_id: 1,
      version_number: 3,
      file_name: 'AMC_Service_Agreement_v3.pdf',
      file_type: 'pdf',
      file_size: 245760,
      file_url: '/sample.pdf',
      is_published: true,
      uploaded_by: 'Admin User',
      uploaded_at: '2025-10-20T14:30:00Z',
      notes: 'Updated payment terms section',
    },
    {
      id: 2,
      template_id: 1,
      version_number: 2,
      file_name: 'AMC_Service_Agreement_v2.pdf',
      file_type: 'pdf',
      file_size: 238400,
      file_url: '/sample.pdf',
      is_published: false,
      uploaded_by: 'Admin User',
      uploaded_at: '2025-06-10T11:15:00Z',
      notes: 'Added service level agreements',
    },
    {
      id: 3,
      template_id: 1,
      version_number: 1,
      file_name: 'AMC_Service_Agreement_v1.docx',
      file_type: 'docx',
      file_size: 156800,
      file_url: '/sample.docx',
      is_published: false,
      uploaded_by: 'John Doe',
      uploaded_at: '2025-01-15T10:00:00Z',
    },
  ],
  2: [
    {
      id: 4,
      template_id: 2,
      version_number: 2,
      file_name: 'Tender_Cover_Letter_v2.docx',
      file_type: 'docx',
      file_size: 89600,
      file_url: '/sample.docx',
      is_published: true,
      uploaded_by: 'John Doe',
      uploaded_at: '2025-09-15T11:20:00Z',
      notes: 'Updated company details',
    },
    {
      id: 5,
      template_id: 2,
      version_number: 1,
      file_name: 'Tender_Cover_Letter_v1.docx',
      file_type: 'docx',
      file_size: 87040,
      file_url: '/sample.docx',
      is_published: false,
      uploaded_by: 'Jane Smith',
      uploaded_at: '2025-02-01T09:00:00Z',
    },
  ],
};

type ViewMode = 'grid' | 'table';

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(mockTemplates);
  const [versions, setVersions] = useState<Record<number, DocumentVersion[]>>(mockVersions);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFirm, setSelectedFirm] = useState<number | 'all'>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({});
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const categories = ['all', 'Work Order', 'Experience Certificate', 'Tender Document', 'Affidavit', 'AMC', 'Invoice', 'Contract', 'Report', 'Other'];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    const matchesFirm =
      selectedFirm === 'all' || template.firm_id === selectedFirm;

    return matchesSearch && matchesCategory && matchesFirm;
  });

  const handleUpload = (data: {
    title: string;
    category: string;
    firm_id?: number;
    file: File | null;
    notes: string;
  }) => {
    if (!data.file) return;

    const fileExtension = data.file.name.split('.').pop()?.toLowerCase();
    const fileType = fileExtension === 'pdf' ? 'pdf' : 'docx';

    const newTemplateId = Math.max(...templates.map((t) => t.id), 0) + 1;
    const now = new Date().toISOString();

    const newTemplate: DocumentTemplate = {
      id: newTemplateId,
      title: data.title,
      category: data.category as DocumentTemplate['category'],
      firm_id: data.firm_id,
      tags: [],
      latest_version_number: 1,
      created_by: 'Current User',
      created_at: now,
      updated_at: now,
    };

    const newVersion: DocumentVersion = {
      id: Math.max(...Object.values(versions).flat().map((v) => v.id), 0) + 1,
      template_id: newTemplateId,
      version_number: 1,
      file_name: data.file.name,
      file_type: fileType,
      file_size: data.file.size,
      file_url: URL.createObjectURL(data.file),
      is_published: true,
      uploaded_by: 'Current User',
      uploaded_at: now,
      notes: data.notes,
    };

    setTemplates([...templates, newTemplate]);
    setVersions({ ...versions, [newTemplateId]: [newVersion] });
    setUploadModalOpen(false);
  };

  const handleViewVersions = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setVersionModalOpen(true);
  };

  const handlePreview = (templateId: number, versionId?: number) => {
    const templateVersions = versions[templateId] || [];
    const version = versionId
      ? templateVersions.find((v) => v.id === versionId)
      : templateVersions.find((v) => v.is_published) || templateVersions[0];

    if (version) {
      setSelectedVersion(version);
      setPreviewModalOpen(true);
    }
  };

  const handleSetPublished = (versionId: number) => {
    setVersions((prev) => {
      const newVersions = { ...prev };
      
      for (const templateId in newVersions) {
        const templateVersions = newVersions[templateId];
        const targetVersion = templateVersions.find((v) => v.id === versionId);
        
        if (targetVersion) {
          newVersions[templateId] = templateVersions.map((v) => ({
            ...v,
            is_published: v.id === versionId,
          }));
          break;
        }
      }
      
      return newVersions;
    });
  };

  const handleDownload = (templateId: number, versionId?: number) => {
    const templateVersions = versions[templateId] || [];
    const version = versionId
      ? templateVersions.find((v) => v.id === versionId)
      : templateVersions.find((v) => v.is_published) || templateVersions[0];

    if (version) {
      const link = document.createElement('a');
      link.href = version.file_url;
      link.download = version.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (templateId: number, versionId?: number) => {
    if (versionId) {
      setVersions((prev) => {
        const newVersions = { ...prev };
        newVersions[templateId] = newVersions[templateId].filter((v) => v.id !== versionId);
        return newVersions;
      });
    } else {
      const confirmed = await showDeleteConfirm('this template and all its versions');
      if (confirmed) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        setVersions((prev) => {
          const newVersions = { ...prev };
          delete newVersions[templateId];
          return newVersions;
        });
      }
    }
  };

  const toggleVersionExpand = (templateId: number) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  const toggleTemplateSelection = (templateId: number) => {
    setSelectedTemplates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map((t) => t.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkPrint = async () => {
    const selectedIds = Array.from(selectedTemplates);
    const selectedTemplatesToPrint = templates.filter((t) => selectedIds.includes(t.id));
    
    await showAlert(
      "Preparing to Print",
      `Preparing to print ${selectedTemplatesToPrint.length} template(s):\n${selectedTemplatesToPrint.map((t) => `- ${t.title}`).join('\n')}`,
      "info"
    );
    
    window.print();
  };

  const handleBulkDownload = () => {
    const selectedIds = Array.from(selectedTemplates);
    
    selectedIds.forEach((templateId) => {
      const templateVersions = versions[templateId] || [];
      const publishedVersion = templateVersions.find((v) => v.is_published) || templateVersions[0];
      
      if (publishedVersion) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = publishedVersion.file_url;
          link.download = publishedVersion.file_name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 100 * selectedIds.indexOf(templateId));
      }
    });
    
    setSelectedTemplates(new Set());
    setShowBulkActions(false);
  };

  const handleBulkTag = () => {
    const selectedIds = Array.from(selectedTemplates);
    const tag = prompt('Enter a tag to add to selected templates:');
    
    if (tag && tag.trim()) {
      setTemplates((prev) =>
        prev.map((template) =>
          selectedIds.includes(template.id)
            ? { ...template, tags: [...new Set([...template.tags, tag.trim().toLowerCase()])] }
            : template
        )
      );
      
      setSelectedTemplates(new Set());
      setShowBulkActions(false);
    }
  };

  return (
    <DashboardLayout
      title="Document Management"
      breadcrumbs={['Home', 'Documents']}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage templates for AMCs, Tenders, Invoices, and more
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            Upload Template
          </button>
        </div>

        {showBulkActions && (
          <div className="flex items-center justify-between rounded-lg bg-sky-50 p-4 dark:bg-sky-900/20">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedTemplates.size} template{selectedTemplates.size > 1 ? 's' : ''}{' '}
              selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPrint}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Printer className="h-4 w-4" />
                Print Selected
              </button>
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="h-4 w-4" />
                Download Selected
              </button>
              <button
                onClick={handleBulkTag}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Tag className="h-4 w-4" />
                Tag Selected
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search templates by title, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={selectedFirm}
              onChange={(e) => setSelectedFirm(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Firms</option>
              {mockClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No templates found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by uploading your first template
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              Upload Template
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const templateVersions = versions[template.id] || [];
              const publishedVersion = templateVersions.find((v) => v.is_published) || templateVersions[0];
              const isSelected = selectedTemplates.has(template.id);

              return (
                <div
                  key={template.id}
                  className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                    isSelected ? 'ring-2 ring-sky-500' : ''
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTemplateSelection(template.id)}
                        className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                        <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {template.category}
                    </span>
                  </div>

                  <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{template.title}</h3>

                  <div className="mb-4 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <p>Latest: v{template.latest_version_number}</p>
                    <p>By: {template.created_by}</p>
                    <p>Updated: {format(new Date(template.updated_at), 'MMM dd, yyyy')}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                    <button
                      onClick={() => toggleVersionExpand(template.id)}
                      className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      Versions
                      {expandedVersions[template.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(template.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(template.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expandedVersions[template.id] && (
                    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                      {templateVersions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm dark:bg-gray-700"
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">v{version.version_number}</span>
                            {version.is_published && (
                              <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                                Published
                              </span>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(version.uploaded_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewVersions(template)}
                            className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                          >
                            View All
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedTemplates.size === filteredTemplates.length &&
                        filteredTemplates.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Latest Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplates.has(template.id);
                  const templateVersions = versions[template.id] || [];

                  return (
                    <>
                      <tr
                        key={template.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? 'bg-sky-50 dark:bg-sky-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTemplateSelection(template.id)}
                            className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 dark:border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{template.title}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {template.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => toggleVersionExpand(template.id)}
                            className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                          >
                            v{template.latest_version_number}
                            {expandedVersions[template.id] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {template.created_by}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(template.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePreview(template.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(template.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-gray-700 dark:hover:text-sky-400"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedVersions[template.id] && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 px-6 py-4 dark:bg-gray-900">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Version History
                              </p>
                              {templateVersions.map((version) => (
                                <div
                                  key={version.id}
                                  className="flex items-center justify-between rounded bg-white p-3 text-sm dark:bg-gray-800"
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      v{version.version_number}
                                    </span>
                                    {version.is_published && (
                                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Published
                                      </span>
                                    )}
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {version.file_name}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-500">
                                      {format(
                                        new Date(version.uploaded_at),
                                        'MMM dd, yyyy HH:mm'
                                      )}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleViewVersions(template)}
                                    className="text-sm font-medium text-sky-600 hover:text-sky-700"
                                  >
                                    View All Versions
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadTemplateModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
        clients={mockClients}
      />

      {selectedTemplate && (
        <VersionHistoryModal
          isOpen={versionModalOpen}
          onClose={() => {
            setVersionModalOpen(false);
            setSelectedTemplate(null);
          }}
          templateTitle={selectedTemplate.title}
          versions={versions[selectedTemplate.id] || []}
          onSetPublished={handleSetPublished}
          onDownload={(versionId) => handleDownload(selectedTemplate.id, versionId)}
          onPreview={(versionId) => handlePreview(selectedTemplate.id, versionId)}
          onDelete={(versionId) => handleDelete(selectedTemplate.id, versionId)}
          onUploadNewVersion={() => {
            setVersionModalOpen(false);
            setUploadModalOpen(true);
          }}
        />
      )}

      {selectedVersion && (
        <PreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedVersion(null);
          }}
          fileName={selectedVersion.file_name}
          fileUrl={selectedVersion.file_url}
          fileType={selectedVersion.file_type}
          onDownload={() => handleDownload(selectedVersion.template_id, selectedVersion.id)}
        />
      )}
    </DashboardLayout>
  );
}

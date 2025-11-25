'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UploadTemplateModal } from '@/components/documents/upload-template-modal';
import { VersionHistoryModal } from '@/components/documents/version-history-modal';
import { PreviewModal } from '@/components/documents/preview-modal';
import {
  apiClient,
  DocumentTemplate,
  DocumentTemplateVersion,
  Firm,
} from '@/lib/api';
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
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { showDeleteConfirm, showAlert } from '@/lib/sweetalert';
import { formatDate, formatTimeAgo } from '@/lib/date-utils';

type ViewMode = 'grid' | 'table';

// Map backend DocumentTemplate to frontend DocumentVersion format
function mapVersionToFrontend(version: DocumentTemplateVersion, templateId: number): any {
  return {
    id: version.id,
    template_id: templateId,
    version_number: version.version_number,
    file_name: version.file?.split('/').pop() || `version_${version.version_number}.${version.file_type}`,
    file_type: version.file_type,
    file_size: 0, // Backend doesn't provide file size
    file_url: version.file_url,
    is_published: version.is_published,
    uploaded_by: version.created_by_username || 'Unknown',
    uploaded_at: version.created_at,
    notes: undefined,
  };
}

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFirm, setSelectedFirm] = useState<number | 'all'>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFirmDropdown, setShowFirmDropdown] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [uploadingForTemplate, setUploadingForTemplate] = useState<DocumentTemplate | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({});
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ['all', 'Work Order', 'Experience Certificate', 'Tender Document', 'Affidavit', 'AMC', 'Invoice', 'Contract', 'Report', 'Other'];

  // Fetch documents from backend
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedFirm !== 'all') {
        params.firm = selectedFirm;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.getDocumentTemplates(params);
      // Filter to only show templates that have a published version
      const templatesWithPublished = (response.results || []).filter((template: DocumentTemplate) => {
        return template.published_version !== null && template.published_version !== undefined;
      });
      setTemplates(templatesWithPublished);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedFirm, searchQuery]);

  // Fetch firms for dropdown
  const fetchFirms = useCallback(async () => {
    try {
      const response = await apiClient.getFirms();
      setFirms(response.results || []);
    } catch (err: any) {
      console.error('Failed to fetch firms:', err);
      // Don't show error for firms, just use empty list
      setFirms([]);
    }
  }, []);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-filter-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (!target.closest('.firm-filter-dropdown-container')) {
        setShowFirmDropdown(false);
      }
    };

    if (showCategoryDropdown || showFirmDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown, showFirmDropdown]);

  // Initial load
  useEffect(() => {
    fetchDocuments();
    fetchFirms();
  }, [fetchDocuments, fetchFirms]);

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, searchQuery ? 500 : 0); // Debounce search

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedFirm, searchQuery, fetchDocuments]);

  const handleUpload = async (data: {
    title: string;
    category: string;
    firm_id?: number;
    file: File | null;
    notes: string;
  }) => {
    if (!data.file) {
      await showAlert('Error', 'Please select a file to upload', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // If uploading for an existing template (new version), use template_id
      // Otherwise, use title, category, and firm to create new template
      const uploadData: any = {
        upload_file: data.file,
        notes: data.notes || undefined,
      };

      if (uploadingForTemplate) {
        // Uploading new version - use template_id
        uploadData.template_id = uploadingForTemplate.id;
      } else {
        // Creating new template - use title, category, firm
        uploadData.title = data.title;
        uploadData.category = data.category;
        if (data.firm_id) {
          uploadData.firm = data.firm_id;
        }
      }

      await apiClient.uploadDocumentTemplate(uploadData);

      await showAlert('Success', uploadingForTemplate ? 'New version uploaded successfully' : 'Template uploaded successfully', 'success');
    setUploadModalOpen(false);
      setUploadingForTemplate(null);
      // Refetch documents
      await fetchDocuments();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.error || err.message || 'Failed to upload template';
      await showAlert('Upload Failed', errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewVersions = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setVersionModalOpen(true);
  };

  const handlePreview = (templateId: number, versionId?: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    let version: DocumentTemplateVersion | null = null;
    
    if (versionId) {
      version = template.versions.find((v) => v.id === versionId) || null;
    } else {
      version = template.published_version || template.versions[0] || null;
    }

    if (version) {
      // Use preview endpoint URL instead of file URL
      const previewUrl = versionId 
        ? apiClient.getPreviewVersionUrl(templateId, versionId)
        : apiClient.getPreviewPublishedUrl(templateId);
      
      const versionData = mapVersionToFrontend(version, templateId);
      versionData.file_url = previewUrl; // Override with preview endpoint URL
      setSelectedVersion(versionData);
      setPreviewModalOpen(true);
    }
  };

  const handleDownload = async (templateId: number, versionId?: number) => {
    try {
      let blob: Blob;
      
      if (versionId) {
        blob = await apiClient.downloadVersion(versionId);
      } else {
        blob = await apiClient.downloadPublishedVersion(templateId);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      
      const template = templates.find((t) => t.id === templateId);
    const version = versionId
        ? template?.versions.find((v) => v.id === versionId)
        : template?.published_version || template?.versions[0];
      
      const fileName = version
        ? `${template?.title || 'document'}_v${version.version_number}.${version.file_type}`
        : 'document.pdf';
      
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      await showAlert('Download Failed', err.message || 'Failed to download document', 'error');
    }
  };

  const handleDelete = async (templateId: number) => {
      const confirmed = await showDeleteConfirm('this template and all its versions');
    if (!confirmed) return;

    try {
      await apiClient.deleteDocumentTemplate(templateId);
      await showAlert('Success', 'Template deleted successfully', 'success');
      // Refetch documents
      await fetchDocuments();
      // Clear selection if deleted template was selected
      setSelectedTemplates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        setShowBulkActions(newSet.size > 0);
        return newSet;
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      await showAlert('Delete Failed', err.message || 'Failed to delete template', 'error');
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
    if (selectedTemplates.size === templates.length && templates.length > 0) {
      setSelectedTemplates(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTemplates(new Set(templates.map((t) => t.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkPrint = () => {
    const selectedIds = Array.from(selectedTemplates);
    const selectedTemplatesToPrint = templates.filter((t) => selectedIds.includes(t.id));
    
    if (selectedTemplatesToPrint.length === 0) return;
    
    // Open preview modal for the first selected template
    const firstTemplate = selectedTemplatesToPrint[0];
    handlePreview(firstTemplate.id);
    
    // After modal opens, trigger print dialog
    // Use a longer delay to ensure the iframe is loaded
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleBulkDownload = async () => {
    const selectedIds = Array.from(selectedTemplates);
    
    try {
      const templateIds = selectedIds;
      const blob = await apiClient.bulkDownloadDocuments({ template_ids: templateIds });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = 'documents.zip';
      window.document.body.appendChild(link);
          link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await showAlert('Success', `Downloaded ${selectedIds.length} document(s) as ZIP`, 'success');
    
    setSelectedTemplates(new Set());
    setShowBulkActions(false);
    } catch (err: any) {
      console.error('Bulk download error:', err);
      await showAlert('Download Failed', err.message || 'Failed to download documents', 'error');
    }
  };

  const handleBulkTag = () => {
    const selectedIds = Array.from(selectedTemplates);
    const tag = prompt('Enter a tag to add to selected templates:');
    
    if (tag && tag.trim()) {
      // Note: Backend doesn't support tags yet, so this is a placeholder
      showAlert('Info', 'Tag functionality will be available soon', 'info');
      setSelectedTemplates(new Set());
      setShowBulkActions(false);
    }
  };

  // Convert firms to Client format for the modal (it expects Client[])
  const firmsAsClients = firms.map((firm) => ({
    id: firm.id,
    name: firm.firm_name,
    business_name: firm.firm_name,
    address: '',
    city: '',
    state: '',
    pin_code: '',
    country: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    tags: [],
    amc_count: 0,
    open_projects: 0,
    outstanding_amount: 0,
    last_activity: firm.created_at || new Date().toISOString(),
    created_at: firm.created_at || new Date().toISOString(),
    updated_at: firm.updated_at || new Date().toISOString(),
  }));

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
            disabled={isUploading}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
            <Plus className="h-4 w-4" />
            Upload Template
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error loading documents</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={fetchDocuments}
              className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        )}

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
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search templates by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <div className="relative category-filter-dropdown-container">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex items-center justify-between min-w-[150px]"
              >
                <span>{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <div className="relative firm-filter-dropdown-container">
              <button
                type="button"
                onClick={() => setShowFirmDropdown(!showFirmDropdown)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex items-center justify-between min-w-[150px]"
              >
                <span>{selectedFirm === 'all' ? 'All Firms' : firms.find(f => f.id === selectedFirm)?.firm_name || 'All Firms'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {showFirmDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFirm('all');
                      setShowFirmDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    All Firms
                  </button>
                  {firms.map((firm) => (
                    <button
                      key={firm.id}
                      type="button"
                      onClick={() => {
                        setSelectedFirm(firm.id);
                        setShowFirmDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {firm.firm_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              } ${viewMode === 'table' ? 'border-r border-gray-300 dark:border-gray-600' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="ml-3 text-gray-500 dark:text-gray-400">Loading documents...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No templates found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategory !== 'all' || selectedFirm !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by uploading your first template'}
            </p>
            {!searchQuery && selectedCategory === 'all' && selectedFirm === 'all' && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              Upload Template
            </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const templateVersions = template.versions || [];
              const publishedVersion = template.published_version || templateVersions[0];
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
                    {template.category && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {template.category}
                    </span>
                    )}
                  </div>

                  <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{template.title}</h3>

                  {template.firm_name && (
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      Firm: {template.firm_name}
                    </p>
                  )}

                  {template.description && (
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="mb-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {publishedVersion && (
                      <p>Latest: v{publishedVersion.version_number}</p>
                    )}
                    <p>By: {template.created_by_username || 'Unknown'}</p>
                    <p>Created: {formatDate(template.created_at)}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                    <button
                      onClick={() => toggleVersionExpand(template.id)}
                      className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      Versions ({templateVersions.length})
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

                  {expandedVersions[template.id] && templateVersions.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                      {templateVersions.slice(0, 3).map((version) => (
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
                              {formatDate(version.created_at)}
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
                      {templateVersions.length > 3 && (
                        <button
                          onClick={() => handleViewVersions(template)}
                          className="w-full text-center text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                        >
                          View all {templateVersions.length} versions
                        </button>
                      )}
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
                        selectedTemplates.size === templates.length &&
                        templates.length > 0
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
                    Firm
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
                {templates.map((template) => {
                  const isSelected = selectedTemplates.has(template.id);
                  const templateVersions = template.versions || [];
                  const publishedVersion = template.published_version || templateVersions[0];

                  return (
                    <Fragment key={template.id}>
                      <tr
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
                            {template.description && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {template.category ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {template.category}
                          </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {template.firm_name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => toggleVersionExpand(template.id)}
                            className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                          >
                            {publishedVersion ? `v${publishedVersion.version_number}` : 'No version'}
                            {expandedVersions[template.id] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {template.created_by_username || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(template.created_at)}
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
                      {expandedVersions[template.id] && templateVersions.length > 0 && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 px-6 py-4 dark:bg-gray-900">
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
                                      {version.file_type.toUpperCase()}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-500">
                                      {formatDate(version.created_at)}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-500">
                                      by {version.created_by_username || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleDownload(template.id, version.id)}
                                      className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                    >
                                      Download
                                    </button>
                                  <button
                                    onClick={() => handleViewVersions(template)}
                                      className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                  >
                                      View All
                                  </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadTemplateModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadingForTemplate(null);
        }}
        onUpload={handleUpload}
        clients={firmsAsClients}
        isUploading={isUploading}
        template={uploadingForTemplate}
      />

      {selectedTemplate && (
        <VersionHistoryModal
          isOpen={versionModalOpen}
          onClose={() => {
            setVersionModalOpen(false);
            setSelectedTemplate(null);
          }}
          templateTitle={selectedTemplate.title}
          versions={(selectedTemplate.versions || []).map((v) => mapVersionToFrontend(v, selectedTemplate.id))}
          onSetPublished={(versionId) => {
            // Note: Backend doesn't support changing published version yet
            showAlert('Info', 'Changing published version will be available soon', 'info');
          }}
          onDownload={(versionId) => handleDownload(selectedTemplate.id, versionId)}
          onPreview={(versionId) => handlePreview(selectedTemplate.id, versionId)}
          onDelete={(versionId) => {
            // Note: Backend doesn't support deleting individual versions yet
            showAlert('Info', 'Deleting individual versions will be available soon', 'info');
          }}
          onUploadNewVersion={() => {
            setVersionModalOpen(false);
            setUploadingForTemplate(selectedTemplate);
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

'use client';

import { useState } from 'react';
import { X, Check, Download, Eye, Trash2, Upload } from 'lucide-react';
import { DocumentVersion } from '@/types';
import { format } from 'date-fns';

type VersionHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  templateTitle: string;
  versions: DocumentVersion[];
  onSetPublished: (versionId: number) => void;
  onDownload: (versionId: number) => void;
  onPreview: (versionId: number) => void;
  onDelete: (versionId: number) => void;
  onUploadNewVersion: () => void;
};

export function VersionHistoryModal({
  isOpen,
  onClose,
  templateTitle,
  versions,
  onSetPublished,
  onDownload,
  onPreview,
  onDelete,
  onUploadNewVersion,
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Version History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{templateTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUploadNewVersion}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Upload className="h-4 w-4" />
              Upload New Version
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  File Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Uploaded At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {sortedVersions.map((version) => (
                <tr key={version.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      v{version.version_number}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">{version.file_name}</span>
                      <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {version.file_type.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {(version.file_size / 1024).toFixed(2)} KB
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {version.uploaded_by}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(version.uploaded_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {version.is_published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetPublished(version.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Set as Published
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onPreview(version.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDownload(version.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(version.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600"
                        title="Delete"
                        disabled={version.is_published}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedVersions.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No versions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

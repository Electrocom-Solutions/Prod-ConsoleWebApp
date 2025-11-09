'use client';

import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type PreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  onDownload: () => void;
};

export function PreviewModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  onDownload,
}: PreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">{fileName}</h2>
          <span className="rounded bg-gray-700 px-2 py-1 text-xs font-medium text-gray-300">
            {fileType.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1">
            <button
              onClick={handleZoomOut}
              className="rounded p-2 text-white hover:bg-gray-700"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[60px] text-center text-sm text-white">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="rounded p-2 text-white hover:bg-gray-700"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded p-2 text-white hover:bg-gray-700"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[80px] text-center text-sm text-white">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="rounded p-2 text-white hover:bg-gray-700"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Download className="h-4 w-4" />
            Download
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-800 p-8">
        <div
          className="mx-auto bg-white shadow-2xl"
          style={{ width: `${zoom}%`, maxWidth: '1200px' }}
        >
          {fileType === 'pdf' ? (
            <iframe
              src={fileUrl}
              className="h-[800px] w-full"
              title={fileName}
            />
          ) : (
            <div className="flex h-[800px] items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">
                  DOCX preview not available in browser
                </p>
                <button
                  onClick={onDownload}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  <Download className="h-4 w-4" />
                  Download to View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

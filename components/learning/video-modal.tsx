'use client';

import { TrainingVideo } from '@/types';
import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VideoModalProps {
  video: TrainingVideo | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: { title: string; youtube_url: string; rank: number }) => Promise<void>;
}

export function VideoModal({ video, isOpen, isSaving, onClose, onSave }: VideoModalProps) {
  const [title, setTitle] = useState(video?.title || '');
  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtube_url || '');
  const [rank, setRank] = useState<number>(video?.rank ?? 0);

  // Reset form when modal opens or video changes
  useEffect(() => {
    if (isOpen) {
      setTitle(video?.title || '');
      setYoutubeUrl(video?.youtube_url || '');
      setRank(video?.rank ?? 0);
    }
  }, [isOpen, video]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      return;
    }
    await onSave({ 
      title: title.trim(), 
      youtube_url: youtubeUrl.trim(),
      rank: rank
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {video ? 'Edit Video' : 'Add Video'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              required
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
              required
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Rank <span className="text-gray-400 text-xs">(Lower numbers appear first)</span>
            </label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Videos are ordered by rank (ascending). Lower rank numbers appear first.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !youtubeUrl.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {video ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                video ? 'Update Video' : 'Add Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


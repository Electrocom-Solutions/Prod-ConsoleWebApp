'use client';

import { TrainingVideo } from '@/types';
import { Play, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { VideoPlayer } from './video-player';

interface VideoCardProps {
  video: TrainingVideo;
  isSuperuser: boolean;
  onEdit: (video: TrainingVideo) => void;
  onDelete: (video: TrainingVideo) => void;
}

export function VideoCard({ video, isSuperuser, onEdit, onDelete }: VideoCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`;

  return (
    <>
      <div className="group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-900">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to a default thumbnail if image fails to load
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setShowPlayer(true)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110"
            >
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded">
                  Rank: {video.rank}
                </span>
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                {video.title}
              </h3>
            </div>
            {isSuperuser && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(video);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(video);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Added {format(new Date(video.created_at), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer
          video={video}
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}


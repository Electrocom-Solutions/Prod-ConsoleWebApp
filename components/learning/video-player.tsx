'use client';

import { TrainingVideo } from '@/types';
import { X } from 'lucide-react';

interface VideoPlayerProps {
  video: TrainingVideo;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayer({ video, isOpen, onClose }: VideoPlayerProps) {
  if (!isOpen) return null;

  const embedUrl = `https://www.youtube.com/embed/${video.youtube_video_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-5xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Video Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        {/* Video Title */}
        <div className="mt-4 rounded-lg bg-white p-4 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {video.title}
          </h3>
        </div>
      </div>
    </div>
  );
}


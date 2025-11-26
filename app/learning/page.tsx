'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TrainingVideo } from '@/types';
import {
  Search,
  Plus,
  Play,
  Edit,
  Trash2,
  Loader2,
  Inbox,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import { showDeleteConfirm, showAlert, showSuccess, showError } from '@/lib/sweetalert';
import { apiClient, BackendTrainingVideoListItem, BackendTrainingVideoListResponse, BackendTrainingVideoDetail } from '@/lib/api';
import { useDebounce } from 'use-debounce';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/providers/auth-provider';
import { VideoCard } from '@/components/learning/video-card';
import { VideoModal } from '@/components/learning/video-modal';

/**
 * Map backend training video list item to frontend TrainingVideo type
 */
function mapBackendVideoToFrontend(backendVideo: BackendTrainingVideoListItem): TrainingVideo {
  return {
    id: backendVideo.id,
    title: backendVideo.title,
    youtube_url: `https://www.youtube.com/watch?v=${backendVideo.youtube_video_id}`,
    youtube_video_id: backendVideo.youtube_video_id,
    rank: backendVideo.rank,
    created_at: backendVideo.created_at,
    updated_at: backendVideo.created_at,
  };
}

/**
 * Map backend training video detail to frontend TrainingVideo type
 */
function mapBackendVideoDetailToFrontend(backendVideo: BackendTrainingVideoDetail): TrainingVideo {
  return {
    id: backendVideo.id,
    title: backendVideo.title,
    youtube_url: backendVideo.youtube_url,
    youtube_video_id: backendVideo.youtube_video_id,
    rank: backendVideo.rank,
    created_at: backendVideo.created_at,
    updated_at: backendVideo.updated_at,
    created_by: backendVideo.created_by,
    updated_by: backendVideo.updated_by,
  };
}

function LearningPageContent() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isSuperuser = user?.is_superuser || false;

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };
      
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      const response: BackendTrainingVideoListResponse = await apiClient.getTrainingVideos(params);
      const mappedVideos = response.results.map(mapBackendVideoToFrontend);
      setVideos(mappedVideos);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err: any) {
      console.error('Error fetching training videos:', err);
      setError(err.message || 'Failed to fetch training videos');
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, currentPage]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleCreateVideo = () => {
    setSelectedVideo(null);
    setShowVideoModal(true);
  };

  const handleEditVideo = async (video: TrainingVideo) => {
    try {
      const videoDetail = await apiClient.getTrainingVideo(video.id);
      const mappedVideo = mapBackendVideoDetailToFrontend(videoDetail);
      setSelectedVideo(mappedVideo);
      setShowVideoModal(true);
    } catch (err: any) {
      await showAlert('Error', err.message || 'Failed to fetch video details');
    }
  };

  const handleDeleteVideo = async (video: TrainingVideo) => {
    const confirmed = await showDeleteConfirm('this training video');
    if (!confirmed) return;

    try {
      await apiClient.deleteTrainingVideo(video.id);
      await showSuccess('Video deleted successfully');
      fetchVideos();
    } catch (err: any) {
      await showAlert('Error', err.message || 'Failed to delete video');
    }
  };

  const handleSaveVideo = async (data: { title: string; youtube_url: string; rank: number }) => {
    setIsSaving(true);
    try {
      if (selectedVideo) {
        // Update existing video
        await apiClient.updateTrainingVideo(selectedVideo.id, data);
        await showSuccess('Video updated successfully');
      } else {
        // Create new video
        await apiClient.createTrainingVideo(data);
        await showSuccess('Video created successfully');
      }
      setShowVideoModal(false);
      setSelectedVideo(null);
      fetchVideos();
    } catch (err: any) {
      await showAlert('Error', err.message || `Failed to ${selectedVideo ? 'update' : 'create'} video`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && videos.length === 0) {
    return (
      <DashboardLayout title="Learning" breadcrumbs={['Home', 'Learning']}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative h-16 w-16">
                <Image
                  src="/logos/logo only.png"
                  alt="Electrocom Logo"
                  fill
                  sizes="64px"
                  className="object-contain dark:brightness-0 dark:invert"
                  priority
                />
              </div>
            </div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
            <p className="mt-4 text-gray-500">Loading videos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && videos.length === 0) {
    return (
      <DashboardLayout title="Learning" breadcrumbs={['Home', 'Learning']}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error loading videos: {error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchVideos();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Loader2 className="h-4 w-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Learning" breadcrumbs={['Home', 'Learning']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Videos</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Access training and learning resources
            </p>
          </div>
          {isSuperuser && (
            <button 
              onClick={handleCreateVideo}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Plus className="h-4 w-4" />
              Add Video
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos by title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-80"
          />
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <Inbox className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No videos found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search'
                : isSuperuser
                ? 'Get started by adding your first training video'
                : 'No training videos available yet'}
            </p>
            {isSuperuser && !searchQuery && (
              <button
                onClick={handleCreateVideo}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Plus className="h-4 w-4" />
                Add Video
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSuperuser={isSuperuser}
                  onEdit={handleEditVideo}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <VideoModal
          video={selectedVideo}
          isOpen={showVideoModal}
          isSaving={isSaving}
          onClose={() => {
            setShowVideoModal(false);
            setSelectedVideo(null);
          }}
          onSave={handleSaveVideo}
        />
      )}
    </DashboardLayout>
  );
}

export default function LearningPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <DashboardLayout title="Learning">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-500">Loading...</div>
            </div>
          </DashboardLayout>
        }
      >
        <LearningPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}


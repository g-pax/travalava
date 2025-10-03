"use client";

/**
 * ActivityPhotoGallery displays and manages photos for activities
 * - Shows photo previews in activity cards
 * - Provides full-size photo viewing
 * - Handles photo upload and deletion
 */
import { useState } from "react";
import { Camera, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityPhoto {
  id: string;
  url: string;
  storage_path: string;
}

interface ActivityPhotoGalleryProps {
  activityId: string;
  activityTitle: string;
  photos: ActivityPhoto[];
  onPhotoAdd?: () => void;
  onPhotoDelete?: (photoId: string) => void;
  readonly?: boolean;
  showUpload?: boolean;
}

/**
 * Compact photo preview for activity cards
 */
export function ActivityPhotoPreview({
  photos,
  activityTitle,
  maxDisplay = 3,
}: {
  photos: ActivityPhoto[];
  activityTitle: string;
  maxDisplay?: number;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const displayPhotos = photos.slice(0, maxDisplay);
  const remainingCount = photos.length - maxDisplay;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Camera className="h-4 w-4" />
        <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {displayPhotos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <img
              src={photo.url}
              alt={`${activityTitle} photo`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
              <ZoomIn className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}

        {remainingCount > 0 && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Photo Viewer Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{activityTitle} - Photo</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedPhoto.url}
                alt={`${activityTitle} photo`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/**
 * Full photo gallery with management capabilities
 */
export function ActivityPhotoGallery({
  activityId,
  activityTitle,
  photos,
  onPhotoAdd,
  onPhotoDelete,
  readonly = false,
  showUpload = true,
}: ActivityPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <h3 className="font-medium">
            Photos {photos.length > 0 && `(${photos.length})`}
          </h3>
        </div>
        {!readonly && showUpload && onPhotoAdd && (
          <Button variant="outline" size="sm" onClick={onPhotoAdd}>
            <Camera className="h-4 w-4 mr-2" />
            Add Photo
          </Button>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos yet</p>
          {!readonly && showUpload && (
            <p className="text-xs">Add photos to remember this activity</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="w-full aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <img
                  src={photo.url}
                  alt={`${activityTitle} photo`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Delete Button */}
              {!readonly && onPhotoDelete && (
                <button
                  onClick={() => onPhotoDelete(photo.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{activityTitle} - Photo</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedPhoto.url}
                alt={`${activityTitle} photo`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
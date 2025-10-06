"use client";

import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  cleanupPreviewUrl,
  createPreviewUrl,
  type ThumbnailUploadResult,
  uploadThumbnailToR2,
  validateThumbnailFile,
} from "@/lib/image-upload";

interface ThumbnailUploadProps {
  onThumbnailUploaded: (result: ThumbnailUploadResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  currentThumbnail?: string | null;
  placeholder?: string;
  className?: string;
}

export function ThumbnailUpload({
  onThumbnailUploaded,
  onError,
  disabled = false,
  currentThumbnail,
  placeholder = "Upload a thumbnail for this activity",
  className = "",
}: ThumbnailUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || isUploading || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file
      const validation = validateThumbnailFile(file);
      if (!validation.isValid) {
        onError?.(validation.error || "Invalid file");
        return;
      }

      // Clean up previous preview
      if (previewUrl) {
        cleanupPreviewUrl(previewUrl);
      }

      // Create new preview
      const newPreviewUrl = createPreviewUrl(file);
      setPreviewFile(file);
      setPreviewUrl(newPreviewUrl);
    },
    [disabled, isUploading, previewUrl, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!previewFile || isUploading) return;

    setIsUploading(true);

    try {
      const result = await uploadThumbnailToR2(previewFile);
      onThumbnailUploaded(result);
      toast.success("Thumbnail uploaded successfully!");

      // Clean up
      if (previewUrl) {
        cleanupPreviewUrl(previewUrl);
      }
      setPreviewFile(null);
      setPreviewUrl(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload thumbnail";
      onError?.(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    if (previewUrl) {
      cleanupPreviewUrl(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  // Show current thumbnail or preview
  const displayImage = previewUrl || currentThumbnail;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current thumbnail or preview */}
      {displayImage && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {previewUrl ? "Preview" : "Current Thumbnail"}
          </p>
          <div className="relative inline-block">
            <Image
              src={displayImage}
              alt={previewFile?.name || "Thumbnail"}
              className="w-32 h-32 object-cover rounded-lg border"
              width={128}
              height={128}
            />
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePreview}
                disabled={isUploading}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {previewFile && (
            <p className="text-xs text-gray-500">
              File size: {(previewFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      )}

      {/* Upload area - only show if no current thumbnail or we have a preview */}
      {(!currentThumbnail || previewUrl) && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-blue-500" />
            ) : (
              <Camera className="h-8 w-8 text-gray-400" />
            )}
            <p className="text-sm text-gray-600">
              {isDragActive ? "Drop the image here" : placeholder}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, or WebP up to 10MB (will be compressed to 1.5MB)
            </p>
          </div>
        </div>
      )}

      {/* Upload button - only show if we have a preview */}
      {previewFile && previewUrl && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Thumbnail
            </>
          )}
        </Button>
      )}
    </div>
  );
}

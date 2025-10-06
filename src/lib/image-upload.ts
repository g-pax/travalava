import imageCompression from "browser-image-compression";

export interface ThumbnailUploadResult {
  url: string;
  fileName: string;
  originalFileName: string;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
};

export function validateThumbnailFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB before compression

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please upload a JPEG, PNG, or WebP image file.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image file size must be less than 10MB.",
    };
  }

  return { isValid: true };
}

async function compressThumbnail(file: File): Promise<File> {
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing thumbnail:", error);
    throw new Error("Failed to compress image. Please try again.");
  }
}

/**
 * Upload a thumbnail image directly to Cloudflare R2
 */
export async function uploadThumbnailToR2(
  file: File,
): Promise<ThumbnailUploadResult> {
  // Validate the file
  const validation = validateThumbnailFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Compress the image
  const compressedFile = await compressThumbnail(file);

  try {
    // Get presigned URL
    const presignResponse = await fetch("/api/r2/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: compressedFile.type,
        fileName: file.name,
      }),
    });

    if (!presignResponse.ok) {
      const errorData = await presignResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get presigned URL");
    }

    const { presignedUrl, publicUrl, fileName } = await presignResponse.json();

    // Upload to R2
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": compressedFile.type,
      },
      body: compressedFile,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "");
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} ${errorText}`,
      );
    }

    return {
      url: publicUrl,
      fileName,
      originalFileName: file.name,
    };
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to upload thumbnail. Please try again.",
    );
  }
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function cleanupPreviewUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

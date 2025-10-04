"use client";

/**
 * ActivityEditForm handles updating existing activities with all attributes.
 * - Pre-populated with existing activity data
 * - Validated with Zod schema via react-hook-form resolver
 * - Photo uploads temporarily disabled
 * - Includes location support and Google Maps integration
 */
import { zodResolver } from "@hookform/resolvers/zod";
/* Photo upload temporarily disabled */
// import imageCompression from "browser-image-compression";
import { Clock, DollarSign, FileText, Link2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ActivityCreateInput, ActivityCreateSchema } from "@/schemas";
// import { supabase } from "@/lib/supabase";
import { type Activity, useUpdateActivity } from "../hooks/use-activities";
import { GoogleMapsIntegration } from "./google-maps-integration";

interface ActivityEditFormProps {
  activity: Activity;
  tripCurrency: string;
  onSuccess?: (activity: Activity) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ACTIVITY_CATEGORIES = [
  "sightseeing",
  "restaurant",
  "entertainment",
  "shopping",
  "outdoor",
  "cultural",
  "transportation",
  "accommodation",
  "other",
];

/*
const ACTIVITY_PHOTOS_BUCKET = "activity-photos";

interface ActivityPhoto {
  id: string;
  url: string;
  file?: File;
  isNew?: boolean;
}
*/

const isGoogleMapsLink = (link?: string | null) => {
  if (!link) {
    return false;
  }

  const normalized = link.toLowerCase();
  return (
    normalized.includes("maps.google.") ||
    normalized.includes("maps.app.goo.gl") ||
    normalized.includes("goo.gl/maps")
  );
};

export function ActivityEditForm({
  activity,
  tripCurrency,
  onSuccess,
  onCancel,
  open = true,
  onOpenChange,
}: ActivityEditFormProps) {
  const updateActivity = useUpdateActivity();
  /*
  const [photos, setPhotos] = useState<ActivityPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  */

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    defaultValues: {
      trip_id: activity.trip_id.toString(),
      title: activity.title,
      category: activity.category || undefined,
      cost_amount: activity.cost_amount || undefined,
      cost_currency: activity.cost_currency || tripCurrency,
      duration_min: activity.duration_min || undefined,
      notes: activity.notes || undefined,
      link: activity.link || undefined,
      location: activity.location || undefined,
    },
  });

  const googleMapsLink = isGoogleMapsLink(activity.link)
    ? activity.link ?? undefined
    : undefined;

  /*
  // Load existing photos when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      type PhotoRow = { id: string; storage_path: string };

      const { data: rows, error } = await supabase
        .from("activity_photos")
        .select<PhotoRow>("id, storage_path")
        .eq("activity_id", activity.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load activity photos:", error);
        if (isMounted) {
          setPhotos([]);
        }
        return;
      }

      if (!rows || rows.length === 0) {
        if (isMounted) {
          setPhotos([]);
        }
        return;
      }

      const { data: signedUrls, error: signedError } = await supabase.storage
        .from(ACTIVITY_PHOTOS_BUCKET)
        .createSignedUrls(
          rows.map((row) => row.storage_path),
          60 * 15,
        );

      if (signedError) {
        console.error(
          "Failed to create signed URLs for activity photos:",
          signedError,
        );
        if (isMounted) {
          setPhotos([]);
        }
        return;
      }

      const photos = rows
        .map<ActivityPhoto | null>((row, index) => {
          const signed = signedUrls?.[index];
          if (!signed || signed.error || !signed.signedUrl) {
            if (signed?.error) {
              console.error(
                `Failed to sign URL for activity photo ${row.id}:`,
                signed.error,
              );
            }
            return null;
          }

          return {
            id: row.id,
            url: signed.signedUrl,
          };
        })
        .filter((photo): photo is ActivityPhoto => photo !== null);

      if (isMounted) {
        setPhotos(photos);
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, [activity.id]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadingPhotos(true);

    try {
      const compressedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          if (file.size > 1.5 * 1024 * 1024) {
            return await imageCompression(file, {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              preserveExif: false,
            });
          }
          return file;
        }),
      );

      const newPhotos: ActivityPhoto[] = compressedFiles.map((file) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        isNew: true,
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
      setUploadingPhotos(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 5,
    disabled: uploadingPhotos,
  });

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo?.url && photo.isNew) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  };
  */

  const handleLocationChange = (locationName: string) => {
    if (locationName.trim()) {
      // For now, we'll create a basic location object
      // TODO: Implement geocoding to get actual coordinates
      form.setValue("location", {
        name: locationName,
        lat: 0, // Will be set by geocoding
        lon: 0, // Will be set by geocoding
      });
    } else {
      form.setValue("location", undefined);
    }
  };

  const onSubmit = async (values: ActivityCreateInput) => {
    try {
      // TODO: Upload new photos to Supabase Storage
      // This will be implemented when we add proper photo support

      const updatedActivity = await updateActivity.mutateAsync({
        id: activity.id,
        updates: values,
      });

      onSuccess?.(updatedActivity);
      onOpenChange?.(false);
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  const handleCancel = () => {
    /*
    // Clean up any temporary photo URLs
    photos.forEach((photo) => {
      if (photo.isNew && photo.url) {
        URL.revokeObjectURL(photo.url);
      }
    });
    */

    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title (Required) */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Activity Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Visit the Louvre Museum"
              {...form.register("title")}
              className="w-full"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={form.watch("category") || ""}
              onValueChange={(value) =>
                form.setValue("category", value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="cost_amount"
                className="text-sm font-medium flex items-center gap-1"
              >
                <DollarSign className="h-4 w-4" />
                Cost Amount
              </Label>
              <Input
                id="cost_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("cost_amount", { valueAsNumber: true })}
              />
              {form.formState.errors.cost_amount && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.cost_amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_currency" className="text-sm font-medium">
                Currency
              </Label>
              <Input
                id="cost_currency"
                maxLength={3}
                placeholder={tripCurrency}
                {...form.register("cost_currency")}
                className="uppercase"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label
              htmlFor="duration_min"
              className="text-sm font-medium flex items-center gap-1"
            >
              <Clock className="h-4 w-4" />
              Duration (minutes)
            </Label>
            <Input
              id="duration_min"
              type="number"
              min="0"
              step="15"
              placeholder="e.g., 120"
              {...form.register("duration_min", { valueAsNumber: true })}
            />
            {form.formState.errors.duration_min && (
              <p className="text-sm text-red-600">
                {form.formState.errors.duration_min.message}
              </p>
            )}
          </div>

          {/* External Link */}
          <div className="space-y-2">
            <Label
              htmlFor="link"
              className="text-sm font-medium flex items-center gap-1"
            >
              <Link2 className="h-4 w-4" />
              External Link
            </Label>
            <Input
              id="link"
              type="url"
              placeholder="https://example.com"
              {...form.register("link")}
            />
            {form.formState.errors.link && (
              <p className="text-sm text-red-600">
                {form.formState.errors.link.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label
              htmlFor="location_name"
              className="text-sm font-medium flex items-center gap-1"
            >
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location_name"
              placeholder="e.g., Louvre Museum, Paris"
              defaultValue={activity.location?.name || ""}
              onChange={(e) => handleLocationChange(e.target.value)}
            />
            {/* Google Maps Integration */}
            {(activity.location || googleMapsLink) && (
              <div className="mt-2">
                <GoogleMapsIntegration
                  location={activity.location}
                  googleMapsLink={googleMapsLink}
                  activityTitle={activity.title}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-medium flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details, tips, or notes about this activity..."
              rows={3}
              {...form.register("notes")}
            />
          </div>

          {/*
            Photo upload UI temporarily disabled. Uncomment this block to restore photo management.
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Camera className="h-4 w-4" />
              Photos
            </Label>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="Activity"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } ${uploadingPhotos ? "pointer-events-none opacity-50" : ""}`}
            >
              <input {...getInputProps()} />
              <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {uploadingPhotos ? (
                <p className="text-sm text-gray-600">Processing images...</p>
              ) : isDragActive ? (
                <p className="text-sm text-gray-600">Drop photos here...</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Drag photos here or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Max 5 photos, up to 1.5MB each
                  </p>
                </div>
              )}
            </div>
          </div>
          */}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateActivity.isPending}
              className="flex-1"
            >
              {updateActivity.isPending ? "Updating..." : "Update Activity"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateActivity.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

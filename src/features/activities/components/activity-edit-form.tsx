"use client";

/**
 * ActivityEditForm handles updating existing activities with all attributes.
 * - Pre-populated with existing activity data
 * - Validated with Zod schema via react-hook-form resolver
 * - Google Maps location extraction from URLs and iframes
 * - Optimistic updates with proper error handling
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Clock,
  DollarSign,
  FileText,
  Link2,
  MapPin,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ThumbnailUpload } from "@/components/common/thumbnail-upload";
import { ActionButton, FormLoadingOverlay } from "@/components/loading";
import { Button } from "@/components/ui/button";
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
import {
  extractLatLngFromGoogleMapsSrc,
  isGoogleMapsInput,
} from "@/lib/google-maps";
import type { ThumbnailUploadResult } from "@/lib/image-upload";
import { type ActivityCreateInput, ActivityCreateSchema } from "@/schemas";
import { type Activity, useUpdateActivity } from "../hooks/use-activities";

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
] as const;

export function ActivityEditForm({
  activity,
  tripCurrency,
  onSuccess,
  onCancel,
  open = true,
  onOpenChange,
}: ActivityEditFormProps) {
  const updateActivity = useUpdateActivity();
  const [locationInputs, setLocationInputs] = useState({
    shortUrl: "",
    iframeCode: "",
  });
  const [extractedCoords, setExtractedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    activity.location
      ? { lat: activity.location.lat, lng: activity.location.lon }
      : null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<ThumbnailUploadResult | null>(
    activity.src
      ? {
          url: activity.src,
          fileName: "thumbnail",
          originalFileName: "thumbnail",
        }
      : null,
  );

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    mode: "all",
    reValidateMode: "onBlur",
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
      src: activity.src || undefined,
    },
  });

  const handleThumbnailUploaded = (result: ThumbnailUploadResult) => {
    setThumbnail(result);
    form.setValue("src", result.url);
  };

  const handleThumbnailUploadError = (error: string) => {
    toast.error(error);
  };

  // Extract coordinates helper function
  const extractCoordinates = useCallback(
    (input: string, source: string) => {
      setLocationError(null);

      if (!input.trim()) {
        return null;
      }

      const coords = extractLatLngFromGoogleMapsSrc(input);
      if (coords) {
        setExtractedCoords(coords);
        form.setValue("location", {
          name: locationInputs.shortUrl.trim() || input.trim(),
          lat: coords.lat,
          lon: coords.lng,
        });
        return coords;
      } else {
        setLocationError(`Could not extract coordinates from the ${source}`);
        return null;
      }
    },
    [form, locationInputs.shortUrl],
  );

  // Handle short URL changes
  const handleShortUrlChange = useCallback(
    (value: string) => {
      setLocationInputs((prev) => ({ ...prev, shortUrl: value }));

      if (!value.trim() && !locationInputs.iframeCode.trim()) {
        form.setValue("location", undefined);
        setExtractedCoords(null);
        setLocationError(null);
        return;
      }

      extractCoordinates(value, "URL");
    },
    [extractCoordinates, locationInputs.iframeCode, form],
  );

  // Handle iframe changes
  const handleIframeChange = useCallback(
    (value: string) => {
      setLocationInputs((prev) => ({ ...prev, iframeCode: value }));

      if (!value.trim() && !locationInputs.shortUrl.trim()) {
        form.setValue("location", undefined);
        setExtractedCoords(null);
        setLocationError(null);
        return;
      }

      extractCoordinates(value, "iframe");
    },
    [extractCoordinates, locationInputs.shortUrl, form],
  );

  // Initialize location inputs based on existing activity data
  useEffect(() => {
    // If activity has a location object with name, populate shortUrl input
    if (activity.location?.name) {
      setLocationInputs((prev) => ({
        ...prev,
        shortUrl: activity.location?.name || "",
      }));
    }
    // Alternatively, if activity.link is a Google Maps URL, use that
    else if (activity.link && isGoogleMapsInput(activity.link)) {
      setLocationInputs((prev) => ({ ...prev, shortUrl: activity.link || "" }));
    }

    // If location has coordinates, populate the extracted coords display
    if (activity.location?.lat != null && activity.location?.lon != null) {
      setExtractedCoords({
        lat: activity.location.lat,
        lng: activity.location.lon,
      });
    }
  }, [activity.link, activity.location]);

  const onSubmit = async (values: ActivityCreateInput) => {
    console.log("🚀 ~ onSubmit ~ values:", values);
    try {
      // Exclude trip_id from updates as it's immutable
      const { trip_id: _tripId, ...updates } = values;

      const updatedActivity = await updateActivity.mutateAsync({
        id: activity.id,
        updates,
      });

      onSuccess?.(updatedActivity);
      onOpenChange?.(false);
    } catch (error) {
      // Clear any previous submission errors
      form.clearErrors();

      if (error instanceof Error) {
        // Set field-specific errors
        const message = error.message.toLowerCase();
        if (message.includes("title")) {
          form.setError("title", { message: error.message });
        } else if (message.includes("cost")) {
          form.setError("cost_amount", { message: error.message });
        } else if (message.includes("duration")) {
          form.setError("duration_min", { message: error.message });
        } else if (message.includes("url") || message.includes("link")) {
          form.setError("link", { message: error.message });
        } else {
          // Show generic error toast for non-field-specific errors
          toast.error(error.message);
        }
      }
      console.error("Failed to update activity:", error);
    }
  };

  const handleCancel = () => {
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
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </Label>

            {/* Short URL Input */}
            <div className="space-y-2">
              <Label
                htmlFor="short_url"
                className="text-xs text-muted-foreground"
              >
                Google Maps Short URL
              </Label>
              <Input
                id="short_url"
                placeholder="e.g., https://maps.app.goo.gl/..."
                value={locationInputs.shortUrl}
                onChange={(e) => handleShortUrlChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Iframe Input */}
            <div className="space-y-2">
              <Label
                htmlFor="iframe_code"
                className="text-xs text-muted-foreground"
              >
                Google Maps Iframe Embed
              </Label>
              <Textarea
                id="iframe_code"
                placeholder='Paste iframe embed code: <iframe src="...">'
                rows={3}
                value={locationInputs.iframeCode}
                onChange={(e) => handleIframeChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Error Display */}
            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}

            {/* Coordinates Display */}
            {extractedCoords && (
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm font-medium">Extracted Coordinates:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span>{" "}
                    <span className="font-mono">
                      {extractedCoords.lat.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>{" "}
                    <span className="font-mono">
                      {extractedCoords.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
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

          {/* Thumbnail Upload */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Camera className="h-4 w-4" />
              Activity Thumbnail
            </Label>

            <ThumbnailUpload
              onThumbnailUploaded={handleThumbnailUploaded}
              onError={handleThumbnailUploadError}
              disabled={updateActivity.isPending}
              currentThumbnail={thumbnail?.url}
              placeholder="Upload a thumbnail for this activity"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <ActionButton
              type="submit"
              className="flex-1"
              isPending={updateActivity.isPending}
              pendingText="Updating..."
            >
              Update Activity
            </ActionButton>
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

        {/* Loading overlay for form submission */}
        <FormLoadingOverlay
          isVisible={updateActivity.isPending}
          message="Updating activity..."
        />
      </DialogContent>
    </Dialog>
  );
}

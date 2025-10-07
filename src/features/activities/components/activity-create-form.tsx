"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Clock,
  DollarSign,
  FileText,
  Link2,
  MapPin,
} from "lucide-react";
/**
 * ActivityCreateForm handles creation of new activities with all required attributes.
 * - Validated with Zod schema via react-hook-form resolver
 * - Supports photo uploads with compression
 * - Includes location support and currency handling
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ThumbnailUpload } from "@/components/common/thumbnail-upload";
import { ActionButton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { extractLatLngFromGoogleMapsSrc } from "@/lib/google-maps";
import type { ThumbnailUploadResult } from "@/lib/image-upload";
import {
  type ActivityCreateInput,
  ActivityCreateSchema,
  type RestaurantInput,
} from "@/schemas";
import { type Activity, useCreateActivity } from "../hooks/use-activities";
import { EnhancedRestaurantManager } from "./enhanced-restaurant-manager";

interface ActivityCreateFormProps {
  tripId: string;
  tripCurrency: string;
  onSuccess?: (activity: Activity) => void;
  onCancel?: () => void;
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

export function ActivityCreateForm({
  tripId,
  tripCurrency,
  onSuccess,
  onCancel,
}: ActivityCreateFormProps) {
  const createActivity = useCreateActivity();
  const [shortUrl, setShortUrl] = useState("");
  const [iframeCode, setIframeCode] = useState("");
  const [extractedCoords, setExtractedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<ThumbnailUploadResult | null>(
    null,
  );
  const [restaurants, setRestaurants] = useState<RestaurantInput[]>([]);

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: {
      trip_id: tripId,
      cost_currency: tripCurrency,
      src: undefined,
    },
  });

  const handleThumbnailUploaded = (result: ThumbnailUploadResult) => {
    setThumbnail(result);
    form.setValue("src", result.url);
  };

  const handleThumbnailUploadError = (error: string) => {
    toast.error(error);
  };

  const handleShortUrlChange = (value: string) => {
    setShortUrl(value);
    setLocationError(null);

    if (!value.trim()) {
      // Don't clear location if iframe still has value
      if (!iframeCode.trim()) {
        form.setValue("location", undefined);
        setExtractedCoords(null);
      }
      return;
    }

    const coords = extractLatLngFromGoogleMapsSrc(value);
    if (coords) {
      setExtractedCoords(coords);
      form.setValue("location", {
        name: value.trim(),
        lat: coords.lat,
        lon: coords.lng,
      });
      setLocationError(null);
    } else {
      setLocationError("Could not extract coordinates from the URL");
    }
  };

  const handleIframeChange = (value: string) => {
    setIframeCode(value);
    setLocationError(null);

    if (!value.trim()) {
      // Don't clear location if short URL still has value
      if (!shortUrl.trim()) {
        form.setValue("location", undefined);
        setExtractedCoords(null);
      }
      return;
    }

    const coords = extractLatLngFromGoogleMapsSrc(value);
    if (coords) {
      setExtractedCoords(coords);
      form.setValue("location", {
        name: shortUrl.trim() || value.trim(),
        lat: coords.lat,
        lon: coords.lng,
      });
      setLocationError(null);
    } else {
      setLocationError("Could not extract coordinates from the iframe");
    }
  };

  const onSubmit = async (values: ActivityCreateInput) => {
    try {
      const activityData = { ...values, restaurants };
      const activity = await createActivity.mutateAsync(activityData);
      onSuccess?.(activity);
      form.reset({
        trip_id: tripId,
        cost_currency: tripCurrency,
        src: undefined,
      });
      setShortUrl("");
      setIframeCode("");
      setExtractedCoords(null);
      setLocationError(null);
      setThumbnail(null);
      setRestaurants([]);
    } catch (error) {
      // Clear any previous submission errors
      form.clearErrors();

      if (error instanceof Error) {
        // Set field-specific errors if applicable
        if (error.message.toLowerCase().includes("title")) {
          form.setError("title", { message: error.message });
        } else if (error.message.toLowerCase().includes("cost")) {
          form.setError("cost_amount", { message: error.message });
        } else if (error.message.toLowerCase().includes("duration")) {
          form.setError("duration_min", { message: error.message });
        } else if (
          error.message.toLowerCase().includes("url") ||
          error.message.toLowerCase().includes("link")
        ) {
          form.setError("link", { message: error.message });
        }
      }
      console.error("Failed to create activity:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add Activity</CardTitle>
        <CardDescription>
          Create a new activity for your trip. You can assign it to specific
          time blocks later.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              onValueChange={(value) => form.setValue("category", value)}
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
                value={shortUrl}
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
                value={iframeCode}
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
              disabled={createActivity.isPending}
              currentThumbnail={thumbnail?.url}
              placeholder="Upload a thumbnail for this activity"
            />
          </div>

          {/* Restaurant Recommendations */}
          <div className="space-y-4">
            <EnhancedRestaurantManager
              restaurants={restaurants}
              onRestaurantsChange={setRestaurants}
              disabled={createActivity.isPending}
              tripLocation={
                extractedCoords
                  ? { lat: extractedCoords.lat, lng: extractedCoords.lng }
                  : undefined
              }
              defaultMode="google"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <ActionButton
              type="submit"
              className="flex-1"
              isPending={createActivity.isPending}
              pendingText="Creating..."
            >
              Create Activity
            </ActionButton>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createActivity.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

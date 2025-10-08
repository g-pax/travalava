"use client";

/**
 * GooglePlacesActivityForm handles activity creation using Google Places data
 * - Pre-fills form with Google Places information
 * - Supports photo import from Google Places
 * - Maintains compatibility with existing activity schema
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  googlePlacesService,
  type PlaceDetails,
  type PlaceSearchResult,
} from "@/lib/google-places";
import { type ActivityCreateInput, ActivityCreateSchema } from "@/schemas";
import { type Activity, useCreateActivity } from "../hooks/use-activities";
import { GooglePlacesSearch } from "./google-places-search";

interface GooglePlacesActivityFormProps {
  tripId: string;
  tripCurrency: string;
  tripLocation?: {
    lat: number;
    lng: number;
  };
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

export function GooglePlacesActivityForm({
  tripId,
  tripCurrency,
  tripLocation,
  onSuccess,
  onCancel,
}: GooglePlacesActivityFormProps) {
  const createActivity = useCreateActivity();
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [_placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isPreFilled, setIsPreFilled] = useState(false);

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: {
      trip_id: tripId,
      cost_currency: tripCurrency,
    },
  });

  const handlePlaceSelect = (
    place: PlaceSearchResult,
    details?: PlaceDetails,
  ) => {
    setSelectedPlace(place);
    setPlaceDetails(details || null);

    // Pre-fill form with Google Places data
    const activityData = googlePlacesService.toActivityInput(
      place,
      tripId,
      tripCurrency,
    );

    // Set form values
    form.setValue("title", activityData.title);
    form.setValue("category", activityData.category);
    form.setValue("location", activityData.location);
    form.setValue("cost_currency", activityData.cost_currency);
    form.setValue("notes", activityData.notes || "");

    // Set photo if available
    if (activityData.src) {
      form.setValue("src", activityData.src);
    }

    // Add additional data from details if available
    if (details) {
      let notes = activityData.notes || "";

      if (details.editorial_summary?.overview) {
        notes = details.editorial_summary.overview;
      }

      if (details.website) {
        form.setValue("link", details.website);
      }

      if (
        details.formatted_phone_number &&
        !notes.includes(details.formatted_phone_number)
      ) {
        notes += notes
          ? `\n\nPhone: ${details.formatted_phone_number}`
          : `Phone: ${details.formatted_phone_number}`;
      }

      form.setValue("notes", notes);
    }

    setIsPreFilled(true);
    toast.success(`Pre-filled activity data from ${place.name}`);
  };

  const onSubmit = async (values: ActivityCreateInput) => {
    try {
      const activity = await createActivity.mutateAsync(values);
      onSuccess?.(activity);

      // Reset form
      form.reset({
        trip_id: tripId,
        cost_currency: tripCurrency,
      });
      setSelectedPlace(null);
      setPlaceDetails(null);
      setIsPreFilled(false);
    } catch (error) {
      // Handle field-specific errors
      form.clearErrors();

      if (error instanceof Error) {
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

  const clearSelection = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
    setIsPreFilled(false);
    form.reset({
      trip_id: tripId,
      cost_currency: tripCurrency,
    });
  };

  return (
    <div className="space-y-6">
      {/* Google Places Search */}
      {!selectedPlace && (
        <GooglePlacesSearch
          onPlaceSelect={handlePlaceSelect}
          searchType="activity"
          placeholder="Search for activities, attractions, museums..."
          initialLocation={tripLocation}
          disabled={createActivity.isPending}
        />
      )}

      {/* Activity Form */}
      {(isPreFilled || selectedPlace) && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Details</CardTitle>
                <CardDescription>
                  {selectedPlace
                    ? `Based on ${selectedPlace.name}`
                    : "Review and edit activity information"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Change Place
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
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
                  <Label htmlFor="cost_amount" className="text-sm font-medium">
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
                  <Label
                    htmlFor="cost_currency"
                    className="text-sm font-medium"
                  >
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
                <Label htmlFor="duration_min" className="text-sm font-medium">
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
                <Label htmlFor="link" className="text-sm font-medium">
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

              {/* Location (read-only, from Google Places) */}
              {form.watch("location") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">
                      {form.watch("location")?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {form.watch("location")?.lat.toFixed(6)},{" "}
                      {form.watch("location")?.lon.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details, tips, or notes about this activity..."
                  rows={4}
                  {...form.register("notes")}
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
      )}
    </div>
  );
}

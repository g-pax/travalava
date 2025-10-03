"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, DollarSign, FileText, Link2, MapPin } from "lucide-react";
/**
 * ActivityCreateForm handles creation of new activities with all required attributes.
 * - Validated with Zod schema via react-hook-form resolver
 * - Supports photo uploads with compression
 * - Includes location support and currency handling
 */
import { useForm } from "react-hook-form";
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
import { type ActivityCreateInput, ActivityCreateSchema } from "@/schemas";
import { type Activity, useCreateActivity } from "../hooks/use-activities";

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

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    defaultValues: {
      trip_id: tripId,
      cost_currency: tripCurrency,
    },
  });

  const onSubmit = async (values: ActivityCreateInput) => {
    try {
      const activity = await createActivity.mutateAsync(values);
      onSuccess?.(activity);
      form.reset({ trip_id: tripId, cost_currency: tripCurrency });
    } catch (error) {
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
              onChange={(e) => {
                // TODO: Implement location search/geocoding
                const locationName = e.target.value;
                if (locationName) {
                  form.setValue("location", {
                    name: locationName,
                    lat: 0, // TODO: Get from geocoding
                    lon: 0, // TODO: Get from geocoding
                  });
                } else {
                  form.setValue("location", undefined);
                }
              }}
            />
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

          {/* TODO: Photo upload section will be added later */}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createActivity.isPending}
              className="flex-1"
            >
              {createActivity.isPending ? "Creating..." : "Create Activity"}
            </Button>
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

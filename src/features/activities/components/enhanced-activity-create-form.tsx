"use client";

/**
 * EnhancedActivityCreateForm integrates Google Places with manual entry
 * - Provides both Google Places search and manual entry options
 * - Maintains all existing functionality
 * - Optimized for cost efficiency with caching
 */

import type { Activity } from "../hooks/use-activities";
import { ActivityCreateForm } from "./activity-create-form";
import { ActivityEntryModeToggle } from "./activity-entry-mode-toggle";
import { GooglePlacesActivityForm } from "./google-places-activity-form";

interface EnhancedActivityCreateFormProps {
  tripId: string;
  tripCurrency: string;
  tripLocation?: {
    lat: number;
    lng: number;
  };
  onSuccess?: (activity: Activity) => void;
  onCancel?: () => void;
  defaultMode?: "google" | "manual";
}

export function EnhancedActivityCreateForm({
  tripId,
  tripCurrency,
  tripLocation,
  onSuccess,
  onCancel,
  defaultMode = "google",
}: EnhancedActivityCreateFormProps) {
  // Manual entry component (existing form)
  const manualEntryComponent = (
    <ActivityCreateForm
      tripId={tripId}
      tripCurrency={tripCurrency}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );

  // Google Places component (new form)
  const googlePlacesComponent = (
    <GooglePlacesActivityForm
      tripId={tripId}
      tripCurrency={tripCurrency}
      tripLocation={tripLocation}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );

  return (
    <ActivityEntryModeToggle
      manualEntryComponent={manualEntryComponent}
      googlePlacesComponent={googlePlacesComponent}
      defaultMode={defaultMode}
    />
  );
}

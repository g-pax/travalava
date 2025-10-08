"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RestaurantEntryModeToggle } from "@/features/activities/components/activity-entry-mode-toggle";
import { GooglePlacesRestaurantForm } from "@/features/activities/components/google-places-restaurant-form";
import { useCreateRestaurant } from "../hooks/use-restaurants";
import type { RestaurantFormData } from "../types";

interface RestaurantCreateDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripLocation?: {
    lat: number;
    lng: number;
  };
}

export function RestaurantCreateDialog({
  tripId,
  open,
  onOpenChange,
  tripLocation,
}: RestaurantCreateDialogProps) {
  const createRestaurant = useCreateRestaurant();

  const handleSave = async (data: RestaurantFormData) => {
    try {
      await createRestaurant.mutateAsync({
        ...data,
        trip_id: tripId,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Google Places component
  const googlePlacesComponent = (
    <GooglePlacesRestaurantForm
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={createRestaurant.isPending}
      tripLocation={tripLocation}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Restaurant</DialogTitle>
        </DialogHeader>

        <RestaurantEntryModeToggle
          googlePlacesComponent={googlePlacesComponent}
          defaultMode="google"
          disabled={createRestaurant.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

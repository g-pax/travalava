"use client";

/**
 * ActivityRestaurantSection displays and manages restaurants for a specific activity
 * - Shows existing restaurants in a clean grid layout
 * - Allows adding new restaurants via Google Places or manual entry
 * - Updates the activity with new restaurants
 */

import { Plus, Utensils } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RestaurantInput } from "@/schemas";
import { type Activity, useUpdateActivity } from "../hooks/use-activities";
import { RestaurantEntryModeToggle } from "./activity-entry-mode-toggle";
import { GooglePlacesRestaurantForm } from "./google-places-restaurant-form";
import { RestaurantCard } from "./restaurant-card";
import { RestaurantForm } from "./restaurant-form";

interface ActivityRestaurantSectionProps {
  activity: Activity;
}

export function ActivityRestaurantSection({
  activity,
}: ActivityRestaurantSectionProps) {
  const updateActivity = useUpdateActivity();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Get current restaurants from activity
  const restaurants = (activity as any).restaurants || [];

  const handleAddRestaurant = () => {
    setEditingIndex(null);
    setIsAddDialogOpen(true);
  };

  const handleEditRestaurant = (index: number) => {
    setEditingIndex(index);
    setIsAddDialogOpen(true);
  };

  const handleSaveRestaurant = async (restaurant: RestaurantInput) => {
    try {
      const updatedRestaurants = [...restaurants];

      if (editingIndex !== null) {
        updatedRestaurants[editingIndex] = restaurant;
      } else {
        updatedRestaurants.push(restaurant);
      }

      // Update the activity with new restaurants
      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { restaurants: updatedRestaurants },
      });

      setIsAddDialogOpen(false);
      setEditingIndex(null);
      toast.success(
        editingIndex !== null
          ? "Restaurant updated successfully!"
          : "Restaurant added successfully!"
      );
    } catch (error) {
      toast.error("Failed to save restaurant");
      console.error("Restaurant save error:", error);
    }
  };

  const handleDeleteRestaurant = async (index: number) => {
    try {
      const updatedRestaurants = restaurants.filter((_: any, i: number) => i !== index);

      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { restaurants: updatedRestaurants },
      });

      toast.success("Restaurant removed successfully!");
    } catch (error) {
      toast.error("Failed to remove restaurant");
      console.error("Restaurant delete error:", error);
    }
  };

  const handleCancelForm = () => {
    setIsAddDialogOpen(false);
    setEditingIndex(null);
  };

  const editingRestaurant = editingIndex !== null ? restaurants[editingIndex] : undefined;

  // Manual entry component
  const manualEntryComponent = (
    <RestaurantForm
      restaurant={editingRestaurant}
      onSave={handleSaveRestaurant}
      onCancel={handleCancelForm}
      isLoading={updateActivity.isPending}
    />
  );

  // Google Places component
  const googlePlacesComponent = (
    <GooglePlacesRestaurantForm
      restaurant={editingRestaurant}
      onSave={handleSaveRestaurant}
      onCancel={handleCancelForm}
      isLoading={updateActivity.isPending}
      tripLocation={
        activity.location
          ? { lat: activity.location.lat, lng: activity.location.lon }
          : undefined
      }
    />
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Restaurant Recommendations
            </CardTitle>
            <CardDescription>
              {restaurants.length > 0
                ? `${restaurants.length} dining ${restaurants.length === 1 ? "option" : "options"} near this activity`
                : "Add dining recommendations for this activity"}
            </CardDescription>
          </div>
          <Button
            onClick={handleAddRestaurant}
            size="sm"
            className="flex items-center gap-2"
            disabled={updateActivity.isPending}
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((restaurant: any, index: number) => (
              <RestaurantCard
                key={restaurant.id || index}
                restaurant={restaurant}
                onEdit={() => handleEditRestaurant(index)}
                onDelete={() => handleDeleteRestaurant(index)}
                disabled={updateActivity.isPending}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No restaurants yet
            </h3>
            <p className="text-gray-500 mb-4">
              Add restaurant recommendations to help with meal planning for this activity.
            </p>
            <Button onClick={handleAddRestaurant} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Restaurant
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Restaurant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Restaurant" : "Add Restaurant"}
            </DialogTitle>
          </DialogHeader>

          {editingIndex !== null ? (
            // For editing, always use manual form to maintain existing data structure
            manualEntryComponent
          ) : (
            // For new restaurants, offer both Google Places and manual entry
            <RestaurantEntryModeToggle
              manualEntryComponent={manualEntryComponent}
              googlePlacesComponent={googlePlacesComponent}
              defaultMode="google"
              disabled={updateActivity.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
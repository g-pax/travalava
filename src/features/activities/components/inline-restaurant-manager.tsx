"use client";

/**
 * @deprecated This component is deprecated. Use ActivityRestaurantSelector from @/features/restaurants/components instead.
 *
 * MIGRATION: Replace with the new standalone restaurant system:
 * - Restaurants are now managed separately at /trips/[id]/restaurants
 * - Use ActivityRestaurantSelector to link existing restaurants to activities
 * - See RESTAURANT_MIGRATION.md for full migration guide
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
import { RestaurantListSelector } from "@/features/restaurants";
import {
  useCreateRestaurant,
  useDeleteRestaurant,
  useLinkRestaurantToActivity,
  useRestaurantsByActivity,
  useUnlinkRestaurantFromActivity,
  useUpdateRestaurant,
} from "@/features/restaurants/hooks/use-restaurants";
import type {
  RestaurantFormData,
  RestaurantWithActivityLinks,
} from "@/features/restaurants/types";
import { RestaurantEntryModeToggle } from "./activity-entry-mode-toggle";
import { GooglePlacesRestaurantForm } from "./google-places-restaurant-form";
import { RestaurantCard } from "./restaurant-card";

interface InlineRestaurantManagerProps {
  activityId: string;
  tripId: string;
  tripLocation?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export function InlineRestaurantManager({
  activityId,
  tripId,
  tripLocation,
  className,
}: InlineRestaurantManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<RestaurantWithActivityLinks | null>(null);

  // Hooks for restaurant operations
  const {
    data: restaurants = [],
    isLoading,
    refetch,
  } = useRestaurantsByActivity(activityId);
  const createRestaurant = useCreateRestaurant();
  const updateRestaurant = useUpdateRestaurant();
  const deleteRestaurant = useDeleteRestaurant();
  const linkRestaurant = useLinkRestaurantToActivity();
  const unlinkRestaurant = useUnlinkRestaurantFromActivity();

  const isUpdating =
    createRestaurant.isPending ||
    updateRestaurant.isPending ||
    deleteRestaurant.isPending ||
    linkRestaurant.isPending ||
    unlinkRestaurant.isPending;

  const handleAddRestaurant = () => {
    setEditingRestaurant(null);
    setIsFormOpen(true);
  };

  const handleEditRestaurant = (restaurant: RestaurantWithActivityLinks) => {
    setEditingRestaurant(restaurant);
    setIsFormOpen(true);
  };

  const handleSaveRestaurant = async (
    restaurantData: RestaurantFormData & { id?: string },
  ) => {
    try {
      if (editingRestaurant) {
        // Update existing restaurant
        await updateRestaurant.mutateAsync({
          id: editingRestaurant.id,
          ...restaurantData,
        });
      } else if (restaurantData.id) {
        // Link existing restaurant from saved list to this activity
        await linkRestaurant.mutateAsync({
          activity_id: activityId,
          restaurant_id: restaurantData.id,
          sort_order: restaurants.length,
        });
      } else {
        // Create new restaurant and link to activity
        const newRestaurant = await createRestaurant.mutateAsync({
          ...restaurantData,
          trip_id: tripId,
        });

        // Link the new restaurant to this activity
        await linkRestaurant.mutateAsync({
          activity_id: activityId,
          restaurant_id: newRestaurant.id!,
          sort_order: restaurants.length,
        });
      }

      setIsFormOpen(false);
      setEditingRestaurant(null);
      refetch();
    } catch (error) {
      // Errors are handled by the mutation hooks
      console.error("Restaurant save error:", error);
    }
  };

  const handleDeleteRestaurant = async (
    restaurant: RestaurantWithActivityLinks,
  ) => {
    try {
      // First unlink from activity
      await unlinkRestaurant.mutateAsync({
        activity_id: activityId,
        restaurant_id: restaurant.id,
      });

      // Check if restaurant is linked to other activities before deleting
      if (
        restaurant.linked_activities_count &&
        restaurant.linked_activities_count <= 1
      ) {
        // Only linked to this activity, safe to delete
        await deleteRestaurant.mutateAsync(restaurant.id);
      }

      refetch();
    } catch (error) {
      // Errors are handled by the mutation hooks
      console.error("Restaurant delete error:", error);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingRestaurant(null);
  };

  return (
    <Card className={className}>
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
            disabled={isUpdating}
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading restaurants...</p>
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onEdit={() => handleEditRestaurant(restaurant)}
                onDelete={() => handleDeleteRestaurant(restaurant)}
                disabled={isUpdating}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No restaurants added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add restaurant recommendations to help travelers find great places
              to eat near this activity.
            </p>
            <Button
              onClick={handleAddRestaurant}
              variant="outline"
              className="gap-2"
              disabled={isUpdating}
            >
              <Plus className="h-4 w-4" />
              Add Your First Restaurant
            </Button>
          </div>
        )}
      </CardContent>

      {/* Restaurant Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}
            </DialogTitle>
          </DialogHeader>

          <RestaurantEntryModeToggle
            defaultMode="google"
            googlePlacesComponent={
              <GooglePlacesRestaurantForm
                onSave={handleSaveRestaurant}
                onCancel={handleCancelForm}
                isLoading={isUpdating}
                tripLocation={tripLocation}
              />
            }
            manualEntryComponent={
              <RestaurantListSelector
                tripId={tripId}
                onSelect={handleSaveRestaurant}
                onCancel={handleCancelForm}
                selectedRestaurantId={editingRestaurant?.id}
              />
            }
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

"use client";

import { Edit, Plus, Utensils } from "lucide-react";
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
import { RestaurantEntryModeToggle } from "./activity-entry-mode-toggle";
import { GooglePlacesRestaurantForm } from "./google-places-restaurant-form";
import { RestaurantCard } from "./restaurant-card";
import { RestaurantForm } from "./restaurant-form";

interface InlineRestaurantManagerProps {
  restaurants: RestaurantInput[];
  onRestaurantsUpdate: (restaurants: RestaurantInput[]) => Promise<void>;
  isUpdating?: boolean;
  tripLocation?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export function InlineRestaurantManager({
  restaurants,
  onRestaurantsUpdate,
  isUpdating = false,
  tripLocation,
  className,
}: InlineRestaurantManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddRestaurant = () => {
    setEditingIndex(null);
    setIsFormOpen(true);
  };

  const handleEditRestaurant = (index: number) => {
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const handleSaveRestaurant = async (restaurant: RestaurantInput) => {
    const newRestaurants = [...restaurants];

    if (editingIndex !== null) {
      newRestaurants[editingIndex] = restaurant;
      toast.success("Restaurant updated successfully");
    } else {
      newRestaurants.push(restaurant);
      toast.success("Restaurant added successfully");
    }

    await onRestaurantsUpdate(newRestaurants);
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const handleDeleteRestaurant = async (index: number) => {
    const newRestaurants = restaurants.filter((_, i) => i !== index);
    await onRestaurantsUpdate(newRestaurants);
    toast.success("Restaurant removed successfully");
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const editingRestaurant = editingIndex !== null ? restaurants[editingIndex] : undefined;

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
        {restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id || index}
                restaurant={restaurant}
                onEdit={() => handleEditRestaurant(index)}
                onDelete={() => handleDeleteRestaurant(index)}
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
              Add restaurant recommendations to help travelers find great places to eat near this activity.
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
              {editingIndex !== null ? "Edit Restaurant" : "Add Restaurant"}
            </DialogTitle>
          </DialogHeader>

          <RestaurantEntryModeToggle defaultMode="google">
            {({ mode, toggleMode }) => (
              <div className="space-y-6">
                {mode === "manual" ? (
                  <RestaurantForm
                    restaurant={editingRestaurant}
                    onSave={handleSaveRestaurant}
                    onCancel={handleCancelForm}
                    isLoading={isUpdating}
                  />
                ) : (
                  <GooglePlacesRestaurantForm
                    restaurant={editingRestaurant}
                    onSave={handleSaveRestaurant}
                    onCancel={handleCancelForm}
                    isLoading={isUpdating}
                    tripLocation={tripLocation}
                  />
                )}
              </div>
            )}
          </RestaurantEntryModeToggle>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
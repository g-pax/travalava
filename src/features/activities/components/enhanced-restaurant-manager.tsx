"use client";

/**
 * EnhancedRestaurantManager integrates Google Places with manual restaurant entry
 * - Provides both Google Places search and manual entry options
 * - Maintains all existing functionality for restaurant management
 * - Optimized for cost efficiency with caching
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
import { RestaurantEntryModeToggle } from "./activity-entry-mode-toggle";
import { GooglePlacesRestaurantForm } from "./google-places-restaurant-form";
import { RestaurantCard } from "./restaurant-card";
import { RestaurantForm } from "./restaurant-form";

interface EnhancedRestaurantManagerProps {
  restaurants: RestaurantInput[];
  onRestaurantsChange: (restaurants: RestaurantInput[]) => void;
  disabled?: boolean;
  tripLocation?: {
    lat: number;
    lng: number;
  };
  defaultMode?: "google" | "manual";
}

export function EnhancedRestaurantManager({
  restaurants,
  onRestaurantsChange,
  disabled = false,
  tripLocation,
  defaultMode = "google",
}: EnhancedRestaurantManagerProps) {
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

  const handleSaveRestaurant = (restaurant: RestaurantInput) => {
    const newRestaurants = [...restaurants];

    if (editingIndex !== null) {
      newRestaurants[editingIndex] = restaurant;
    } else {
      newRestaurants.push(restaurant);
    }

    onRestaurantsChange(newRestaurants);
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const handleDeleteRestaurant = (index: number) => {
    const newRestaurants = restaurants.filter((_, i) => i !== index);
    onRestaurantsChange(newRestaurants);
    toast.success("Restaurant removed");
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const editingRestaurant =
    editingIndex !== null ? restaurants[editingIndex] : undefined;

  // Manual entry component (existing form)
  const manualEntryComponent = (
    <RestaurantForm
      restaurant={editingRestaurant}
      onSave={handleSaveRestaurant}
      onCancel={handleCancelForm}
      isLoading={disabled}
    />
  );

  // Google Places component (new form)
  const googlePlacesComponent = (
    <GooglePlacesRestaurantForm
      restaurant={editingRestaurant}
      onSave={handleSaveRestaurant}
      onCancel={handleCancelForm}
      isLoading={disabled}
      tripLocation={tripLocation}
    />
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Restaurant Recommendations
            </CardTitle>
            <CardDescription>
              Add nearby restaurants for this activity
            </CardDescription>
          </div>
          <Button
            onClick={handleAddRestaurant}
            disabled={disabled}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </div>
      </CardHeader>

      {restaurants.length > 0 && (
        <CardContent>
          <div className="grid gap-4">
            {restaurants.map((restaurant, index) => (
              <RestaurantCard
                key={index}
                restaurant={restaurant}
                onEdit={() => handleEditRestaurant(index)}
                onDelete={() => handleDeleteRestaurant(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </CardContent>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
              defaultMode={defaultMode}
              disabled={disabled}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

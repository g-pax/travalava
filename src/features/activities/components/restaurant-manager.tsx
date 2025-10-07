"use client";

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
import { RestaurantCard } from "./restaurant-card";
import { RestaurantForm } from "./restaurant-form";

interface RestaurantManagerProps {
  restaurants: RestaurantInput[];
  onRestaurantsChange: (restaurants: RestaurantInput[]) => void;
  disabled?: boolean;
}

export function RestaurantManager({
  restaurants,
  onRestaurantsChange,
  disabled = false,
}: RestaurantManagerProps) {
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
      // Editing existing restaurant
      newRestaurants[editingIndex] = {
        ...restaurant,
        id: restaurants[editingIndex].id,
      };
    } else {
      // Adding new restaurant
      newRestaurants.push({ ...restaurant, id: `temp_${Date.now()}` });
    }

    onRestaurantsChange(newRestaurants);
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const handleDeleteRestaurant = (index: number) => {
    if (confirm("Are you sure you want to remove this restaurant?")) {
      const newRestaurants = restaurants.filter((_, i) => i !== index);
      onRestaurantsChange(newRestaurants);
      toast.success("Restaurant removed");
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Restaurant Recommendations
              </CardTitle>
              <CardDescription>
                Add restaurant options near this activity location
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={handleAddRestaurant}
              disabled={disabled}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Restaurant
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {restaurants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No restaurants added yet</p>
              <p className="text-xs mt-1">
                Click "Add Restaurant" to recommend dining options for this
                activity
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant, index) => (
                <RestaurantCard
                  key={restaurant.id || index}
                  restaurant={restaurant}
                  onEdit={() => handleEditRestaurant(index)}
                  onDelete={() => handleDeleteRestaurant(index)}
                  showActions={!disabled}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Restaurant" : "Add Restaurant"}
            </DialogTitle>
          </DialogHeader>
          <RestaurantForm
            restaurant={
              editingIndex !== null ? restaurants[editingIndex] : undefined
            }
            onSave={handleSaveRestaurant}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

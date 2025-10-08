"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RestaurantForm } from "@/features/activities/components/restaurant-form";
import { useUpdateRestaurant } from "../hooks/use-restaurants";
import type { Restaurant, RestaurantFormData } from "../types";

interface RestaurantEditDialogProps {
  restaurant: Restaurant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestaurantEditDialog({
  restaurant,
  open,
  onOpenChange,
}: RestaurantEditDialogProps) {
  const updateRestaurant = useUpdateRestaurant();

  const handleSave = async (data: RestaurantFormData) => {
    try {
      await updateRestaurant.mutateAsync({
        id: restaurant.id!,
        ...data,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Convert restaurant to form data format
  const restaurantFormData: RestaurantFormData = {
    name: restaurant.name,
    cuisine_type: restaurant.cuisine_type,
    price_range: restaurant.price_range,
    description: restaurant.description,
    address: restaurant.address,
    phone: restaurant.phone,
    website: restaurant.website,
    image_url: restaurant.image_url,
    rating: restaurant.rating,
    review_count: restaurant.review_count,
    place_id: restaurant.place_id,
    lat: restaurant.lat,
    lon: restaurant.lon,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Restaurant</DialogTitle>
        </DialogHeader>

        <RestaurantForm
          restaurant={restaurantFormData}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={updateRestaurant.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

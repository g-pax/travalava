"use client";

/**
 * GooglePlacesRestaurantForm handles restaurant creation using Google Places data
 * - Pre-fills form with Google Places restaurant information
 * - Supports photo import from Google Places
 * - Maintains compatibility with existing restaurant schema
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Star, Utensils } from "lucide-react";
import Image from "next/image";
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
import { type RestaurantInput, RestaurantSchema } from "@/schemas";
import { GooglePlacesSearch } from "./google-places-search";

interface GooglePlacesRestaurantFormProps {
  restaurant?: RestaurantInput;
  onSave: (restaurant: RestaurantInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  tripLocation?: {
    lat: number;
    lng: number;
  };
}

const priceRangeOptions = [
  { value: "$", label: "$ (Budget-friendly)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Upscale)" },
  { value: "$$$$", label: "$$$$ (Fine dining)" },
];

export function GooglePlacesRestaurantForm({
  restaurant,
  onSave,
  onCancel,
  isLoading = false,
  tripLocation,
}: GooglePlacesRestaurantFormProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [_placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isPreFilled, setIsPreFilled] = useState(false);

  const form = useForm<RestaurantInput>({
    resolver: zodResolver(RestaurantSchema),
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: restaurant || {
      name: "",
      cuisine_type: "",
      description: "",
      address: "",
      phone: "",
      website: "",
      image_url: "",
      rating: undefined,
      review_count: undefined,
    },
  });

  const handlePlaceSelect = (
    place: PlaceSearchResult,
    details?: PlaceDetails,
  ) => {
    setSelectedPlace(place);
    setPlaceDetails(details || null);

    // Pre-fill form with Google Places data
    const restaurantData = googlePlacesService.toRestaurantInput(
      place,
      details,
    );

    // Set form values
    Object.entries(restaurantData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        form.setValue(key as keyof RestaurantInput, value);
      }
    });

    setIsPreFilled(true);
    toast.success(`Pre-filled restaurant data from ${place.name}`);
  };

  const onSubmit = async (data: RestaurantInput) => {
    try {
      await onSave(data);
      toast.success("Restaurant saved successfully!");

      // Reset form
      form.reset({
        name: "",
        cuisine_type: "",
        description: "",
        address: "",
        phone: "",
        website: "",
        image_url: "",
        rating: undefined,
        review_count: undefined,
      });
      setSelectedPlace(null);
      setPlaceDetails(null);
      setIsPreFilled(false);
    } catch (error) {
      toast.error("Failed to save restaurant");
      console.error("Restaurant save error:", error);
    }
  };

  const clearSelection = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
    setIsPreFilled(false);
    form.reset({
      name: "",
      cuisine_type: "",
      description: "",
      address: "",
      phone: "",
      website: "",
      image_url: "",
      rating: undefined,
      review_count: undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Google Places Search */}
      {!selectedPlace && (
        <GooglePlacesSearch
          onPlaceSelect={handlePlaceSelect}
          searchType="restaurant"
          placeholder="Search for restaurants, cafes, bars..."
          initialLocation={tripLocation}
          disabled={isLoading}
        />
      )}

      {/* Restaurant Form */}
      {(isPreFilled || selectedPlace) && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Restaurant Details
                </CardTitle>
                <CardDescription>
                  {selectedPlace
                    ? `Based on ${selectedPlace.name}`
                    : "Review and edit restaurant information"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Change Place
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter restaurant name"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisine_type">Cuisine Type</Label>
                  <Input
                    id="cuisine_type"
                    placeholder="e.g., Italian, Mexican, Asian"
                    {...form.register("cuisine_type")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <Select
                    value={form.watch("price_range") || ""}
                    onValueChange={(value) =>
                      form.setValue(
                        "price_range",
                        value as "$" | "$$" | "$$$" | "$$$$",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      placeholder="0.0"
                      {...form.register("rating", { valueAsNumber: true })}
                    />
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the restaurant"
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <Input
                    id="address"
                    placeholder="Restaurant address"
                    {...form.register("address")}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    {...form.register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://..."
                    {...form.register("website")}
                  />
                  {form.formState.errors.website && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.website.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_count">Number of Reviews</Label>
                <Input
                  id="review_count"
                  type="number"
                  min="0"
                  placeholder="Number of reviews"
                  {...form.register("review_count", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder="https://..."
                  {...form.register("image_url")}
                />
                {form.formState.errors.image_url && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.image_url.message}
                  </p>
                )}
              </div>

              {/* Show preview of the image if URL is provided */}
              {form.watch("image_url") && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="border rounded-md p-2">
                    <Image
                      src={form.watch("image_url") || ""}
                      alt="Restaurant preview"
                      className="w-full h-32 object-cover rounded"
                      width={128}
                      height={128}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <ActionButton
                  type="submit"
                  className="flex-1"
                  isPending={isLoading}
                  pendingText="Saving..."
                >
                  Save Restaurant
                </ActionButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

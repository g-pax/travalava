"use client";

/**
 * GooglePlacesRestaurantForm handles restaurant creation using Google Places data
 * - Displays rich Google Places information (not stored)
 * - Only stores place_id, lat, lon per Google ToS
 * - Fetches fresh data from Google when needed
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DollarSign,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ActionButton } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  googlePlacesService,
  type PlaceDetails,
  type PlaceSearchResult,
} from "@/lib/google-places";
import { GooglePlacesSearch } from "./google-places-search";

// Schema for data we actually save (Google ToS compliant)
const RestaurantSaveSchema = z.object({
  place_id: z.string().min(1, "Place ID is required"),
  lat: z.number(),
  lon: z.number(),
  name: z.string().min(1, "Name is required"),
});

type RestaurantSaveData = z.infer<typeof RestaurantSaveSchema>;

interface GooglePlacesRestaurantFormProps {
  onSave: (restaurant: RestaurantSaveData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  tripLocation?: {
    lat: number;
    lng: number;
  };
}

export function GooglePlacesRestaurantForm({
  onSave,
  onCancel,
  isLoading = false,
  tripLocation,
}: GooglePlacesRestaurantFormProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );

  const [displayData, setDisplayData] = useState<ReturnType<
    typeof googlePlacesService.toRestaurantInput
  > | null>(null);

  const form = useForm<RestaurantSaveData>({
    resolver: zodResolver(RestaurantSaveSchema),
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    progressive: true,
  });

  const handlePlaceSelect = (
    place: PlaceSearchResult,
    details?: PlaceDetails,
  ) => {
    setSelectedPlace(place);

    // Get all available data for display purposes
    const googleData = googlePlacesService.toRestaurantInput(place, details);
    setDisplayData(googleData);

    // Only set data we're allowed to save
    form.setValue("place_id", googleData.place_id);
    form.setValue("lat", googleData.lat);
    form.setValue("lon", googleData.lon);
    form.setValue("name", googleData.name);

    toast.success(`Selected ${place.name}`);
  };

  const onSubmit = async (data: RestaurantSaveData) => {
    try {
      await onSave(data);
      toast.success("Restaurant saved successfully!");

      // Reset form
      form.reset();
      setSelectedPlace(null);
      setDisplayData(null);
    } catch (error) {
      toast.error("Failed to save restaurant");
      console.error("Restaurant save error:", error);
    }
  };

  const clearSelection = () => {
    setSelectedPlace(null);
    setDisplayData(null);
    form.reset();
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

      {/* Restaurant Preview & Form */}
      {selectedPlace && displayData && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  {displayData.name}
                </CardTitle>
                <CardDescription>
                  Information from Google Places (refreshed on each view)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={isLoading}
              >
                Change
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image */}
            {displayData.image_url && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={displayData.image_url}
                  alt={displayData.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Quick Info Badges */}
            <div className="flex flex-wrap gap-2">
              {displayData.rating && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {displayData.rating}
                  {displayData.review_count && (
                    <span className="text-muted-foreground ml-1">
                      ({displayData.review_count})
                    </span>
                  )}
                </Badge>
              )}
              {displayData.price_range && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {displayData.price_range}
                </Badge>
              )}
              {displayData.cuisine_type && (
                <Badge variant="outline">{displayData.cuisine_type}</Badge>
              )}
            </div>

            {/* Description */}
            {displayData.description && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {displayData.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Contact & Location Details */}
            <div className="space-y-3">
              {displayData.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{displayData.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayData.lat.toFixed(6)}, {displayData.lon.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {displayData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${displayData.phone}`}
                    className="text-sm hover:underline"
                  >
                    {displayData.phone}
                  </a>
                </div>
              )}

              {displayData.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={displayData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Data Storage Notice */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Only place ID and location coordinates
                are stored. All other data is fetched fresh from Google Places
                when viewing this restaurant, ensuring compliance with Google's
                Terms of Service.
              </p>
            </div>

            {/* Form with hidden fields */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...form.register("place_id")} />
              <input
                type="hidden"
                {...form.register("lat", { valueAsNumber: true })}
              />
              <input
                type="hidden"
                {...form.register("lon", { valueAsNumber: true })}
              />
              <input type="hidden" {...form.register("name")} />

              <div className="flex gap-3">
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

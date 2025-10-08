"use client";

import { MapPin, Search, Star, Utensils } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SectionLoader } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRestaurants } from "../hooks/use-restaurants";
import type { RestaurantWithActivityLinks } from "../types";

interface RestaurantListSelectorProps {
  tripId: string;
  onSelect?: (restaurant: RestaurantWithActivityLinks) => void;
  onCancel?: () => void;
  selectedRestaurantId?: string;
}

export function RestaurantListSelector({
  tripId,
  onSelect,
  onCancel,
  selectedRestaurantId,
}: RestaurantListSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: restaurants, isLoading, error } = useRestaurants(tripId);

  const handleRestaurantClick = (restaurant: RestaurantWithActivityLinks) => {
    onSelect?.(restaurant);
  };

  if (isLoading) {
    return <SectionLoader title="Loading restaurants..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load restaurants</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  const filteredRestaurants = restaurants || [];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search restaurants by name, cuisine, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Restaurant list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No restaurants found matching your search"
                : "No saved restaurants yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {!searchQuery &&
                "Use Google Places to add restaurants to your trip"}
            </p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRestaurantId === restaurant.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  {restaurant.image_url ? (
                    <div className="flex-shrink-0">
                      <Image
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-20 h-20 object-cover rounded-md"
                        width={80}
                        height={80}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                      <Utensils className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base truncate">
                        {restaurant.name}
                      </h3>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {restaurant.rating.toFixed(1)}
                          </span>
                          {restaurant.review_count && (
                            <span className="text-xs text-muted-foreground">
                              ({restaurant.review_count})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cuisine and Price */}
                    <div className="flex items-center gap-2 mt-1">
                      {restaurant.cuisine_type && (
                        <Badge variant="secondary" className="text-xs">
                          {restaurant.cuisine_type}
                        </Badge>
                      )}
                      {restaurant.price_range && (
                        <Badge variant="outline" className="text-xs">
                          {restaurant.price_range}
                        </Badge>
                      )}
                    </div>

                    {/* Address */}
                    {restaurant.address && (
                      <div className="flex items-start gap-1 mt-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {restaurant.address}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}

                    {/* Activity links count */}
                    {restaurant.linked_activities_count !== undefined &&
                      restaurant.linked_activities_count > 0 && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Linked to {restaurant.linked_activities_count}{" "}
                            {restaurant.linked_activities_count === 1
                              ? "activity"
                              : "activities"}
                          </Badge>
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Actions */}
      {onCancel && (
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

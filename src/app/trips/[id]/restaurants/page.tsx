"use client";

/**
 * Restaurants page - Standalone restaurant management for a trip
 * - View all restaurants in a trip
 * - Add new restaurants via Google Places or manual entry
 * - Search and filter restaurants
 * - Link restaurants to activities
 */

import { Plus, Utensils, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RestaurantCard } from "@/features/restaurants/components/restaurant-card";
import { RestaurantCreateDialog } from "@/features/restaurants/components/restaurant-create-dialog";
import { useRestaurants } from "@/features/restaurants/hooks/use-restaurants";
import type { RestaurantSearch } from "@/features/restaurants/types";

const priceRangeOptions = [
  { value: "Any price range", label: "Any price range" },
  { value: "$", label: "$ (Budget-friendly)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Upscale)" },
  { value: "$$$$", label: "$$$$ (Fine dining)" },
];

const cuisineTypes = [
  "Italian",
  "Mexican",
  "Asian",
  "American",
  "French",
  "Mediterranean",
  "Indian",
  "Thai",
  "Japanese",
  "Chinese",
  "Greek",
  "Turkish",
  "Seafood",
  "Steakhouse",
  "Pizza",
  "Cafe",
  "Bar",
  "Fast Food",
];

export default function RestaurantsPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<RestaurantSearch>({
    trip_id: tripId,
  });

  const {
    data: restaurants = [],
    isLoading,
    error,
  } = useRestaurants(tripId, filters);

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  };

  const handleCuisineTypeChange = (cuisine_type: string) => {
    setFilters((prev) => ({
      ...prev,
      cuisine_type:
        cuisine_type && cuisine_type !== "Any cuisine"
          ? cuisine_type
          : undefined,
    }));
  };

  const handlePriceRangeChange = (price_range: string) => {
    setFilters((prev) => ({
      ...prev,
      // Select options are constrained to the price range enum values
      price_range:
        price_range && price_range !== "Any price range"
          ? (price_range as RestaurantSearch["price_range"])
          : undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({ trip_id: tripId });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.cuisine_type || filters.price_range,
  );

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Failed to load restaurants: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filters only matter once there's something to filter
  const showFilters = restaurants.length > 0 || hasActiveFilters;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Utensils className="h-6 w-6 text-teal-brand" />
            Restaurants
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            {restaurants.length === 0
              ? "Dining ideas for the trip"
              : `${restaurants.length} ${restaurants.length === 1 ? "spot" : "spots"}`}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Restaurant
        </Button>
      </div>

      {/* Inline filter toolbar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search restaurants…"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 w-full sm:max-w-xs"
          />
          <Select
            value={filters.cuisine_type || undefined}
            onValueChange={handleCuisineTypeChange}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any cuisine">Any cuisine</SelectItem>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.price_range || undefined}
            onValueChange={handlePriceRangeChange}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              {priceRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              tripId={tripId}
              showActivityLinks={true}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Utensils className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <CardTitle className="mb-2 text-foreground">
            {hasActiveFilters
              ? "No restaurants match your filters"
              : "No restaurants yet"}
          </CardTitle>
          <p className="mb-6 max-w-md text-sm text-foreground/70">
            {hasActiveFilters
              ? "Try adjusting your search or clearing the filters."
              : "Build your dining shortlist — search a place and add it, so the group knows where to eat."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          ) : (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add your first restaurant
            </Button>
          )}
        </div>
      )}

      {/* Create Restaurant Dialog */}
      <RestaurantCreateDialog
        tripId={tripId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

"use client";

/**
 * Restaurants page - Standalone restaurant management for a trip
 * - View all restaurants in a trip
 * - Add new restaurants via Google Places or manual entry
 * - Search and filter restaurants
 * - Link restaurants to activities
 */

import { Filter, Plus, Search, Utensils } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [filters, setFilters] = useState<Partial<RestaurantSearch>>({});

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
      cuisine_type: cuisine_type || undefined,
    }));
  };

  const handlePriceRangeChange = (price_range: string) => {
    setFilters((prev) => ({
      ...prev,
      price_range: (price_range as any) || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load restaurants: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Utensils className="h-8 w-8" />
            Restaurants
          </h1>
          <p className="text-gray-600 mt-2">
            Manage dining recommendations for your trip
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Restaurant
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search restaurants..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={filters.cuisine_type || undefined}
              onValueChange={handleCuisineTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cuisine type" />
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
              <SelectTrigger>
                <SelectValue placeholder="Price range" />
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

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
              <span className="text-sm text-gray-600">
                {restaurants.length} restaurant
                {restaurants.length !== 1 ? "s" : ""} found
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {hasActiveFilters
                  ? "No restaurants match your filters"
                  : "No restaurants added yet"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or clearing filters to see more results."
                  : "Start building your dining guide by adding restaurant recommendations for your trip."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Restaurant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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

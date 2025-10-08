"use client";

/**
 * ActivityRestaurantSelector - Select and link existing restaurants to an activity
 * Replaces the old inline restaurant managers for activities
 */

import { Link as LinkIcon, Plus, Search, Utensils } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useLinkRestaurantToActivity,
  useRestaurants,
  useRestaurantsByActivity,
  useUnlinkRestaurantFromActivity,
} from "../hooks/use-restaurants";
import { RestaurantCard } from "./restaurant-card";

interface ActivityRestaurantSelectorProps {
  activityId: string;
  tripId: string;
  className?: string;
}

export function ActivityRestaurantSelector({
  activityId,
  tripId,
  className,
}: ActivityRestaurantSelectorProps) {
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: linkedRestaurants = [] } = useRestaurantsByActivity(activityId);
  const { data: allRestaurants = [] } = useRestaurants(tripId);

  const linkRestaurant = useLinkRestaurantToActivity();
  const unlinkRestaurant = useUnlinkRestaurantFromActivity();

  const linkedRestaurantIds = new Set(linkedRestaurants.map((r) => r.id));
  const availableRestaurants = allRestaurants.filter(
    (restaurant) => !linkedRestaurantIds.has(restaurant.id),
  );

  const handleLinkRestaurant = async (restaurantId: string) => {
    try {
      await linkRestaurant.mutateAsync({
        activity_id: activityId,
        restaurant_id: restaurantId,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUnlinkRestaurant = async (restaurantId: string) => {
    try {
      await unlinkRestaurant.mutateAsync({
        activity_id: activityId,
        restaurant_id: restaurantId,
      });
    } catch (error) {
      // Error handled by mutation
    }
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
              {linkedRestaurants.length > 0
                ? `${linkedRestaurants.length} dining ${
                    linkedRestaurants.length === 1 ? "option" : "options"
                  } near this activity`
                : "Add dining recommendations for this activity"}
            </CardDescription>
          </div>
          <Dialog
            open={isSelectDialogOpen}
            onOpenChange={setIsSelectDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Select Restaurants</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {availableRestaurants.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Utensils className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p className="font-medium">No restaurants available</p>
                      <p className="text-sm mt-1">
                        {searchQuery
                          ? "Try adjusting your search or create a new restaurant first"
                          : "Create restaurants in the main restaurant section first"}
                      </p>
                    </div>
                  ) : (
                    availableRestaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{restaurant.name}</h4>
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
                          {restaurant.address && (
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {restaurant.address}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkRestaurant(restaurant.id)}
                          disabled={linkRestaurant.isPending}
                          className="flex items-center gap-2"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {linkedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {linkedRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="relative">
                <RestaurantCard
                  restaurant={restaurant}
                  tripId={tripId}
                  showActions={false}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkRestaurant(restaurant.id)}
                  disabled={unlinkRestaurant.isPending}
                  className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 bg-white/90 hover:bg-white"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No restaurants added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Link existing restaurants or create new ones to provide dining
              recommendations for this activity.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSelectDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Link Existing
              </Button>
              <Button
                onClick={() =>
                  window.open(`/trips/${tripId}/restaurants`, "_blank")
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

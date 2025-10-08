"use client";

/**
 * Restaurant Detail Page - View and manage a specific restaurant
 * - Display restaurant details and photos
 * - Edit restaurant information
 * - Manage activity links
 * - Delete restaurant
 */

import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
  Trash2,
  Utensils,
} from "lucide-react";
import Image from "next/image";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { ActivityLinkManager } from "@/features/restaurants/components/activity-link-manager";
import { RestaurantEditDialog } from "@/features/restaurants/components/restaurant-edit-dialog";
import {
  useDeleteRestaurant,
  useRestaurant,
} from "@/features/restaurants/hooks/use-restaurants";

const priceRangeLabels = {
  $: "Budget-friendly",
  $$: "Moderate",
  $$$: "Upscale",
  $$$$: "Fine dining",
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const restaurantId = params.restaurantId as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: restaurant, isLoading, error } = useRestaurant(restaurantId);

  const deleteRestaurant = useDeleteRestaurant();

  const handleDelete = async () => {
    try {
      await deleteRestaurant.mutateAsync(restaurantId);
      router.push(`/trips/${tripId}/restaurants`);
    } catch (error) {
      // Error is handled by the mutation
      console.error("Delete failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>
                {error
                  ? `Failed to load restaurant: ${error.message}`
                  : "Restaurant not found"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/trips/${tripId}/restaurants`)}
              >
                Back to Restaurants
              </Button>
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/trips/${tripId}/restaurants`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Restaurants
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{restaurant.name}"? This will
                  also remove all links to activities. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteRestaurant.isPending}
                >
                  {deleteRestaurant.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Restaurant Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Utensils className="h-6 w-6" />
                    {restaurant.name}
                  </CardTitle>
                  {restaurant.cuisine_type && (
                    <CardDescription className="text-lg mt-1">
                      {restaurant.cuisine_type}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {restaurant.price_range && (
                    <Badge variant="secondary" className="text-sm">
                      {restaurant.price_range} •{" "}
                      {priceRangeLabels[restaurant.price_range]}
                    </Badge>
                  )}
                  {restaurant.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {restaurant.rating.toFixed(1)}
                      </span>
                      {restaurant.review_count && (
                        <span className="text-gray-600 text-sm">
                          ({restaurant.review_count} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {restaurant.image_url && (
                <div className="mb-6">
                  <Image
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    width={600}
                    height={300}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {restaurant.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {restaurant.description}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {restaurant.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{restaurant.address}</span>
                  </div>
                )}

                {restaurant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {restaurant.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {restaurant.lat && restaurant.lon && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <a
                      href={`https://maps.google.com/?q=${restaurant.lat},${restaurant.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Links */}
          <ActivityLinkManager restaurantId={restaurantId} tripId={tripId} />

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Added</p>
                <p className="text-sm text-gray-600">
                  {new Date(restaurant.created_at).toLocaleDateString()}
                </p>
              </div>

              {restaurant.place_id && (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Google Places
                  </p>
                  <p className="text-sm text-gray-600">
                    Imported from Google Places
                  </p>
                </div>
              )}

              {restaurant.location_updated_at &&
                restaurant.lat &&
                restaurant.lon && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Location Data
                    </p>
                    <p className="text-sm text-gray-600">
                      Updated{" "}
                      {new Date(
                        restaurant.location_updated_at,
                      ).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-amber-600">
                        Location data expires after 30 days per Google's
                        requirements
                      </span>
                    </p>
                  </div>
                )}

              <div>
                <p className="text-sm font-medium text-gray-900">Activities</p>
                <p className="text-sm text-gray-600">
                  Linked to {restaurant.linked_activities_count || 0} activit
                  {restaurant.linked_activities_count === 1 ? "y" : "ies"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <RestaurantEditDialog
        restaurant={restaurant}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}

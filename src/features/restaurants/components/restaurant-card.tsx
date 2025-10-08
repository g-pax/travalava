"use client";

import {
  Edit,
  ExternalLink,
  Globe,
  LinkIcon,
  MapPin,
  Phone,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
import { useDeleteRestaurant } from "../hooks/use-restaurants";
import type { RestaurantWithActivityLinks } from "../types";
import { RestaurantEditDialog } from "./restaurant-edit-dialog";

interface RestaurantCardProps {
  restaurant: RestaurantWithActivityLinks;
  tripId: string;
  showActivityLinks?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const priceRangeLabels = {
  $: "Budget",
  $$: "Moderate",
  $$$: "Upscale",
  $$$$: "Fine dining",
};

export function RestaurantCard({
  restaurant,
  tripId,
  showActivityLinks = false,
  onEdit,
  onDelete,
  showActions = true,
}: RestaurantCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteRestaurant = useDeleteRestaurant();

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRestaurant.mutateAsync(restaurant.id);
      onDelete?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                <Link
                  href={`/trips/${tripId}/restaurants/${restaurant.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {restaurant.name}
                </Link>
              </CardTitle>
              {restaurant.cuisine_type && (
                <CardDescription className="mt-1">
                  {restaurant.cuisine_type}
                </CardDescription>
              )}
            </div>
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{restaurant.name}"?
                        This will also remove all links to activities. This
                        action cannot be undone.
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
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            {restaurant.price_range && (
              <Badge variant="secondary" className="text-xs">
                {restaurant.price_range}
              </Badge>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">
                  {restaurant.rating.toFixed(1)}
                </span>
                {restaurant.review_count && (
                  <span className="text-xs text-gray-600">
                    ({restaurant.review_count})
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {restaurant.image_url && (
            <div className="mb-4">
              <Image
                src={restaurant.image_url}
                alt={restaurant.name}
                width={300}
                height={150}
                className="w-full h-32 object-cover rounded-md"
              />
            </div>
          )}

          {restaurant.description && (
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          <div className="space-y-2">
            {restaurant.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{restaurant.address}</span>
              </div>
            )}

            {restaurant.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-gray-600" />
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}

            {restaurant.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3 w-3 text-gray-600" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Website
                  <ExternalLink className="h-2 w-2" />
                </a>
              </div>
            )}

            {showActivityLinks &&
              restaurant.linked_activities_count !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <LinkIcon className="h-3 w-3" />
                  <span>
                    Linked to {restaurant.linked_activities_count} activit
                    {restaurant.linked_activities_count === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <RestaurantEditDialog
        restaurant={restaurant}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}

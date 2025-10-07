"use client";

import {
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type RestaurantInput } from "@/schemas";

interface RestaurantCardProps {
  restaurant: RestaurantInput;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function RestaurantCard({
  restaurant,
  onEdit,
  onDelete,
  showActions = true,
}: RestaurantCardProps) {
  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">
          {rating.toFixed(1)}
          {restaurant.review_count && ` (${restaurant.review_count})`}
        </span>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="truncate">{restaurant.name}</span>
            </CardTitle>
            {restaurant.cuisine_type && (
              <CardDescription className="mt-1">
                {restaurant.cuisine_type} cuisine
              </CardDescription>
            )}
          </div>

          {showActions && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          {/* Image */}
          {restaurant.image_url && (
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <Image
                src={restaurant.image_url}
                alt={restaurant.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Description */}
          {restaurant.description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {restaurant.description}
            </p>
          )}

          {/* Rating and Price */}
          <div className="flex items-center justify-between">
            {renderStars(restaurant.rating)}
            {restaurant.price_range && (
              <Badge variant="secondary" className="text-xs">
                {restaurant.price_range}
              </Badge>
            )}
          </div>

          {/* Address */}
          {restaurant.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{restaurant.address}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-2">
            {restaurant.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-gray-500" />
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}

            {restaurant.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3 w-3 text-gray-500" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  Visit Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
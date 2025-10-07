"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
} from "lucide-react";
import Link from "next/link";
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
import { useCommittedBlocks } from "@/features/voting/hooks/use-block-commit";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { ConfirmedItineraryMap } from "./confirmed-itinerary-map";

interface ConfirmedBlocksViewProps {
  tripId: string;
}

export function ConfirmedBlocksView({ tripId }: ConfirmedBlocksViewProps) {
  const { data: confirmedBlocks = [], isLoading } = useCommittedBlocks(tripId);
  const [showMap, setShowMap] = useState(true);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Final Itinerary</CardTitle>
          <CardDescription>Your confirmed activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (confirmedBlocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Final Itinerary</CardTitle>
          <CardDescription>Your confirmed activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 mb-2">No activities confirmed yet</p>
            <p className="text-sm text-gray-400">
              Activities will appear here once organizers commit them to time
              blocks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group blocks by day
  const blocksByDay = confirmedBlocks.reduce(
    (acc, block) => {
      const day = block.dayDate;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(block);
      return acc;
    },
    {} as Record<string, typeof confirmedBlocks>,
  );

  // Sort days chronologically
  const sortedDays = Object.keys(blocksByDay).sort();

  // Get activities with valid coordinates for the map
  const activitiesWithCoords = confirmedBlocks
    .filter((block) => {
      const location = (block.activity as any)?.location;
      console.log("🚀 ~ ConfirmedBlocksView ~ block.activity:", block.activity);
      // Support multiple coordinate formats
      if (
        location?.coordinates &&
        Array.isArray(location.coordinates) &&
        location.coordinates.length === 2 &&
        typeof location.coordinates[0] === "number" &&
        typeof location.coordinates[1] === "number"
      ) {
        return true;
      }
      // Support lat/lng format
      if (
        location?.lat &&
        location?.lng &&
        typeof location.lat === "number" &&
        typeof location.lng === "number"
      ) {
        return true;
      }
      // Support lon/lat format
      if (
        location?.lon &&
        location?.lat &&
        typeof location.lon === "number" &&
        typeof location.lat === "number"
      ) {
        return true;
      }
      return false;
    })
    .map((block) => {
      const location = (block.activity as any)?.location;
      let coordinates: [number, number];

      if (location.coordinates && Array.isArray(location.coordinates)) {
        coordinates = location.coordinates;
      } else if (location.lng && location.lat) {
        coordinates = [location.lng, location.lat];
      } else if (location.lon && location.lat) {
        coordinates = [location.lon, location.lat];
      } else {
        coordinates = [0, 0];
      }

      return {
        id: block.activity.id,
        title: block.activity.title,
        location: {
          name: location.name || "Unknown Location",
          coordinates,
        },
        dayDate: block.dayDate,
        blockLabel: block.label,
      };
    });

  return (
    <div className="space-y-6">
      {/* Header with Map Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Final Itinerary</h2>
          <p className="text-sm text-muted-foreground">
            {confirmedBlocks.length} confirmed activit
            {confirmedBlocks.length !== 1 ? "ies" : "y"}
            across {sortedDays.length} day{sortedDays.length !== 1 ? "s" : ""}
          </p>
        </div>
        {activitiesWithCoords.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        )}
      </div>

      {/* Map Section */}
      {showMap && activitiesWithCoords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Activity Locations
            </CardTitle>
            <CardDescription>
              {activitiesWithCoords.length} activit
              {activitiesWithCoords.length !== 1 ? "ies" : "y"} with location
              data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmedItineraryMap
              activities={activitiesWithCoords}
              className="h-[400px] w-full rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Timeline of Confirmed Activities */}
      <div className="space-y-8">
        {sortedDays.map((day) => {
          const dayBlocks = blocksByDay[day];
          const dayLabel = new Date(day).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {dayLabel}
                </CardTitle>
                <CardDescription>
                  {dayBlocks.length} confirmed activit
                  {dayBlocks.length !== 1 ? "ies" : "y"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                    >
                      {/* Block Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {block.label}
                          </Badge>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {block.activity.title}
                          </h4>
                        </div>
                        <Link
                          href={`/trips/${tripId}/activities/${block.activity.id}`}
                        >
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>

                      {/* Activity Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {block.activity.category && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {block.activity.category}
                            </Badge>
                          </div>
                        )}

                        {block.activity.cost_amount !== null &&
                          block.activity.cost_amount !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(
                                block.activity.cost_amount,
                                block.activity.cost_currency || "USD",
                              )}
                            </div>
                          )}

                        {block.activity.duration_min && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            {formatDuration(block.activity.duration_min)}
                          </div>
                        )}

                        {(block.activity as any)?.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 sm:col-span-3">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {(block.activity as any).location.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

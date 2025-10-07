"use client";

import {
  APIProvider,
  Map as GoogleMap,
  InfoWindow,
  Marker,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_MAP_CONFIG,
  GOOGLE_MAPS_API_KEY,
  validateGoogleMapsKey,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";

interface ActivityLocation {
  id: string;
  title: string;
  location: {
    name: string;
    coordinates: [number, number]; // [lng, lat] format
  };
  dayDate: string;
  blockLabel: string;
}

interface ConfirmedItineraryMapProps {
  activities: ActivityLocation[];
  className?: string;
}

export function ConfirmedItineraryMap({
  activities,
  className,
}: ConfirmedItineraryMapProps) {
  console.log("🚀 ~ activities:", activities);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Calculate map center and zoom from activities
  const calculateMapBounds = () => {
    if (!validateGoogleMapsKey() || activities.length === 0) {
      return {
        center: { lat: 27.957990872954593, lng: -15.761245368059482 },
        zoom: 12,
      };
    }

    // Filter valid coordinates
    const validCoordinates = activities.filter((activity) => {
      const coords = activity.location.coordinates;
      return (
        Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[1] === "number" &&
        typeof coords[0] === "number" &&
        !Number.isNaN(coords[1]) &&
        !Number.isNaN(coords[0])
      );
    });

    if (validCoordinates.length === 0) {
      return {
        center: { lat: 27.957990872954593, lng: -15.761245368059482 },
        zoom: 12,
      };
    }

    if (validCoordinates.length === 1) {
      // Single activity - center on it
      const coords = validCoordinates[0].location.coordinates;
      return {
        center: { lat: coords[1], lng: coords[0] },
        zoom: 15,
      };
    }

    // Multiple activities - calculate center and appropriate zoom
    let minLat = validCoordinates[0].location.coordinates[1];
    let maxLat = validCoordinates[0].location.coordinates[1];
    let minLng = validCoordinates[0].location.coordinates[0];
    let maxLng = validCoordinates[0].location.coordinates[0];

    validCoordinates.forEach((activity) => {
      const [lng, lat] = activity.location.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate appropriate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    // More conservative zoom levels to ensure all pins are visible
    let zoom = 13;
    if (maxDiff > 1)
      zoom = 6; // Very far apart (different cities/countries)
    else if (maxDiff > 0.5)
      zoom = 8; // Far apart
    else if (maxDiff > 0.2)
      zoom = 10; // Moderately apart
    else if (maxDiff > 0.1)
      zoom = 11; // Closer together
    else if (maxDiff > 0.05)
      zoom = 12; // Close together
    else if (maxDiff > 0.01) zoom = 13; // Very close

    return {
      center: { lat: centerLat, lng: centerLng },
      zoom,
    };
  };

  const mapBounds = calculateMapBounds();

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gray-100 flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">
            Google Maps API key not configured
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to environment variables
          </p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gray-100 flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">
            No activities with locations to display
          </p>
        </div>
      </div>
    );
  }

  // Create day-based color mapping for markers
  const uniqueDays = [...new Set(activities.map((a) => a.dayDate))].sort();
  const dayColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  const getDayColor = (dayDate: string) => {
    const dayIndex = uniqueDays.indexOf(dayDate);
    return dayColors[dayIndex % dayColors.length];
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        key={`map-${activities.length}-${JSON.stringify(mapBounds.center)}`}
        mapId={DEFAULT_MAP_CONFIG.mapId}
        defaultCenter={mapBounds.center}
        defaultZoom={mapBounds.zoom}
        className={cn("rounded-lg overflow-hidden", className)}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        clickableIcons={true}
        scrollwheel={true}
        mapTypeId="roadmap"
      >
        {activities.map((activity, index) => {
          const coords = activity.location.coordinates;

          console.log(`Activity ${index}:`, {
            id: activity.id,
            title: activity.title,
            coords,
            isArray: Array.isArray(coords),
            length: coords?.length,
            lat: coords?.[1],
            lng: coords?.[0],
          });

          if (
            !Array.isArray(coords) ||
            coords.length !== 2 ||
            typeof coords[1] !== "number" ||
            typeof coords[0] !== "number" ||
            Number.isNaN(coords[1]) ||
            Number.isNaN(coords[0])
          ) {
            console.log(
              `❌ Activity ${activity.title} filtered out - invalid coords`,
            );
            return null;
          }

          const position = { lat: coords[1], lng: coords[0] };
          const dayColor = getDayColor(activity.dayDate);

          console.log(`✅ Rendering marker for ${activity.title} at`, position);

          return (
            <div key={activity.id}>
              <Marker
                position={position}
                title={activity.title}
                onClick={() => {
                  setSelectedMarker(
                    selectedMarker === activity.id ? null : activity.id,
                  );
                }}
              />
              {selectedMarker === activity.id && (
                <InfoWindow
                  position={position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h4 className="font-semibold text-sm mb-1">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">
                      {activity.location.name}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {new Date(activity.dayDate).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                      <span
                        className="px-2 py-1 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: dayColor }}
                      >
                        {activity.blockLabel}
                      </span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </div>
          );
        })}
      </GoogleMap>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {uniqueDays.map((day) => {
          const dayLabel = new Date(day).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const color = getDayColor(day);
          const activitiesCount = activities.filter(
            (a) => a.dayDate === day,
          ).length;

          return (
            <div key={day} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">
                {dayLabel} ({activitiesCount})
              </span>
            </div>
          );
        })}
      </div>
    </APIProvider>
  );
}

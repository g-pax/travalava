"use client";

import {
  APIProvider,
  Map as GoogleMap,
  Marker,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_MAP_CONFIG,
  extractCoordinatesFromGoogleMapsUrl,
  GOOGLE_MAPS_API_KEY,
  validateGoogleMapsKey,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import type { Activity } from "../hooks/use-activities";

interface ActivityGoogleMapProps {
  activity: Activity;
  className?: string;
}

export function ActivityGoogleMap({
  activity,
  className,
}: ActivityGoogleMapProps) {
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!validateGoogleMapsKey()) {
      return;
    }

    if (activity.location?.lat && activity.location?.lon) {
      setCoordinates({
        lat: activity.location.lat,
        lng: activity.location.lon,
      });
    } else if (activity.link) {
      const extracted = extractCoordinatesFromGoogleMapsUrl(activity.link);
      if (extracted) {
        setCoordinates(extracted);
      }
    }
  }, [activity.location, activity.link]);

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

  if (!coordinates) {
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
            Location coordinates not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapId={DEFAULT_MAP_CONFIG.mapId}
        defaultCenter={coordinates}
        defaultZoom={DEFAULT_MAP_CONFIG.zoom}
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
        <Marker position={coordinates} title={activity.title} />
      </GoogleMap>
    </APIProvider>
  );
}

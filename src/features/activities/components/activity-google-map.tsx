"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { ExternalLink, MapPin, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  type: "activity" | "restaurant";
  description?: string;
  address?: string;
}

function MapMarker({ marker }: { marker: MarkerData }) {
  const [markerRef, markerInstance] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  const handleMarkerClick = useCallback(() => {
    setInfoWindowOpen(true);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowOpen(false);
  }, []);

  const handleViewInMaps = useCallback(() => {
    const url = `https://www.google.com/maps/search/?api=1&query=${marker.position.lat},${marker.position.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [marker.position]);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={marker.position}
        title={marker.title}
        onClick={handleMarkerClick}
      >
        <Pin
          background={marker.type === "activity" ? "#3b82f6" : "#ef4444"}
          borderColor={marker.type === "activity" ? "#1e40af" : "#991b1b"}
          glyphColor="#ffffff"
        >
          {marker.type === "restaurant" ? (
            <UtensilsCrossed className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Pin>
      </AdvancedMarker>

      {infoWindowOpen && markerInstance && (
        <InfoWindow
          anchor={markerInstance}
          onClose={handleInfoWindowClose}
          maxWidth={250}
        >
          <div className="p-2">
            <h3 className="font-semibold text-sm mb-1">{marker.title}</h3>
            {marker.description && (
              <p className="text-xs text-gray-600 mb-1">{marker.description}</p>
            )}
            {marker.address && (
              <p className="text-xs text-gray-500 mb-2">{marker.address}</p>
            )}
            <button
              type="button"
              onClick={handleViewInMaps}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View in Google Maps
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
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

  const markers = useMemo<MarkerData[]>(() => {
    const result: MarkerData[] = [];

    // Add activity location marker
    if (coordinates) {
      result.push({
        id: `activity-${activity.id}`,
        position: coordinates,
        title: activity.title,
        type: "activity",
        description: activity.category || undefined,
      });
    }

    // Add restaurant markers
    if (activity.restaurants) {
      for (const restaurant of activity.restaurants) {
        if (restaurant.location?.lat && restaurant.location?.lon) {
          result.push({
            id: `restaurant-${restaurant.id || restaurant.name}`,
            position: {
              lat: restaurant.location.lat,
              lng: restaurant.location.lon,
            },
            title: restaurant.name,
            type: "restaurant",
            description: restaurant.cuisine_type,
            address: restaurant.address,
          });
        }
      }
    }

    return result;
  }, [coordinates, activity]);

  const mapCenter = useMemo(() => {
    if (markers.length === 0) {
      return DEFAULT_MAP_CONFIG.center;
    }

    // Calculate center of all markers
    const bounds = {
      north: Math.max(...markers.map((m) => m.position.lat)),
      south: Math.min(...markers.map((m) => m.position.lat)),
      east: Math.max(...markers.map((m) => m.position.lng)),
      west: Math.min(...markers.map((m) => m.position.lng)),
    };

    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    };
  }, [markers]);

  const mapZoom = useMemo(() => {
    if (markers.length <= 1) {
      return DEFAULT_MAP_CONFIG.zoom;
    }

    // If multiple markers, zoom out to show them all
    const bounds = {
      north: Math.max(...markers.map((m) => m.position.lat)),
      south: Math.min(...markers.map((m) => m.position.lat)),
      east: Math.max(...markers.map((m) => m.position.lng)),
      west: Math.min(...markers.map((m) => m.position.lng)),
    };

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Rough zoom calculation based on difference
    if (maxDiff > 0.1) return 11;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.02) return 13;
    if (maxDiff > 0.01) return 14;
    return 15;
  }, [markers]);

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

  if (markers.length === 0) {
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
    <div className="relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapId={DEFAULT_MAP_CONFIG.mapId}
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
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
          {markers.map((marker) => (
            <MapMarker key={marker.id} marker={marker} />
          ))}
        </GoogleMap>
      </APIProvider>

      {/* Legend */}
      {markers.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Restaurant</span>
          </div>
        </div>
      )}
    </div>
  );
}

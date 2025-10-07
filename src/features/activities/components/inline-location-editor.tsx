"use client";

import {
  APIProvider,
  Map as GoogleMap,
  type MapMouseEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import { Edit, MapPin, Navigation, Save, Target, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_MAP_CONFIG,
  GOOGLE_MAPS_API_KEY,
  validateGoogleMapsKey,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import type { Activity } from "../hooks/use-activities";

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

interface InlineLocationEditorProps {
  activity: Activity;
  onLocationUpdate: (location: LocationData | null) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

export function InlineLocationEditor({
  activity,
  onLocationUpdate,
  isUpdating = false,
  className,
}: InlineLocationEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [locationName, setLocationName] = useState(
    activity.location?.name || "",
  );
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(
    activity.location?.lat && activity.location?.lon
      ? { lat: activity.location.lat, lng: activity.location.lon }
      : null,
  );
  const [tempCoordinates, setTempCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(coordinates);
  const [manualLat, setManualLat] = useState(
    coordinates?.lat?.toString() || "",
  );
  const [manualLng, setManualLng] = useState(
    coordinates?.lng?.toString() || "",
  );

  const hasLocation = activity.location?.lat && activity.location?.lon;

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (isEditing && event.detail.latLng) {
        const lat = event.detail.latLng.lat;
        const lng = event.detail.latLng.lng;
        setTempCoordinates({ lat, lng });
        setManualLat(lat.toString());
        setManualLng(lng.toString());
      }
    },
    [isEditing],
  );

  const handleManualCoordinateChange = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      setTempCoordinates({ lat, lng });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: safe here
  useEffect(() => {
    handleManualCoordinateChange();
  }, [manualLat, manualLng]);

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setTempCoordinates({ lat, lng });
          setManualLat(lat.toString());
          setManualLng(lng.toString());
          toast.success("Current location detected");
        },
        (error) => {
          toast.error("Unable to detect current location");
          console.error("Geolocation error:", error);
        },
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const handleSave = async () => {
    if (!tempCoordinates) {
      await onLocationUpdate(null);
    } else {
      await onLocationUpdate({
        name: locationName.trim() || "Selected Location",
        lat: tempCoordinates.lat,
        lon: tempCoordinates.lng,
      });
    }
    setCoordinates(tempCoordinates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempCoordinates(coordinates);
    setLocationName(activity.location?.name || "");
    setManualLat(coordinates?.lat?.toString() || "");
    setManualLng(coordinates?.lng?.toString() || "");
    setIsEditing(false);
  };

  if (!validateGoogleMapsKey()) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              Google Maps API key not configured
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mapCenter = tempCoordinates || coordinates || DEFAULT_MAP_CONFIG.center;
  const mapZoom = tempCoordinates || coordinates ? 13 : DEFAULT_MAP_CONFIG.zoom;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>
              {hasLocation
                ? isEditing
                  ? "Click on the map or enter coordinates manually"
                  : activity.location?.name || "Activity location"
                : "No location set - add one to help others find this activity"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isUpdating}
              >
                <Edit className="h-4 w-4" />
                {hasLocation ? "Edit" : "Add"} Location
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Name Input (shown when editing) */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              placeholder="e.g., Eiffel Tower, Restaurant Le Comptoir"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>
        )}

        {/* Manual Coordinates Input (shown when editing) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual-lat">Latitude</Label>
              <Input
                id="manual-lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="48.8584"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-lng">Longitude</Label>
              <Input
                id="manual-lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="2.2945"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Location Actions (shown when editing) */}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              className="gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use Current Location
            </Button>
            {tempCoordinates && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempCoordinates(null);
                  setManualLat("");
                  setManualLng("");
                }}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Clear Location
              </Button>
            )}
          </div>
        )}

        {/* Map */}
        <div className="relative">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap
              mapId={DEFAULT_MAP_CONFIG.mapId}
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              className={cn(
                "h-[300px] w-full rounded-lg overflow-hidden",
                isEditing && "cursor-crosshair",
              )}
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              clickableIcons={isEditing}
              scrollwheel={true}
              mapTypeId="roadmap"
              onClick={isEditing ? handleMapClick : undefined}
            >
              {(tempCoordinates || coordinates) && (
                <Marker
                  position={tempCoordinates || coordinates}
                  title={locationName || activity.title}
                />
              )}
            </GoogleMap>
          </APIProvider>

          {isEditing && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
              Click on the map to set location
            </div>
          )}
        </div>

        {/* Current Location Display (when not editing and has location) */}
        {!isEditing && hasLocation && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Name:</strong> {activity.location?.name}
            </p>
            <p>
              <strong>Coordinates:</strong> {activity.location?.lat?.toFixed(6)}
              , {activity.location?.lon?.toFixed(6)}
            </p>
          </div>
        )}

        {/* No Location State (when not editing and no location) */}
        {!isEditing && !hasLocation && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location specified for this activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

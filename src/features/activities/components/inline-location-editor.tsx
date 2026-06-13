"use client";

import {
  Edit,
  ExternalLink,
  MapPin,
  Navigation,
  Save,
  Target,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LeafletMap, type MapMarker } from "@/components/common/leaflet-map";
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
import type { RestaurantWithActivityLinks } from "@/features/restaurants";
import { DEFAULT_MAP_CENTER, osmViewUrl } from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import type { Activity } from "../hooks/use-activities";

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

interface InlineLocationEditorProps {
  activity: Activity;
  restaurants: RestaurantWithActivityLinks[];
  onLocationUpdate: (location: LocationData | null) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

const ACTIVITY_COLOR = "oklch(0.55 0.15 35)"; // coral
const RESTAURANT_COLOR = "oklch(0.55 0.095 180)"; // teal

export function InlineLocationEditor({
  activity,
  restaurants,
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

  const hasLocation = !!(activity.location?.lat && activity.location?.lon);

  // Markers shown when viewing: the activity plus any linked restaurants.
  const viewMarkers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    if (coordinates) {
      result.push({
        id: `activity-${activity.id}`,
        lat: coordinates.lat,
        lng: coordinates.lng,
        title: activity.title,
        color: ACTIVITY_COLOR,
        popup: (
          <div>
            <p className="text-sm font-semibold">{activity.title}</p>
            {activity.category && (
              <p className="text-xs text-foreground/70">{activity.category}</p>
            )}
          </div>
        ),
      });
    }
    for (const r of restaurants || []) {
      if (r.lat && r.lon) {
        result.push({
          id: `restaurant-${r.id || r.name}`,
          lat: r.lat,
          lng: r.lon,
          title: r.name,
          color: RESTAURANT_COLOR,
          popup: <p className="text-sm font-semibold">{r.name}</p>,
        });
      }
    }
    return result;
  }, [coordinates, activity, restaurants]);

  const editMarker = useMemo<MapMarker[]>(() => {
    const c = tempCoordinates || coordinates;
    return c
      ? [
          {
            id: "pick",
            lat: c.lat,
            lng: c.lng,
            title: locationName || activity.title,
            color: ACTIVITY_COLOR,
          },
        ]
      : [];
  }, [tempCoordinates, coordinates, locationName, activity.title]);

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setTempCoordinates({ lat, lng });
    setManualLat(lat.toString());
    setManualLng(lng.toString());
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: derive temp coords from manual inputs
  useEffect(() => {
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
        () => toast.error("Unable to detect current location"),
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

  const mapCenter = isEditing
    ? tempCoordinates || coordinates || DEFAULT_MAP_CENTER
    : viewMarkers[0]
      ? { lat: viewMarkers[0].lat, lng: viewMarkers[0].lng }
      : DEFAULT_MAP_CENTER;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-brand" />
              Location
            </CardTitle>
            <CardDescription>
              {hasLocation
                ? isEditing
                  ? "Click on the map or enter coordinates manually"
                  : activity.location?.name || "Activity location"
                : "No location set — add one to help everyone find it"}
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
                className="gap-1.5"
              >
                <Edit className="h-4 w-4" />
                {hasLocation ? "Edit" : "Add"} location
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="location-name">Location name</Label>
              <Input
                id="location-name"
                placeholder="e.g., Time Out Market, Belém Tower"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-lat">Latitude</Label>
                <Input
                  id="manual-lat"
                  type="number"
                  step="any"
                  placeholder="38.7223"
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
                  placeholder="-9.1393"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Use current location
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
                  Clear
                </Button>
              )}
            </div>
          </>
        )}

        <div className="relative">
          <LeafletMap
            markers={isEditing ? editMarker : viewMarkers}
            center={mapCenter}
            onMapClick={isEditing ? handleMapPick : undefined}
            fitToMarkers={!isEditing}
          />
          {isEditing && (
            <div className="absolute left-2 top-2 z-[1000] rounded bg-foreground/80 px-2 py-1 text-xs text-background">
              Click the map to set the location
            </div>
          )}
        </div>

        {!isEditing && hasLocation && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/70">
              {activity.location?.lat?.toFixed(5)},{" "}
              {activity.location?.lon?.toFixed(5)}
            </span>
            <a
              href={osmViewUrl(
                activity.location?.lat as number,
                activity.location?.lon as number,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-deep transition-colors duration-150 hover:text-primary-deep/80"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on OpenStreetMap
            </a>
          </div>
        )}

        {!isEditing && !hasLocation && (
          <div className="py-6 text-center text-muted-foreground">
            <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No location specified for this activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

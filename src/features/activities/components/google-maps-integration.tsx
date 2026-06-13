"use client";

/**
 * Location actions for an activity: view it on an OpenStreetMap (Leaflet) map
 * in a dialog, and open free OSM "view"/"directions" web links. No map API key
 * or billing required.
 */
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { LeafletMap } from "@/components/common/leaflet-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getDirectionsUrl, osmViewUrl } from "@/lib/google-maps";

interface MapsIntegrationProps {
  location?: {
    name: string;
    lat: number;
    lon: number;
  };
  googleMapsLink?: string;
  activityTitle: string;
}

function hasCoords(loc?: { lat: number; lon: number }): boolean {
  return !!loc && loc.lat !== 0 && loc.lon !== 0;
}

export function GoogleMapsIntegration({
  location,
  googleMapsLink,
  activityTitle,
}: MapsIntegrationProps) {
  const coords = hasCoords(location);
  const directionsUrl = coords
    ? getDirectionsUrl(location?.lat ?? 0, location?.lon ?? 0)
    : googleMapsLink || null;

  if (!coords && !googleMapsLink) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {directionsUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 min-w-0"
          >
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              <span className="truncate">Directions</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}

        {coords && location && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 min-w-0">
                <MapPin className="mr-2 h-4 w-4" />
                <span className="truncate">View map</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-brand" />
                  {activityTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {location.name && (
                  <p className="flex items-center gap-2 text-sm text-foreground/70">
                    <MapPin className="h-4 w-4 text-teal-brand" />
                    {location.name}
                  </p>
                )}
                <LeafletMap
                  className="h-96"
                  markers={[
                    {
                      id: "loc",
                      lat: location.lat,
                      lng: location.lon,
                      title: location.name || activityTitle,
                      color: "oklch(0.55 0.15 35)",
                    },
                  ]}
                />
                <div className="flex justify-center gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={osmViewUrl(location.lat, location.lon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open on OpenStreetMap
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {location?.name && (
        <div className="flex items-start gap-2 text-sm text-foreground/70">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-brand" />
          <span className="break-words">{location.name}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact link version for activity cards.
 */
export function CompactGoogleMapsIntegration({
  location,
  googleMapsLink,
}: MapsIntegrationProps) {
  const coords = hasCoords(location);
  const url = coords
    ? osmViewUrl(location?.lat ?? 0, location?.lon ?? 0)
    : googleMapsLink || null;

  if (!coords && !googleMapsLink) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary-deep transition-colors hover:text-primary-deep/80"
        >
          <MapPin className="h-4 w-4" />
          <span className="truncate">{location?.name || "View location"}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <div className="inline-flex items-center gap-1 text-foreground/70">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{location?.name || "Location"}</span>
        </div>
      )}
    </div>
  );
}

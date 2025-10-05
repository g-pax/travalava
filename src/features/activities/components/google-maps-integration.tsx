"use client";

/**
 * GoogleMapsIntegration provides map functionality for activities
 * - Displays activity location on Google Maps embed
 * - Handles Google Maps links for activities
 * - Provides directions and location details
 */
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GoogleMapsIntegrationProps {
  location?: {
    name: string;
    lat: number;
    lon: number;
  };
  googleMapsLink?: string;
  activityTitle: string;
}

/**
 * Extract coordinates and place information from Google Maps URLs
 */
function parseGoogleMapsUrl(url: string) {
  try {
    const urlObj = new URL(url);

    // Handle various Google Maps URL formats
    if (
      urlObj.hostname.includes("maps.google") ||
      urlObj.hostname.includes("goo.gl")
    ) {
      // Try to extract coordinates from the URL
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
          isValid: true,
        };
      }

      // Try to extract place ID or search query
      const searchMatch = url.match(/\/search\/([^\/\?]+)/);
      const placeMatch = url.match(/place\/([^\/\?]+)/);

      if (searchMatch || placeMatch) {
        return {
          query: decodeURIComponent(searchMatch?.[1] || placeMatch?.[1] || ""),
          isValid: true,
        };
      }
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

/**
 * Generate Google Maps embed URL
 */
function getEmbedUrl(
  location?: { lat: number; lon: number; name: string },
  googleMapsLink?: string,
) {
  if (googleMapsLink) {
    const parsed = parseGoogleMapsUrl(googleMapsLink);
    if (parsed.isValid) {
      if (parsed.lat && parsed.lng) {
        return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${parsed.lat},${parsed.lng}&zoom=15`;
      }
      if (parsed.query) {
        return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(parsed.query)}`;
      }
    }
  }

  if (location && location.lat !== 0 && location.lon !== 0) {
    return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${location.lat},${location.lon}&zoom=15&q=${encodeURIComponent(location.name)}`;
  }

  return null;
}

/**
 * Generate directions URL
 */
function getDirectionsUrl(
  location?: { lat: number; lon: number; name: string },
  googleMapsLink?: string,
) {
  if (googleMapsLink) {
    return googleMapsLink;
  }

  if (location && location.lat !== 0 && location.lon !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
  }

  if (location?.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`;
  }

  return null;
}

export function GoogleMapsIntegration({
  location,
  googleMapsLink,
  activityTitle,
}: GoogleMapsIntegrationProps) {
  const embedUrl = getEmbedUrl(location, googleMapsLink);
  const directionsUrl = getDirectionsUrl(location, googleMapsLink);

  // Don't render if no location data
  if (!location && !googleMapsLink) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
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
              <span className="truncate">Get Directions</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}

        {embedUrl && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 min-w-0">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="truncate">View Map</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {activityTitle} - Location
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {location?.name && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location.name}
                  </p>
                )}
                <div className="w-full h-96 rounded-lg overflow-hidden border">
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map for ${activityTitle}`}
                  />
                </div>
                {directionsUrl && (
                  <div className="flex justify-center">
                    <Button asChild>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Open in Google Maps
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Location Info */}
      {location?.name && (
        <div className="text-sm text-gray-600 flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="break-words">{location.name}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for use in activity cards
 */
export function CompactGoogleMapsIntegration({
  location,
  googleMapsLink,
  activityTitle,
}: GoogleMapsIntegrationProps) {
  const directionsUrl = getDirectionsUrl(location, googleMapsLink);

  if (!location && !googleMapsLink) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {directionsUrl ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          <span className="truncate">{location?.name || "View Location"}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <div className="inline-flex items-center gap-1 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{location?.name || "Location"}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Google Maps configuration and utilities
 */

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  center: { lat: 40.7128, lng: -74.006 }, // New York City default
  zoom: 13,
  mapId: "travalava-map", // You'll need to create this in Google Cloud Console
} as const;

// Map styling options
export const MAP_OPTIONS = {
  disableDefaultUI: false,
  clickableIcons: true,
  scrollwheel: true,
  disableDoubleClickZoom: false,
  fullscreenControl: true,
  mapTypeControl: true,
  streetViewControl: true,
  zoomControl: true,
} as const;

// Custom marker icon configuration
export const MARKER_CONFIG = {
  default: {
    fillColor: "#3b82f6",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1,
  },
  selected: {
    fillColor: "#ef4444",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    scale: 1.2,
  },
} as const;

/**
 * Validates if Google Maps API key is available
 */
export function validateGoogleMapsKey(): boolean {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn(
      "Google Maps API key not found. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.",
    );
    return false;
  }
  return true;
}

/**
 * Extracts coordinates from Google Maps URL
 */
export function extractCoordinatesFromGoogleMapsUrl(
  url: string,
): { lat: number; lng: number } | null {
  try {
    // Handle various Google Maps URL formats
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          return { lat, lng };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting coordinates from URL:", error);
    return null;
  }
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Extracts latitude and longitude from a Google Maps URL or iframe embed code
 * Supports multiple Google Maps URL formats:
 * - Pattern A: "!2d{lng}!3d{lat}" (embed URLs)
 * - Pattern B: "@lat,lng,zoom" (maps URLs)
 * - Pattern C: query "q=lat,lng" or "q=place+name@lat,lng"
 */
export function extractLatLngFromGoogleMapsSrc(
  input: string,
): { lat: number; lng: number } | null {
  if (!input) return null;

  // Extract src attribute if input is an iframe HTML string
  const src = input.includes("src=")
    ? input.match(/src="([^"]+)"/)?.[1] || input
    : input;

  if (!src) return null;

  // Pattern A: "!2d{lng}!3d{lat}" (embed URLs)
  const patternA = src.match(/!2d([-0-9.]+)!3d([-0-9.]+)/);
  if (patternA) {
    return {
      lat: parseFloat(patternA[2]),
      lng: parseFloat(patternA[1]),
    };
  }

  // Pattern B: "@lat,lng,zoom" (maps URLs)
  const patternB = src.match(/@([-0-9.]+),([-0-9.]+),/);
  if (patternB) {
    return {
      lat: parseFloat(patternB[1]),
      lng: parseFloat(patternB[2]),
    };
  }

  // Pattern C: query "q=lat,lng" or "q=place+name@lat,lng"
  const patternC = src.match(/[?&]q=([-0-9.]+),([-0-9.]+)/);
  if (patternC) {
    return {
      lat: parseFloat(patternC[1]),
      lng: parseFloat(patternC[2]),
    };
  }

  return null;
}

/**
 * Validates if a string is a valid Google Maps URL or iframe
 */
export function isGoogleMapsInput(input: string): boolean {
  if (!input) return false;

  const normalized = input.toLowerCase();
  return (
    normalized.includes("maps.google.") ||
    normalized.includes("maps.app.goo.gl") ||
    normalized.includes("goo.gl/maps") ||
    normalized.includes("<iframe") ||
    normalized.includes("google.com/maps")
  );
}

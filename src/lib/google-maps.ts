/**
 * Map/location utilities.
 *
 * Display is handled by Leaflet + OpenStreetMap tiles (see components/common/
 * leaflet-map). These helpers parse coordinates out of pasted Google Maps links
 * (a convenience for users who copy a link) and build free OSM web URLs for
 * "view on map" / "directions" — no API key or billing required.
 */

/** Fallback map center when no markers exist (Lisbon). */
export const DEFAULT_MAP_CENTER = { lat: 38.7223, lng: -9.1393 } as const;

/**
 * Free web link to view a point on OpenStreetMap.
 */
export function osmViewUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

/**
 * Free web link to driving/walking directions to a point (OSM routing UI).
 * No destination origin is assumed; OSM asks for the start.
 */
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat},${lng}`;
}

/**
 * Extracts coordinates from a Google Maps URL (several formats).
 */
export function extractCoordinatesFromGoogleMapsUrl(
  url: string,
): { lat: number; lng: number } | null {
  try {
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
 * Extracts latitude and longitude from a Google Maps URL or iframe embed code.
 * Supports:
 * - Pattern A: "!2d{lng}!3d{lat}" (embed URLs)
 * - Pattern B: "@lat,lng,zoom" (maps URLs)
 * - Pattern C: query "q=lat,lng" or "q=place+name@lat,lng"
 */
export function extractLatLngFromGoogleMapsSrc(
  input: string,
): { lat: number; lng: number } | null {
  if (!input) return null;

  const src = input.includes("src=")
    ? input.match(/src="([^"]+)"/)?.[1] || input
    : input;

  if (!src) return null;

  const patternA = src.match(/!2d([-0-9.]+)!3d([-0-9.]+)/);
  if (patternA) {
    return {
      lat: parseFloat(patternA[2]),
      lng: parseFloat(patternA[1]),
    };
  }

  const patternB = src.match(/@([-0-9.]+),([-0-9.]+),/);
  if (patternB) {
    return {
      lat: parseFloat(patternB[1]),
      lng: parseFloat(patternB[2]),
    };
  }

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

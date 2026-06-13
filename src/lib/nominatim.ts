/**
 * OpenStreetMap Nominatim adapter.
 *
 * Maps Nominatim responses into the PlaceSearchResult / PlaceDetails shapes the
 * app already consumes (originally Google Places), so swapping the provider is
 * transparent to the client. Nominatim is free and keyless; in exchange it has
 * no photos, ratings, or price levels, and a strict usage policy:
 *   - max ~1 request/second
 *   - a descriptive User-Agent is required
 * See https://operations.osmfoundation.org/policies/nominatim/
 */

import type { PlaceDetails, PlaceSearchResult } from "@/lib/google-places";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Travalava/1.0 (group trip planner; contact via app)";

interface NominatimPlace {
  place_id: number;
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
}

/** Pack osm_type + osm_id into the place_id the app stores and looks up by. */
function encodePlaceId(p: NominatimPlace): string {
  const prefix = (p.osm_type || "node")[0].toUpperCase(); // N | W | R
  return `${prefix}${p.osm_id ?? p.place_id}`;
}

/** Map OSM class/type to Google-style `types[]` so existing helpers still work. */
function osmTypes(p: NominatimPlace): string[] {
  const t = p.type || "";
  const c = p.class || "";
  const out: string[] = [];
  const restaurantish = [
    "restaurant",
    "cafe",
    "bar",
    "pub",
    "fast_food",
    "food_court",
    "bakery",
    "ice_cream",
  ];
  const activityish: Record<string, string> = {
    attraction: "tourist_attraction",
    museum: "museum",
    artwork: "art_gallery",
    gallery: "art_gallery",
    park: "park",
    zoo: "zoo",
    aquarium: "aquarium",
    theme_park: "amusement_park",
    viewpoint: "tourist_attraction",
    monument: "tourist_attraction",
    castle: "tourist_attraction",
    place_of_worship: "church",
    theatre: "movie_theater",
    cinema: "movie_theater",
    nightclub: "night_club",
    mall: "shopping_mall",
    stadium: "stadium",
  };
  if (restaurantish.includes(t)) out.push(t === "cafe" ? "cafe" : "restaurant");
  if (activityish[t]) out.push(activityish[t]);
  if (c === "tourism" && !out.length) out.push("tourist_attraction");
  if (c === "amenity" && restaurantish.includes(t)) out.push("restaurant");
  out.push(c || "establishment");
  return out;
}

/** A short, human title (Nominatim's display_name is the full address). */
function placeName(p: NominatimPlace): string {
  if (p.name) return p.name;
  return p.display_name.split(",")[0] || p.display_name;
}

function toPlaceSearchResult(p: NominatimPlace): PlaceSearchResult {
  return {
    place_id: encodePlaceId(p),
    name: placeName(p),
    formatted_address: p.display_name,
    geometry: {
      location: { lat: Number(p.lat), lng: Number(p.lon) },
    },
    types: osmTypes(p),
  };
}

export function toPlaceSearchResults(
  places: NominatimPlace[],
): PlaceSearchResult[] {
  return places.map(toPlaceSearchResult);
}

interface SearchOptions {
  viewbox?: string; // "minLon,minLat,maxLon,maxLat"
  limit?: number;
}

export async function nominatimSearch(
  query: string,
  opts: SearchOptions = {},
): Promise<NominatimPlace[]> {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", String(opts.limit ?? 8));
  if (opts.viewbox) url.searchParams.set("viewbox", opts.viewbox);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    // Cache on the edge for a day; place data is stable and rate limits are tight
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  return (await res.json()) as NominatimPlace[];
}

/** Look up a single place by the encoded place_id (e.g. "N12345"). */
export async function nominatimLookup(
  placeId: string,
): Promise<PlaceDetails | null> {
  const match = placeId.match(/^([NWR])(\d+)$/);
  if (!match) return null;
  const osmIds = `${match[1]}${match[2]}`;

  const url = new URL(`${NOMINATIM_BASE}/lookup`);
  url.searchParams.set("osm_ids", osmIds);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Nominatim lookup failed: ${res.status}`);
  const arr = (await res.json()) as NominatimPlace[];
  const place = arr[0];
  if (!place) return null;

  const tags = place.extratags || {};
  return {
    ...toPlaceSearchResult(place),
    formatted_phone_number: tags.phone || tags["contact:phone"] || undefined,
    website: tags.website || tags["contact:website"] || undefined,
    editorial_summary: tags.description
      ? { overview: tags.description }
      : undefined,
  };
}

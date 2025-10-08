/**
 * Google Places API utilities for cost-efficient place searching
 * Optimized for minimal API usage with caching and debouncing
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";

// Types for Google Places API
export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  editorial_summary?: {
    overview: string;
  };
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
}

export interface PlaceDetails extends PlaceSearchResult {
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  editorial_summary?: {
    overview: string;
  };
}

export interface PlaceSearchParams {
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  type?: "restaurant" | "tourist_attraction" | "establishment";
}

// IndexedDB schema for caching
interface PlacesDB extends DBSchema {
  "search-cache": {
    key: string;
    value: {
      query: string;
      results: PlaceSearchResult[];
      timestamp: number;
      expiresAt: number;
    };
  };
  "details-cache": {
    key: string;
    value: {
      place_id: string;
      details: PlaceDetails;
      timestamp: number;
      expiresAt: number;
    };
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// API base URL for our Next.js routes
const API_BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "";

class GooglePlacesService {
  private db: IDBPDatabase<PlacesDB> | null = null;
  private dbPromise: Promise<IDBPDatabase<PlacesDB>> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initDB();
    }
  }

  private async initDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<PlacesDB>("places-cache", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("search-cache")) {
            db.createObjectStore("search-cache");
          }
          if (!db.objectStoreNames.contains("details-cache")) {
            db.createObjectStore("details-cache");
          }
        },
      });
    }

    if (!this.db) {
      this.db = await this.dbPromise;
    }

    return this.db;
  }

  private getCacheKey(params: PlaceSearchParams): string {
    const { query, location, radius, type } = params;
    const locationStr = location ? `${location.lat},${location.lng}` : "";
    return `${query}:${locationStr}:${radius || ""}:${type || ""}`;
  }

  private async getCachedSearch(
    key: string,
  ): Promise<PlaceSearchResult[] | null> {
    try {
      const db = await this.initDB();
      const cached = await db.get("search-cache", key);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.results;
      }

      if (cached) {
        await db.delete("search-cache", key);
      }

      return null;
    } catch (error) {
      console.warn("Cache read error:", error);
      return null;
    }
  }

  private async setCachedSearch(
    key: string,
    results: PlaceSearchResult[],
  ): Promise<void> {
    try {
      const db = await this.initDB();
      await db.put(
        "search-cache",
        {
          query: key,
          results,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        },
        key,
      );
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  private async getCachedDetails(
    placeId: string,
  ): Promise<PlaceDetails | null> {
    try {
      const db = await this.initDB();
      const cached = await db.get("details-cache", placeId);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.details;
      }

      if (cached) {
        await db.delete("details-cache", placeId);
      }

      return null;
    } catch (error) {
      console.warn("Cache read error:", error);
      return null;
    }
  }

  private async setCachedDetails(
    placeId: string,
    details: PlaceDetails,
  ): Promise<void> {
    try {
      const db = await this.initDB();
      await db.put(
        "details-cache",
        {
          place_id: placeId,
          details,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        },
        placeId,
      );
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  /**
   * Search for places using our Next.js API route
   */
  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult[]> {
    const cacheKey = this.getCacheKey(params);

    // Check cache first
    const cached = await this.getCachedSearch(cacheKey);
    if (cached) {
      return cached;
    }

    const { query, location, radius = 5000, type } = params;

    // Build API URL for our Next.js route
    const searchParams = new URLSearchParams({
      query,
    });

    if (location) {
      searchParams.append("location", `${location.lat},${location.lng}`);
      searchParams.append("radius", radius.toString());
    }

    if (type) {
      searchParams.append("type", type);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/places/search?${searchParams}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      const results = data.results || [];

      // Cache the results
      await this.setCachedSearch(cacheKey, results);

      return results;
    } catch (error) {
      console.error("Places search error:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific place using our Next.js API route
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    // Check cache first
    const cached = await this.getCachedDetails(placeId);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/places/details?place_id=${encodeURIComponent(placeId)}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Details fetch failed");
      }

      const data = await response.json();
      const details = data.result;

      // Cache the details
      await this.setCachedDetails(placeId, details);

      return details;
    } catch (error) {
      console.error("Place details error:", error);
      throw error;
    }
  }

  /**
   * Get optimized photo URL for a place using our Next.js API route
   */
  getPhotoUrl(photoReference: string, maxWidth = 400): string {
    if (!photoReference) return "";

    return `${API_BASE_URL}/api/places/photo?photo_reference=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
  }

  /**
   * Convert price level to readable format
   */
  formatPriceLevel(priceLevel?: number): string {
    if (typeof priceLevel !== "number") return "";

    const levels = ["", "$", "$$", "$$$", "$$$$"];
    return levels[priceLevel] || "";
  }

  /**
   * Check if a place is suitable for activities (tourist attractions, museums, etc.)
   */
  isActivityPlace(types: string[]): boolean {
    const activityTypes = [
      "tourist_attraction",
      "museum",
      "park",
      "zoo",
      "aquarium",
      "amusement_park",
      "art_gallery",
      "casino",
      "church",
      "city_hall",
      "library",
      "movie_theater",
      "night_club",
      "shopping_mall",
      "stadium",
      "university",
    ];

    return types.some((type) => activityTypes.includes(type));
  }

  /**
   * Check if a place is a restaurant
   */
  isRestaurant(types: string[]): boolean {
    const restaurantTypes = [
      "restaurant",
      "food",
      "meal_takeaway",
      "meal_delivery",
      "cafe",
      "bar",
      "bakery",
    ];

    return types.some((type) => restaurantTypes.includes(type));
  }

  /**
   * Convert PlaceSearchResult to ActivityInput format
   */
  toActivityInput(
    place: PlaceSearchResult,
    tripId: string,
    tripCurrency: string,
  ) {
    return {
      trip_id: tripId,
      title: place.name,
      category: this.isRestaurant(place.types)
        ? "restaurant"
        : this.isActivityPlace(place.types)
          ? this.getCategoryFromTypes(place.types)
          : "other",
      location: {
        name: place.formatted_address,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
      },
      cost_currency: tripCurrency,
      notes: place.editorial_summary?.overview || "",
      src: place.photos?.[0]
        ? this.getPhotoUrl(place.photos[0].photo_reference)
        : undefined,
    };
  }

  /**
   * Convert PlaceSearchResult to RestaurantInput format
   *
   * IMPORTANT: Per Google's Terms of Service, only these fields should be stored:
   * - place_id (required for fetching fresh data)
   * - lat/lon (cached coordinates, must be refreshed every 30 days)
   * - name (optional, for convenience)
   *
   * All other fields are for DISPLAY ONLY and should be fetched fresh each time
   * using the place_id. This ensures compliance with Google's caching restrictions.
   */
  toRestaurantInput(place: PlaceSearchResult, details?: PlaceDetails) {
    return {
      // Fields allowed to be stored (Google ToS compliant)
      name: place.name,
      place_id: place.place_id,
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,

      // Fields for DISPLAY ONLY (do not cache in database)
      location_updated_at: new Date().toISOString(),
      cuisine_type: this.getCuisineFromTypes(place.types),
      price_range: this.formatPriceLevel(place.price_level),
      description: details?.editorial_summary?.overview || "",
      address: place.formatted_address,
      phone: details?.formatted_phone_number || "",
      website: details?.website || "",
      image_url: place.photos?.[0]
        ? this.getPhotoUrl(place.photos[0].photo_reference)
        : "",
      rating: place.rating,
      review_count: place.user_ratings_total,
    };
  }

  private getCategoryFromTypes(types: string[]): string {
    const categoryMap: Record<string, string> = {
      tourist_attraction: "sightseeing",
      museum: "cultural",
      art_gallery: "cultural",
      park: "outdoor",
      zoo: "entertainment",
      aquarium: "entertainment",
      amusement_park: "entertainment",
      shopping_mall: "shopping",
      movie_theater: "entertainment",
      night_club: "entertainment",
      stadium: "entertainment",
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return "other";
  }

  private getCuisineFromTypes(types: string[]): string {
    const cuisineMap: Record<string, string> = {
      chinese_restaurant: "Chinese",
      italian_restaurant: "Italian",
      japanese_restaurant: "Japanese",
      mexican_restaurant: "Mexican",
      indian_restaurant: "Indian",
      thai_restaurant: "Thai",
      french_restaurant: "French",
      american_restaurant: "American",
      mediterranean_restaurant: "Mediterranean",
      seafood_restaurant: "Seafood",
      steakhouse: "Steakhouse",
      pizza_restaurant: "Pizza",
      sushi_restaurant: "Sushi",
      fast_food_restaurant: "Fast Food",
      cafe: "Cafe",
      bakery: "Bakery",
      bar: "Bar",
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return "";
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService();

// Debounced search function for autocomplete
export function createDebouncedPlacesSearch(delay = 300) {
  let timeoutId: NodeJS.Timeout;

  return (params: PlaceSearchParams): Promise<PlaceSearchResult[]> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          const results = await googlePlacesService.searchPlaces(params);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

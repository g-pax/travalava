"use client";

/**
 * GooglePlacesSearch provides an autocomplete search interface for Google Places
 * - Debounced search to minimize API calls
 * - Cached results for performance
 * - Supports both activities and restaurants
 * - Optimized for cost efficiency
 */

import {
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
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
  createDebouncedPlacesSearch,
  googlePlacesService,
  type PlaceDetails,
  type PlaceSearchParams,
  type PlaceSearchResult,
} from "@/lib/google-places";

interface GooglePlacesSearchProps {
  onPlaceSelect: (place: PlaceSearchResult, details?: PlaceDetails) => void;
  searchType: "activity" | "restaurant" | "both";
  placeholder?: string;
  initialLocation?: {
    lat: number;
    lng: number;
  };
  disabled?: boolean;
}

const debouncedSearch = createDebouncedPlacesSearch(300);

export function GooglePlacesSearch({
  onPlaceSelect,
  searchType = "both",
  placeholder = "Search for places...",
  initialLocation,
  disabled = false,
}: GooglePlacesSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const searchPlaces = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchParams: PlaceSearchParams = {
          query: searchQuery,
          location: initialLocation,
        };

        if (searchType === "restaurant") {
          searchParams.type = "restaurant";
        } else if (searchType === "activity") {
          searchParams.type = "tourist_attraction";
        }

        const searchResults = await debouncedSearch(searchParams);

        // Filter results based on search type
        const filteredResults = searchResults.filter((place) => {
          if (searchType === "restaurant") {
            return googlePlacesService.isRestaurant(place.types);
          } else if (searchType === "activity") {
            return (
              googlePlacesService.isActivityPlace(place.types) ||
              !googlePlacesService.isRestaurant(place.types)
            );
          }
          return true; // 'both' - show all results
        });

        setResults(filteredResults.slice(0, 8)); // Limit to 8 results for performance
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchType, initialLocation],
  );

  useEffect(() => {
    searchPlaces(query);
  }, [query, searchPlaces]);

  const handlePlaceSelect = async (place: PlaceSearchResult) => {
    setSelectedPlace(place);
    setLoadingDetails(true);

    try {
      // Get detailed information for better data quality
      const details = await googlePlacesService.getPlaceDetails(place.place_id);
      setPlaceDetails(details);
      onPlaceSelect(place, details);
    } catch (err) {
      console.error("Details error:", err);
      // Fallback to basic place data if details fail
      onPlaceSelect(place);
    } finally {
      setLoadingDetails(false);
    }
  };

  const clearSelection = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
    setQuery("");
    setResults([]);
  };

  const formatDistance = (place: PlaceSearchResult) => {
    // This would require additional calculation if we have user location
    // For now, we'll skip distance display
    return null;
  };

  const getPlaceTypeLabel = (types: string[]) => {
    if (googlePlacesService.isRestaurant(types)) {
      return "Restaurant";
    } else if (googlePlacesService.isActivityPlace(types)) {
      return "Attraction";
    }
    return "Place";
  };

  if (selectedPlace) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Selected Place
              </CardTitle>
              <CardDescription>
                {getPlaceTypeLabel(selectedPlace.types)} from Google Places
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Change
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{selectedPlace.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedPlace.formatted_address}
              </p>
            </div>

            {selectedPlace.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{selectedPlace.rating}</span>
                {selectedPlace.user_ratings_total && (
                  <span className="text-sm text-muted-foreground">
                    ({selectedPlace.user_ratings_total} reviews)
                  </span>
                )}
              </div>
            )}

            {selectedPlace.price_level !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Price level:
                </span>
                <span className="font-medium">
                  {googlePlacesService.formatPriceLevel(
                    selectedPlace.price_level,
                  )}
                </span>
              </div>
            )}

            {selectedPlace.business_status && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {selectedPlace.business_status === "OPERATIONAL"
                    ? "Open"
                    : "Closed"}
                </span>
              </div>
            )}

            {placeDetails?.website && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={placeDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Website
                </a>
              </Button>
            )}

            {loadingDetails && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading details...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="places-search">
          Search Google Places
          {searchType === "restaurant" && " - Restaurants"}
          {searchType === "activity" && " - Activities & Attractions"}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="places-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            disabled={disabled}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Results</Label>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {results.map((place) => (
              <Card
                key={place.place_id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handlePlaceSelect(place)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {place.photos?.[0] && (
                      <Image
                        src={googlePlacesService.getPhotoUrl(
                          place.photos[0].photo_reference,
                          80,
                        )}
                        alt={place.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        width={80}
                        height={80}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{place.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {place.formatted_address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {getPlaceTypeLabel(place.types)}
                            </span>
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{place.rating}</span>
                              </div>
                            )}
                            {place.price_level !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {googlePlacesService.formatPriceLevel(
                                  place.price_level,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {query.length >= 3 && !isLoading && results.length === 0 && !error && (
        <div className="text-sm text-muted-foreground text-center py-6">
          No places found for "{query}"
        </div>
      )}

      {query.length > 0 && query.length < 3 && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function CompactGooglePlacesSearch({
  onPlaceSelect,
  searchType = "both",
  placeholder = "Search places...",
  disabled = false,
}: Omit<GooglePlacesSearchProps, "initialLocation">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchPlaces = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      setShowResults(true);

      try {
        const searchParams: PlaceSearchParams = { query: searchQuery };

        if (searchType === "restaurant") {
          searchParams.type = "restaurant";
        } else if (searchType === "activity") {
          searchParams.type = "tourist_attraction";
        }

        const searchResults = await debouncedSearch(searchParams);
        setResults(searchResults.slice(0, 5)); // Limit to 5 for compact view
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchType],
  );

  useEffect(() => {
    searchPlaces(query);
  }, [query, searchPlaces]);

  const handlePlaceSelect = (place: PlaceSearchResult) => {
    setQuery(place.name);
    setShowResults(false);
    onPlaceSelect(place);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          disabled={disabled}
          onFocus={() => setShowResults(results.length > 0)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((place) => (
            <button
              type="button"
              key={place.place_id}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {place.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {place.formatted_address}
                  </div>
                </div>
                {place.rating && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{place.rating}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

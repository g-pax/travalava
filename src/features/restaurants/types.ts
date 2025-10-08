import type {
  ActivityRestaurantLink,
  Restaurant,
  RestaurantCreate,
  RestaurantSearch,
  RestaurantUpdate,
  RestaurantWithLinks,
} from "./schemas";

// Re-export schema types
export type {
  Restaurant,
  RestaurantCreate,
  RestaurantUpdate,
  RestaurantSearch,
  ActivityRestaurantLink,
  RestaurantWithLinks,
};

// Database row types (what comes from Supabase)
export interface RestaurantRow {
  id: string;
  trip_id: string;
  name: string;
  cuisine_type?: string;
  price_range?: "$" | "$$" | "$$$" | "$$$$";
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  place_id?: string;
  lat?: number;
  lon?: number;
  location_updated_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ActivityRestaurantLinkRow {
  id: string;
  activity_id: string;
  restaurant_id: string;
  sort_order: number;
  created_at: string;
  linked_by?: string;
}

// Extended types for UI
export interface RestaurantWithActivityLinks extends RestaurantRow {
  activity_links?: ActivityRestaurantLinkRow[];
  linked_activities_count?: number;
}

// Form types
export interface RestaurantFormData {
  name: string;
  cuisine_type?: string;
  price_range?: "$" | "$$" | "$$$" | "$$$$";
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  place_id?: string;
  lat?: number;
  lon?: number;
}

// Search and filter types
export interface RestaurantFilters {
  search?: string;
  cuisine_type?: string;
  price_range?: "$" | "$$" | "$$$" | "$$$$";
  has_location?: boolean;
}

// API response types
export interface RestaurantListResponse {
  data: RestaurantWithActivityLinks[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface RestaurantDetailResponse {
  data: RestaurantWithActivityLinks;
}

// Hook return types
export interface UseRestaurantsResult {
  restaurants: RestaurantWithActivityLinks[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseRestaurantResult {
  restaurant: RestaurantWithActivityLinks | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mutation types
export interface CreateRestaurantMutation {
  mutate: (data: RestaurantCreate) => Promise<Restaurant>;
  isLoading: boolean;
  error: Error | null;
}

export interface UpdateRestaurantMutation {
  mutate: (data: RestaurantUpdate) => Promise<Restaurant>;
  isLoading: boolean;
  error: Error | null;
}

export interface DeleteRestaurantMutation {
  mutate: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export interface LinkRestaurantMutation {
  mutate: (data: {
    activity_id: string;
    restaurant_id: string;
  }) => Promise<ActivityRestaurantLink>;
  isLoading: boolean;
  error: Error | null;
}

export interface UnlinkRestaurantMutation {
  mutate: (data: {
    activity_id: string;
    restaurant_id: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

import { z } from "zod";

// Base restaurant schema for database operations
export const RestaurantSchema = z.object({
  id: z.string().uuid().optional(),
  trip_id: z.string().uuid(),

  // Basic restaurant information
  name: z.string().min(1, "Restaurant name is required"),
  cuisine_type: z.string().optional(),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.url().optional(),
  image_url: z.url().optional(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().min(0).optional(),

  // Google Places data
  place_id: z.string().optional(),

  // Location data (expires after 30 days)
  lat: z.number().optional(),
  lon: z.number().optional(),
  location_updated_at: z.string().datetime().optional(),

  // Metadata
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
});

// Schema for creating a new restaurant
export const RestaurantCreateSchema = RestaurantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
});

// Schema for updating a restaurant
export const RestaurantUpdateSchema = RestaurantCreateSchema.partial().extend({
  id: z.string().uuid(),
});

// Schema for restaurant search/filter
export const RestaurantSearchSchema = z.object({
  trip_id: z.string().uuid(),
  search: z.string().optional(),
  cuisine_type: z.string().optional(),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  has_location: z.boolean().optional(),
});

// Activity-Restaurant link schema
export const ActivityRestaurantLinkSchema = z.object({
  id: z.string().uuid().optional(),
  activity_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  sort_order: z.number().default(0),
  created_at: z.string().datetime().optional(),
  linked_by: z.string().uuid().optional(),
});

// Schema for linking restaurants to activities
export const LinkRestaurantsToActivitySchema = z.object({
  activity_id: z.string().uuid(),
  restaurant_ids: z.array(z.string().uuid()),
});

// Schema for restaurant with activity links (for display)
export const RestaurantWithLinksSchema = RestaurantSchema.extend({
  activity_links: z.array(ActivityRestaurantLinkSchema).optional(),
  linked_activities_count: z.number().optional(),
});

// Type exports
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type RestaurantCreate = z.infer<typeof RestaurantCreateSchema>;
export type RestaurantUpdate = z.infer<typeof RestaurantUpdateSchema>;
export type RestaurantSearch = z.infer<typeof RestaurantSearchSchema>;
export type ActivityRestaurantLink = z.infer<
  typeof ActivityRestaurantLinkSchema
>;
export type LinkRestaurantsToActivity = z.infer<
  typeof LinkRestaurantsToActivitySchema
>;
export type RestaurantWithLinks = z.infer<typeof RestaurantWithLinksSchema>;

// Validation helpers
export const validateRestaurant = (data: unknown) =>
  RestaurantSchema.parse(data);
export const validateRestaurantCreate = (data: unknown) =>
  RestaurantCreateSchema.parse(data);
export const validateRestaurantUpdate = (data: unknown) =>
  RestaurantUpdateSchema.parse(data);

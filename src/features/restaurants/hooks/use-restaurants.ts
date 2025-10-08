"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type {
  Restaurant,
  RestaurantCreate,
  RestaurantSearch,
  RestaurantUpdate,
  RestaurantWithActivityLinks,
} from "../types";

// Query keys
export const restaurantKeys = {
  all: ["restaurants"] as const,
  lists: () => [...restaurantKeys.all, "list"] as const,
  list: (tripId: string, filters?: RestaurantSearch) =>
    [...restaurantKeys.lists(), tripId, filters] as const,
  details: () => [...restaurantKeys.all, "detail"] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
  byActivity: (activityId: string) =>
    [...restaurantKeys.all, "activity", activityId] as const,
};

// Fetch restaurants for a trip
export function useRestaurants(tripId: string, filters?: RestaurantSearch) {
  return useQuery({
    enabled: !!tripId,
    queryKey: restaurantKeys.list(tripId, filters),
    queryFn: async (): Promise<RestaurantWithActivityLinks[]> => {
      const query = supabase
        .from("restaurants")
        .select(`
          *,
          activity_links:activity_restaurants(
            id,
            activity_id,
            restaurant_id,
            sort_order,
            created_at,
            linked_by
          )
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch restaurants: ${error.message}`);
      }

      return (
        (data as any[])?.map((row) => ({
          ...row,
          linked_activities_count: row.activity_links?.length || 0,
        })) || []
      );
    },
  });
}

// Fetch single restaurant
export function useRestaurant(restaurantId: string) {
  return useQuery({
    enabled: !!restaurantId,
    queryKey: restaurantKeys.detail(restaurantId),
    queryFn: async (): Promise<RestaurantWithActivityLinks | null> => {
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          *,
          activity_links:activity_restaurants(
            id,
            activity_id,
            restaurant_id,
            sort_order,
            created_at,
            linked_by,
            activity:activities(
              id,
              title
            )
          )
        `)
        .eq("id", restaurantId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Restaurant not found
        }
        throw new Error(`Failed to fetch restaurant: ${error.message}`);
      }

      return {
        ...data,
        linked_activities_count: data.activity_links?.length || 0,
      } as RestaurantWithActivityLinks;
    },
  });
}

// Fetch restaurants linked to a specific activity
export function useRestaurantsByActivity(activityId: string) {
  return useQuery({
    enabled: !!activityId,
    queryKey: restaurantKeys.byActivity(activityId),
    queryFn: async (): Promise<RestaurantWithActivityLinks[]> => {
      const { data, error } = await supabase
        .from("activity_restaurants")
        .select(`
          sort_order,
          restaurant:restaurants(*)
        `)
        .eq("activity_id", activityId)
        .order("sort_order", { ascending: true });

      if (error) {
        throw new Error(
          `Failed to fetch restaurants for activity: ${error.message}`,
        );
      }

      return data?.map((link: any) => link.restaurant) || [];
    },
  });
}

// Create restaurant mutation
export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RestaurantCreate): Promise<Restaurant> => {
      const restaurantData = {
        ...data,
        location_updated_at:
          data.lat && data.lon ? new Date().toISOString() : undefined,
      };

      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .insert(restaurantData)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to create restaurant: ${error.message}`);
      }

      return restaurant as Restaurant;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch restaurants for this trip
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.list(variables.trip_id),
      });
      toast.success("Restaurant created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create restaurant: ${error.message}`);
    },
  });
}

// Update restaurant mutation
export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RestaurantUpdate): Promise<Restaurant> => {
      const { id, ...updateData } = data;

      // Update location timestamp if coordinates are being updated
      const restaurantData = {
        ...updateData,
        location_updated_at:
          updateData.lat !== undefined || updateData.lon !== undefined
            ? new Date().toISOString()
            : undefined,
      };

      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .update(restaurantData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update restaurant: ${error.message}`);
      }

      return restaurant as Restaurant;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.detail(data.id!),
      });
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.list(data.trip_id),
      });
      toast.success("Restaurant updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update restaurant: ${error.message}`);
    },
  });
}

// Delete restaurant mutation
export function useDeleteRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurantId: string): Promise<void> => {
      // First, get the restaurant to know which trip it belongs to
      const { data: restaurant, error: fetchError } = await supabase
        .from("restaurants")
        .select("trip_id")
        .eq("id", restaurantId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to find restaurant: ${fetchError.message}`);
      }

      // Delete the restaurant (CASCADE will handle activity_restaurants links)
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", restaurantId);

      if (error) {
        throw new Error(`Failed to delete restaurant: ${error.message}`);
      }

      return { tripId: restaurant.trip_id } as any;
    },
    onSuccess: (_, restaurantId) => {
      // Invalidate all restaurant queries since we don't know the trip_id here
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.all,
      });
      toast.success("Restaurant deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete restaurant: ${error.message}`);
    },
  });
}

// Link restaurant to activity
export function useLinkRestaurantToActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      activity_id: string;
      restaurant_id: string;
      sort_order?: number;
    }) => {
      const { error } = await supabase.from("activity_restaurants").insert({
        activity_id: data.activity_id,
        restaurant_id: data.restaurant_id,
        sort_order: data.sort_order || 0,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error("Restaurant is already linked to this activity");
        }
        throw new Error(`Failed to link restaurant: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.byActivity(variables.activity_id),
      });
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.detail(variables.restaurant_id),
      });
      toast.success("Restaurant linked to activity");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Unlink restaurant from activity
export function useUnlinkRestaurantFromActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      activity_id: string;
      restaurant_id: string;
    }) => {
      const { error } = await supabase
        .from("activity_restaurants")
        .delete()
        .eq("activity_id", data.activity_id)
        .eq("restaurant_id", data.restaurant_id);

      if (error) {
        throw new Error(`Failed to unlink restaurant: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.byActivity(variables.activity_id),
      });
      queryClient.invalidateQueries({
        queryKey: restaurantKeys.detail(variables.restaurant_id),
      });
      toast.success("Restaurant unlinked from activity");
    },
    onError: (error) => {
      toast.error(`Failed to unlink restaurant: ${error.message}`);
    },
  });
}

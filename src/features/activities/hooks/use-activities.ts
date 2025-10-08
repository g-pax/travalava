/**
 * React Query hooks for activity management
 * - CRUD operations for activities
 * - Optimistic updates and proper cache invalidation
 * - Client mutation IDs for idempotency and offline support
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { ActivityCreateInput } from "@/schemas";

export interface Restaurant {
  id?: string;
  name: string;
  lat: number;
  lon: number;
  place_id: string;
  trip_id: string;
}

export interface Activity {
  src?: string | null;
  id: string;
  trip_id: string;
  title: string;
  category: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  duration_min: number | null;
  notes: string | null;
  link: string | null;
  image_url?: string | null;
  location: {
    name: string;
    lat: number;
    lon: number;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined proposal data
  block_proposals?: Array<{
    id: string;
    block_id: string;
    created_at: string;
    block?: {
      id: string;
      label: string;
      position: number;
      day?: {
        id: string;
        date: string;
      };
    };
  }>;
}

/**
 * Fetch all activities for a trip with their proposals
 * This efficiently fetches all activity proposals in a single query
 * to avoid N+1 queries when displaying activity cards
 */
export function useActivities(tripId: string) {
  return useQuery({
    queryKey: ["activities", tripId],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          block_proposals (
            id,
            block_id,
            created_at,
            block:blocks (
              id,
              label,
              position,
              day:days (
                id,
                date
              )
            )
          )
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!tripId && tripId !== "undefined" && tripId !== "null",
  });
}

/**
 * Fetch a single activity by ID with its proposals
 */
export function useActivity(activityId: string) {
  return useQuery({
    queryKey: ["activity", activityId],
    queryFn: async (): Promise<Activity> => {
      if (!activityId) {
        throw new Error("Activity ID is required");
      }

      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          block_proposals (
            id,
            block_id,
            created_at,
            block:blocks (
              id,
              label,
              position,
              day:days (
                id,
                date
              )
            )
          )
        `)
        .eq("id", activityId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      if (!data) {
        throw new Error("Activity not found");
      }

      return data;
    },
    enabled:
      !!activityId && activityId !== "undefined" && activityId !== "null",
  });
}

/**
 * Create a new activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ActivityCreateInput & { clientMutationId?: string },
    ) => {
      const clientMutationId = input.clientMutationId || nanoid();

      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            ...input,
            client_mutation_id: clientMutationId,
          },
        ])
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to create activity: ${error.message}`);
      }

      return data;
    },
    // onMutate: async (input) => {
    //   // Cancel outgoing refetches
    //   await queryClient.cancelQueries({
    //     queryKey: ["activities", input.trip_id],
    //   });

    //   // Snapshot previous value
    //   const previousActivities = queryClient.getQueryData<Activity[]>([
    //     "activities",
    //     input.trip_id,
    //   ]);

    //   // Optimistically update
    //   if (previousActivities) {
    //     const optimisticActivity: Activity = {
    //       id: `temp-${nanoid()}`,
    //       ...input,
    //       // photos: input.src || [],
    //       category: input.category || null,
    //       cost_amount: input.cost_amount || null,
    //       cost_currency: input.cost_currency || null,
    //       duration_min: input.duration_min || null,
    //       notes: input.notes || null,
    //       link: input.link || null,
    //       location: input.location || null,
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString(),
    //     };

    //     queryClient.setQueryData<Activity[]>(
    //       ["activities", input.trip_id],
    //       [optimisticActivity, ...previousActivities],
    //     );
    //   }

    //   return { previousActivities };
    // },
    // onError: (_error, input, context) => {
    //   // Rollback optimistic update
    //   if (context?.previousActivities) {
    //     queryClient.setQueryData(
    //       ["activities", input.trip_id],
    //       context.previousActivities,
    //     );
    //   }
    //   toast.error("Failed to create activity");
    // },
    onSuccess: (_data, input) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["activities", input.trip_id],
      });
      toast.success("Activity created successfully");
    },
  });
}

/**
 * Update an existing activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      clientMutationId,
    }: {
      id: string;
      updates: Partial<ActivityCreateInput>;
      clientMutationId?: string;
    }) => {
      const mutationId = clientMutationId || nanoid();

      const { data, error } = await supabase
        .from("activities")
        .update({
          ...updates,
          client_mutation_id: mutationId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update activity: ${error.message}`);
      }

      if (!data) {
        throw new Error("Activity not found or update failed");
      }

      return data;
    },
    onError: (error) => {
      console.log("🚀 ~ useUpdateActivity ~ error:", error);
      toast.error("Failed to update activity");
    },
    onSuccess: (data) => {
      // Invalidate both caches to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["activities", data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ["activity", data.id] });
      toast.success("Activity updated successfully");
    },
  });
}

/**
 * Delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clientMutationId,
    }: {
      id: string;
      clientMutationId?: string;
    }) => {
      const mutationId = clientMutationId || nanoid();

      // Check if activity is committed
      const { data: commits } = await supabase
        .from("commits")
        .select("id")
        .eq("activity_id", id)
        .limit(1);

      if (commits && commits.length > 0) {
        throw new Error(
          "Cannot delete activity that has been committed to a block",
        );
      }

      // Get trip_id before deleting
      const { data: activity } = await supabase
        .from("activities")
        .select("trip_id")
        .eq("id", id)
        .maybeSingle();

      if (!activity) {
        throw new Error("Activity not found");
      }

      // Delete related data
      await supabase.from("block_proposals").delete().eq("activity_id", id);
      await supabase.from("votes").delete().eq("activity_id", id);

      // Delete the activity
      const { error } = await supabase.from("activities").delete().eq("id", id);

      if (error) {
        throw new Error(`Failed to delete activity: ${error.message}`);
      }

      return { id, tripId: activity.trip_id, clientMutationId: mutationId };
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete activity");
    },
    onSuccess: (data) => {
      // Remove from cache and invalidate
      queryClient.removeQueries({ queryKey: ["activity", data.id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data.tripId],
      });
      toast.success("Activity deleted successfully");
    },
  });
}

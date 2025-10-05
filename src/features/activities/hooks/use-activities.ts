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
}

/**
 * Fetch all activities for a trip
 */
export function useActivities(tripId: string) {
  return useQuery({
    queryKey: ["activities", tripId],
    queryFn: async (): Promise<Activity[]> => {
      if (!tripId) {
        throw new Error("Trip ID is required");
      }

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!tripId && tripId !== "undefined" && tripId !== "null",
    staleTime: 1000 * 60 * 2, // 2 minutes for activities
  });
}

/**
 * Fetch a single activity by ID
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
        .select("*")
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
    staleTime: 1000 * 60 * 5, // 5 minutes for individual activity
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
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["activities", input.trip_id],
      });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>([
        "activities",
        input.trip_id,
      ]);

      // Optimistically update
      if (previousActivities) {
        const optimisticActivity: Activity = {
          id: `temp-${nanoid()}`,
          ...input,
          category: input.category || null,
          cost_amount: input.cost_amount || null,
          cost_currency: input.cost_currency || null,
          duration_min: input.duration_min || null,
          notes: input.notes || null,
          link: input.link || null,
          location: input.location || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Activity[]>(
          ["activities", input.trip_id],
          [optimisticActivity, ...previousActivities],
        );
      }

      return { previousActivities };
    },
    onError: (error, input, context) => {
      // Rollback optimistic update
      if (context?.previousActivities) {
        queryClient.setQueryData(
          ["activities", input.trip_id],
          context.previousActivities,
        );
      }
      toast.error("Failed to create activity");
    },
    onSuccess: (data, input) => {
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

      return data;
    },
    onMutate: async ({ id, updates }) => {
      const activity = queryClient.getQueryData<Activity>(["activity", id]);
      if (!activity) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["activities", activity.trip_id],
      });
      await queryClient.cancelQueries({ queryKey: ["activity", id] });

      // Snapshot previous values
      const previousActivities = queryClient.getQueryData<Activity[]>([
        "activities",
        activity.trip_id,
      ]);
      const previousActivity = queryClient.getQueryData<Activity>([
        "activity",
        id,
      ]);

      // Optimistically update
      const updatedActivity = {
        ...activity,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(["activity", id], updatedActivity);

      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          ["activities", activity.trip_id],
          previousActivities.map((a) => (a.id === id ? updatedActivity : a)),
        );
      }

      return { previousActivities, previousActivity, tripId: activity.trip_id };
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousActivities) {
        queryClient.setQueryData(
          ["activities", context.tripId],
          context.previousActivities,
        );
      }
      if (context?.previousActivity) {
        queryClient.setQueryData(["activity", id], context.previousActivity);
      }
      toast.error("Failed to update activity");
    },
    onSuccess: (data) => {
      // Invalidate and refetch
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

      // First check if activity is committed anywhere
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

      // Delete proposals first
      await supabase.from("block_proposals").delete().eq("activity_id", id);

      // Delete votes
      await supabase.from("votes").delete().eq("activity_id", id);

      // Delete the activity
      const { error } = await supabase.from("activities").delete().eq("id", id);

      if (error) {
        throw new Error(`Failed to delete activity: ${error.message}`);
      }

      return { id, clientMutationId: mutationId };
    },
    onMutate: async ({ id }) => {
      const activity = queryClient.getQueryData<Activity>(["activity", id]);
      if (!activity) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["activities", activity.trip_id],
      });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>([
        "activities",
        activity.trip_id,
      ]);

      // Optimistically remove
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          ["activities", activity.trip_id],
          previousActivities.filter((a) => a.id !== id),
        );
      }

      return { previousActivities, tripId: activity.trip_id };
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousActivities) {
        queryClient.setQueryData(
          ["activities", context.tripId],
          context.previousActivities,
        );
      }
      toast.error(error.message || "Failed to delete activity");
    },
    onSuccess: (data, { id }, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["activity", id] });

      // Invalidate activities list
      if (context?.tripId) {
        queryClient.invalidateQueries({
          queryKey: ["activities", context.tripId],
        });
      }

      toast.success("Activity deleted successfully");
    },
  });
}

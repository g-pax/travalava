import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UpdateVotingWindowParams {
  blockId: string;
  tripId: string;
  vote_open_ts: string;
  vote_close_ts: string;
}

interface ClearVotingWindowParams {
  blockId: string;
  tripId: string;
}

/**
 * Update voting window for a block
 */
export function useUpdateVotingWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      tripId,
      vote_open_ts,
      vote_close_ts,
    }: UpdateVotingWindowParams) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts,
          vote_close_ts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blockId)
        .eq("trip_id", tripId) // RLS check
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update voting window: ${error.message}`);
      }

      return { block: data, clientMutationId };
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["days", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", variables.tripId] });
      toast.success("Voting window updated!");
    },
    onError: (error) => {
      toast.error("Failed to update voting window");
      console.error("Voting window update error:", error);
    },
  });
}

/**
 * Clear voting window for a block
 */
export function useClearVotingWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockId, tripId }: ClearVotingWindowParams) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts: null,
          vote_close_ts: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blockId)
        .eq("trip_id", tripId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to clear voting window: ${error.message}`);
      }

      return { block: data, clientMutationId };
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["days", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", variables.tripId] });
      toast.success("Voting window cleared!");
    },
    onError: (error) => {
      toast.error("Failed to clear voting window");
      console.error("Clear voting window error:", error);
    },
  });
}

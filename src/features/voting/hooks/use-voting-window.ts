"use client";
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
      vote_open_ts,
      vote_close_ts,
    }: UpdateVotingWindowParams) => {
      const clientMutationId = nanoid();

      // blocks have no trip_id column (they hang off days); trip scoping is
      // enforced by RLS through the day -> trip join.
      const { data, error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts,
          vote_close_ts,
        })
        .eq("id", blockId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update voting window: ${error.message}`);
      }

      return { block: data, clientMutationId };
    },
    onSuccess: (_data, variables) => {
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
    mutationFn: async ({ blockId }: ClearVotingWindowParams) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts: null,
          vote_close_ts: null,
        })
        .eq("id", blockId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to clear voting window: ${error.message}`);
      }

      return { block: data, clientMutationId };
    },
    onSuccess: (_data, variables) => {
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

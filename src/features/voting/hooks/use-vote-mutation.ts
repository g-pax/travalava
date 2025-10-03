import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import type { VoteCastInput } from "@/schemas";

interface VoteCastParams {
  tripId: string;
  blockId: string;
  activityId: string;
  memberIdToVoteFor?: string;
}

export function useVoteCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VoteCastParams) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase.functions.invoke("vote-cast", {
        body: {
          tripId: params.tripId,
          blockId: params.blockId,
          activityId: params.activityId,
          memberIdToVoteFor: params.memberIdToVoteFor,
        },
        headers: {
          "x-client-mutation-id": clientMutationId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch votes for this block
      queryClient.invalidateQueries({
        queryKey: ["votes", variables.blockId],
      });

      // Also invalidate block proposals to update vote counts
      queryClient.invalidateQueries({
        queryKey: ["proposals", variables.blockId],
      });
    },
  });
}

export function useVoteRemove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; blockId: string; activityId: string; memberId: string }) => {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("trip_id", params.tripId)
        .eq("block_id", params.blockId)
        .eq("activity_id", params.activityId)
        .eq("member_id", params.memberId);

      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch votes for this block
      queryClient.invalidateQueries({
        queryKey: ["votes", variables.blockId],
      });

      // Also invalidate block proposals to update vote counts
      queryClient.invalidateQueries({
        queryKey: ["proposals", variables.blockId],
      });
    },
  });
}
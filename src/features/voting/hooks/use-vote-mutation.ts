import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

interface VoteCastParams {
  tripId: string;
  blockId: string;
  activityId: string;
  memberId: string;
}

export function useVoteCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VoteCastParams) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("votes")
        .insert({
          trip_id: params.tripId,
          block_id: params.blockId,
          activity_id: params.activityId,
          member_id: params.memberId || null,
          client_mutation_id: clientMutationId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
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
    mutationFn: async (params: {
      tripId: string;
      blockId: string;
      activityId: string;
      memberId: string;
    }) => {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("trip_id", params.tripId)
        .eq("block_id", params.blockId)
        .eq("activity_id", params.activityId)
        .eq("member_id", params.memberId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
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

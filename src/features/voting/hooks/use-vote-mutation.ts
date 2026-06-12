"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

interface VoteCastParams {
  tripId: string;
  blockId: string;
  activityId: string;
  memberId: string;
}

function invalidateVoteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  blockId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["votes", blockId] });
  // Proposal queries embed vote counts
  queryClient.invalidateQueries({ queryKey: ["block-proposals", blockId] });
}

export function useVoteCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VoteCastParams) => {
      if (!params.memberId) {
        throw new Error("You must be a trip member to vote");
      }

      const clientMutationId = nanoid();

      // Upsert keyed on the unique (block, activity, member) constraint so a
      // member can never double-vote the same activity (FR-301).
      const { data, error } = await supabase
        .from("votes")
        .upsert(
          {
            trip_id: params.tripId,
            block_id: params.blockId,
            activity_id: params.activityId,
            member_id: params.memberId,
            client_mutation_id: clientMutationId,
          },
          { onConflict: "block_id,activity_id,member_id" },
        )
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateVoteQueries(queryClient, variables.blockId);
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
      invalidateVoteQueries(queryClient, variables.blockId);
    },
  });
}

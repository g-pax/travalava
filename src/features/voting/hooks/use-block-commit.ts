import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

interface BlockCommitParams {
  tripId: string;
  blockId: string;
  activityId?: string; // For manual tie-breaking
}

interface BlockCommitResult {
  success: boolean;
  commit?: any;
  voteTally?: Array<{
    activityId: string;
    activityTitle: string;
    voteCount: number;
  }>;
  duplicatePolicy?: string;
  error?: string;
  message?: string;
  tiedActivities?: Array<{
    activityId: string;
    activityTitle: string;
    voteCount: number;
  }>;
}

export function useBlockCommit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: BlockCommitParams,
    ): Promise<BlockCommitResult> => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase.functions.invoke("block-commit", {
        body: {
          tripId: params.tripId,
          blockId: params.blockId,
          activityId: params.activityId,
        },
        headers: {
          "x-client-mutation-id": clientMutationId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["votes", variables.blockId],
      });

      queryClient.invalidateQueries({
        queryKey: ["proposals", variables.blockId],
      });

      queryClient.invalidateQueries({
        queryKey: ["commits", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["days", variables.tripId],
      });

      // If soft_block duplicate policy, invalidate all proposals for the trip
      if (data.duplicatePolicy === "soft_block") {
        queryClient.invalidateQueries({
          queryKey: ["proposals"],
        });
      }
    },
  });
}

export function useCommits(tripId: string) {
  return useQuery({
    queryKey: ["commits", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commits")
        .select(`
          *,
          activity:activities!commits_activity_id_fkey(
            id,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            notes,
            location
          ),
          committed_by_member:trip_members!commits_committed_by_fkey(
            id,
            display_name,
            role
          )
        `)
        .eq("trip_id", tripId)
        .order("committed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId,
  });
}

export function useBlockCommitQuery(blockId: string) {
  return useQuery({
    queryKey: ["commit", blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commits")
        .select(`
          *,
          activity:activities!commits_activity_id_fkey(
            id,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            notes,
            location
          ),
          committed_by_member:trip_members!commits_committed_by_fkey(
            id,
            display_name,
            role
          )
        `)
        .eq("block_id", blockId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!blockId,
  });
}

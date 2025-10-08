/**
 * React Query hooks for block proposal management
 * - Assign/remove activities to/from blocks
 * - Fetch proposals for blocks and activities
 * - Handle proposal conflicts and validations
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface BlockProposal {
  id: string;
  trip_id: string;
  block_id: string;
  activity_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  activity?: {
    id: string;
    title: string;
    category: string | null;
    cost_amount: number | null;
    cost_currency: string | null;
    duration_min: number | null;
    notes: string | null;
    link: string | null;
    // biome-ignore lint/suspicious/noExplicitAny: its ok here
    location: any;
  };
}

/**
 * Fetch all proposals for a specific block
 */
export function useBlockProposals(blockId: string) {
  return useQuery({
    queryKey: ["block-proposals", blockId],
    queryFn: async (): Promise<BlockProposal[]> => {
      const { data, error } = await supabase
        .from("block_proposals")
        .select(`
          *,
          activity:activities (
            id,
            src,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            notes,
            link,
            location
          )
        `)
        .eq("block_id", blockId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch block proposals: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!blockId,
  });
}

/**
 * Fetch all proposals for a trip (useful for activity management)
 */
export function useTripProposals(tripId: string) {
  return useQuery({
    queryKey: ["trip-proposals", tripId],
    queryFn: async (): Promise<BlockProposal[]> => {
      const { data, error } = await supabase
        .from("block_proposals")
        .select(`
          *,
          activity:activities (
            id,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            notes,
            link,
            location
          )
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch trip proposals: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!tripId,
  });
}

/**
 * Fetch all blocks where an activity is proposed
 */
export function useActivityProposals(activityId: string) {
  return useQuery({
    queryKey: ["activity-proposals", activityId],
    queryFn: async (): Promise<BlockProposal[]> => {
      const { data, error } = await supabase
        .from("block_proposals")
        .select(`
          *,
          block:blocks (
            id,
            label,
            position,
            day:days (
              id,
              date
            )
          )
        `)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch activity proposals: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!activityId,
  });
}

/**
 * Create a new proposal (assign activity to block)
 */
export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      blockId,
      activityId,
      createdBy,
      clientMutationId,
    }: {
      tripId: string;
      blockId: string;
      activityId: string;
      createdBy: string;
      clientMutationId?: string;
    }) => {
      const mutationId = clientMutationId || nanoid();

      // Check if proposal already exists
      const { data: existing } = await supabase
        .from("block_proposals")
        .select("id")
        .eq("block_id", blockId)
        .eq("activity_id", activityId)
        .maybeSingle();

      if (existing) {
        throw new Error("Activity is already proposed for this block");
      }

      const { data, error } = await supabase
        .from("block_proposals")
        .insert([
          {
            trip_id: tripId,
            block_id: blockId,
            activity_id: activityId,
            created_by: createdBy,
            client_mutation_id: mutationId,
          },
        ])
        .select(`
          *,
          activity:activities (
            id,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            notes,
            link,
            location
          )
        `)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to create proposal: ${error.message}`);
      }

      return data;
    },
    // onMutate: async ({ blockId, activityId, tripId, createdBy }) => {
    //   // Cancel outgoing refetches
    //   await queryClient.cancelQueries({
    //     queryKey: ["block-proposals", blockId],
    //   });
    //   await queryClient.cancelQueries({ queryKey: ["trip-proposals", tripId] });
    //   await queryClient.cancelQueries({
    //     queryKey: ["activity-proposals", activityId],
    //   });

    //   // Snapshot previous values
    //   const previousBlockProposals = queryClient.getQueryData<BlockProposal[]>([
    //     "block-proposals",
    //     blockId,
    //   ]);
    //   const previousTripProposals = queryClient.getQueryData<BlockProposal[]>([
    //     "trip-proposals",
    //     tripId,
    //   ]);
    //   const previousActivityProposals = queryClient.getQueryData<
    //     BlockProposal[]
    //   >(["activity-proposals", activityId]);

    //   // Create optimistic proposal
    //   const optimisticProposal: BlockProposal = {
    //     id: `temp-${nanoid()}`,
    //     trip_id: tripId,
    //     block_id: blockId,
    //     activity_id: activityId,
    //     created_by: createdBy,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   };

    //   // Optimistically update caches
    //   if (previousBlockProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["block-proposals", blockId],
    //       [...previousBlockProposals, optimisticProposal],
    //     );
    //   }

    //   if (previousTripProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["trip-proposals", tripId],
    //       [...previousTripProposals, optimisticProposal],
    //     );
    //   }

    //   if (previousActivityProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["activity-proposals", activityId],
    //       [...previousActivityProposals, optimisticProposal],
    //     );
    //   }

    //   return {
    //     previousBlockProposals,
    //     previousTripProposals,
    //     previousActivityProposals,
    //   };
    // },
    // onError: (error, { blockId, tripId, activityId }, context) => {
    //   // Rollback optimistic updates
    //   if (context?.previousBlockProposals) {
    //     queryClient.setQueryData(
    //       ["block-proposals", blockId],
    //       context.previousBlockProposals,
    //     );
    //   }
    //   if (context?.previousTripProposals) {
    //     queryClient.setQueryData(
    //       ["trip-proposals", tripId],
    //       context.previousTripProposals,
    //     );
    //   }
    //   if (context?.previousActivityProposals) {
    //     queryClient.setQueryData(
    //       ["activity-proposals", activityId],
    //       context.previousActivityProposals,
    //     );
    //   }
    //   toast.error(error.message || "Failed to add proposal");
    // },
    onSuccess: (_data, { blockId, tripId, activityId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["block-proposals", blockId] });
      queryClient.invalidateQueries({ queryKey: ["trip-proposals", tripId] });
      queryClient.invalidateQueries({
        queryKey: ["activity-proposals", activityId],
      });
      // Invalidate activities cache since proposals are now included in the activity data
      queryClient.invalidateQueries({ queryKey: ["activities", tripId] });
      queryClient.invalidateQueries({ queryKey: ["activity", activityId] });
      toast.success("Activity added to block");
    },
  });
}

/**
 * Remove a proposal (unassign activity from block)
 */
export function useRemoveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      clientMutationId,
    }: {
      proposalId: string;
      clientMutationId?: string;
    }) => {
      const mutationId = clientMutationId || nanoid();

      // Get proposal details before deletion
      const { data: proposal } = await supabase
        .from("block_proposals")
        .select("block_id, trip_id, activity_id")
        .eq("id", proposalId)
        .maybeSingle();

      if (!proposal) {
        throw new Error("Proposal not found");
      }

      // Check if the block is committed
      const { data: commit } = await supabase
        .from("commits")
        .select("id")
        .eq("block_id", proposal.block_id)
        .maybeSingle();

      if (commit) {
        throw new Error("Cannot remove proposal from committed block");
      }

      const { error } = await supabase
        .from("block_proposals")
        .delete()
        .eq("id", proposalId);

      if (error) {
        throw new Error(`Failed to remove proposal: ${error.message}`);
      }

      return { proposalId, ...proposal, clientMutationId: mutationId };
    },
    // onMutate: async ({ proposalId }) => {
    //   // Find the proposal in caches to get its details
    //   const allQueries = queryClient.getQueriesData({
    //     queryKey: ["block-proposals"],
    //   });
    //   let proposal: BlockProposal | undefined;

    //   for (const [_key, data] of allQueries) {
    //     if (Array.isArray(data)) {
    //       proposal = data.find((p: BlockProposal) => p.id === proposalId);
    //       if (proposal) {
    //         break;
    //       }
    //     }
    //   }

    //   if (!proposal) return;

    //   // Cancel outgoing refetches
    //   await queryClient.cancelQueries({
    //     queryKey: ["block-proposals", proposal.block_id],
    //   });
    //   await queryClient.cancelQueries({
    //     queryKey: ["trip-proposals", proposal.trip_id],
    //   });
    //   await queryClient.cancelQueries({
    //     queryKey: ["activity-proposals", proposal.activity_id],
    //   });

    //   // Snapshot previous values
    //   const previousBlockProposals = queryClient.getQueryData<BlockProposal[]>([
    //     "block-proposals",
    //     proposal.block_id,
    //   ]);
    //   const previousTripProposals = queryClient.getQueryData<BlockProposal[]>([
    //     "trip-proposals",
    //     proposal.trip_id,
    //   ]);
    //   const previousActivityProposals = queryClient.getQueryData<
    //     BlockProposal[]
    //   >(["activity-proposals", proposal.activity_id]);

    //   // Optimistically remove
    //   if (previousBlockProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["block-proposals", proposal.block_id],
    //       previousBlockProposals.filter((p) => p.id !== proposalId),
    //     );
    //   }

    //   if (previousTripProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["trip-proposals", proposal.trip_id],
    //       previousTripProposals.filter((p) => p.id !== proposalId),
    //     );
    //   }

    //   if (previousActivityProposals) {
    //     queryClient.setQueryData<BlockProposal[]>(
    //       ["activity-proposals", proposal.activity_id],
    //       previousActivityProposals.filter((p) => p.id !== proposalId),
    //     );
    //   }

    //   return {
    //     proposal,
    //     previousBlockProposals,
    //     previousTripProposals,
    //     previousActivityProposals,
    //   };
    // },
    // onError: (error, _ctx, context) => {
    //   if (!context?.proposal) return;

    //   // Rollback optimistic updates
    //   if (context.previousBlockProposals) {
    //     queryClient.setQueryData(
    //       ["block-proposals", context.proposal.block_id],
    //       context.previousBlockProposals,
    //     );
    //   }
    //   if (context.previousTripProposals) {
    //     queryClient.setQueryData(
    //       ["trip-proposals", context.proposal.trip_id],
    //       context.previousTripProposals,
    //     );
    //   }
    //   if (context.previousActivityProposals) {
    //     queryClient.setQueryData(
    //       ["activity-proposals", context.proposal.activity_id],
    //       context.previousActivityProposals,
    //     );
    //   }

    //   toast.error(error.message || "Failed to remove proposal");
    // },
    // onSuccess: (_data, _ctx, context) => {
    //   if (!context?.proposal) return;

    //   // Invalidate relevant queries
    //   queryClient.invalidateQueries({
    //     queryKey: ["block-proposals", context.proposal.block_id],
    //   });
    //   queryClient.invalidateQueries({
    //     queryKey: ["trip-proposals", context.proposal.trip_id],
    //   });
    //   queryClient.invalidateQueries({
    //     queryKey: ["activity-proposals", context.proposal.activity_id],
    //   });
    //   // Invalidate activities cache since proposals are now included in the activity data
    //   queryClient.invalidateQueries({
    //     queryKey: ["activities", context.proposal.trip_id],
    //   });
    //   queryClient.invalidateQueries({
    //     queryKey: ["activity", context.proposal.activity_id],
    //   });
    //   toast.success("Proposal removed");
    // },
  });
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Commit = Database["public"]["Tables"]["commits"]["Row"];
type Trip = Database["public"]["Tables"]["trips"]["Row"];

interface BlockCommitParams {
  tripId: string;
  blockId: string;
  activityId?: string; // For manual tie-breaking
  confirmDuplicate?: boolean; // To bypass soft_block warning
}

interface VoteTally {
  activityId: string;
  activityTitle: string;
  voteCount: number;
}

interface BlockCommitResult {
  success: boolean;
  commit?: Commit & {
    activity: {
      id: string;
      title: string;
      category: string | null;
      cost_amount: number | null;
      cost_currency: string | null;
      duration_min: number | null;
      notes: string | null;
      // biome-ignore lint/suspicious/noExplicitAny: its ok here
      location: any | null;
    };
  };
  voteTally?: VoteTally[];
  duplicatePolicy?: Trip["duplicate_policy"];
  error?: string;
  message?: string;
  tiedActivities?: VoteTally[];
  existingCommits?: Array<{
    blockId: string;
    blockLabel: string;
    dayDate: string;
  }>;
}

interface Vote {
  id: string;
  activity_id: string;
  activity: {
    id: string;
    title: string;
  } | null;
}

export function useBlockCommit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: BlockCommitParams,
    ): Promise<BlockCommitResult> => {
      const {
        tripId,
        blockId,
        activityId: manualActivityId,
        confirmDuplicate = false,
      } = params;

      // Step 1: Get current user's member record to verify they're an organizer
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("You must be logged in to commit activities");
      }

      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .select("id, role")
        .eq("trip_id", tripId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        throw new Error("You are not a member of this trip");
      }
      if (member.role !== "organizer") {
        throw new Error("Only organizers can commit activities");
      }

      // Step 2: Get trip info for duplicate policy
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("duplicate_policy")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;

      // Step 3: Check if block already has a commit
      const { data: existingCommit, error: existingCommitError } =
        await supabase
          .from("commits")
          .select("id")
          .eq("block_id", blockId)
          .maybeSingle();

      if (existingCommitError) throw existingCommitError;
      if (existingCommit) {
        throw new Error("This block already has a committed activity");
      }

      // Step 4: Fetch all votes for this block with activity details
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select(`
          id,
          activity_id,
          activity:activities!votes_activity_id_fkey(
            id,
            title
          )
        `)
        .eq("block_id", blockId);

      if (votesError) throw votesError;

      // Step 5: Calculate vote tally
      const tallyMap = (votes as unknown as Vote[]).reduce(
        (acc, vote) => {
          const activityId = vote.activity_id;
          if (!acc[activityId]) {
            acc[activityId] = {
              activityId,
              activityTitle: vote.activity?.title || "Unknown",
              voteCount: 0,
            };
          }
          acc[activityId].voteCount++;
          return acc;
        },
        {} as Record<string, VoteTally>,
      );

      const voteTally = Object.values(tallyMap).sort(
        (a, b) => b.voteCount - a.voteCount,
      );

      // Step 6: Determine winning activity
      let winningActivityId: string;

      if (manualActivityId) {
        // Manual tie-breaking: use the provided activity ID
        winningActivityId = manualActivityId;
      } else {
        // Automatic: use the highest voted activity
        if (voteTally.length === 0) {
          throw new Error(
            "No votes found for this block. Cannot commit without votes.",
          );
        }

        const topVoteCount = voteTally[0].voteCount;
        const tiedActivities = voteTally.filter(
          (t) => t.voteCount === topVoteCount,
        );

        if (tiedActivities.length > 1) {
          // Tie detected - return without committing
          return {
            success: false,
            message: "Manual tie-breaking required",
            tiedActivities,
            voteTally,
            duplicatePolicy: trip.duplicate_policy,
          };
        }

        winningActivityId = voteTally[0].activityId;
      }

      // Step 7: Check for duplicate commits (if policy requires)
      if (trip.duplicate_policy !== "allow") {
        const { data: existingCommits, error: existingCommitsError } =
          await supabase
            .from("commits")
            .select(`
              id,
              block_id,
              blocks!commits_block_id_fkey(
                id,
                label,
                days!blocks_day_id_fkey(
                  date
                )
              )
            `)
            .eq("trip_id", tripId)
            .eq("activity_id", winningActivityId);

        if (existingCommitsError) throw existingCommitsError;

        if (existingCommits && existingCommits.length > 0) {
          // biome-ignore lint/suspicious/noExplicitAny: its ok here
          const commitDetails = existingCommits.map((c: any) => ({
            blockId: c.block_id,
            blockLabel: c.blocks?.label || "Unknown",
            dayDate: c.blocks?.days?.date || "Unknown",
          }));

          if (trip.duplicate_policy === "prevent") {
            // "prevent" policy: always block duplicates
            return {
              success: false,
              error: "Duplicate activity not allowed",
              message:
                "This activity is already committed to another block. Your trip's duplicate policy prevents scheduling the same activity multiple times.",
              existingCommits: commitDetails,
              voteTally,
              duplicatePolicy: trip.duplicate_policy,
            };
          }

          // "soft_block" policy: warn unless user confirmed
          if (trip.duplicate_policy === "soft_block" && !confirmDuplicate) {
            return {
              success: false,
              message: "Duplicate activity warning",
              existingCommits: commitDetails,
              voteTally,
              duplicatePolicy: trip.duplicate_policy,
            };
          }
          // If confirmDuplicate is true, we proceed with the commit below
        }
      }

      // Step 8: Create the commit
      const { data: newCommit, error: commitError } = await supabase
        .from("commits")
        .insert({
          trip_id: tripId,
          block_id: blockId,
          activity_id: winningActivityId,
          committed_by: member.id,
        })
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
          )
        `)
        .single();

      if (commitError) throw commitError;

      // Step 9: Handle duplicate policy post-commit actions (FR-403).
      // Under "prevent" the activity can never be committed elsewhere, so
      // its other-block proposals are dead weight — remove them. Under
      // "soft_block" the user may still intentionally schedule it again,
      // so proposals are left in place.
      if (trip.duplicate_policy === "prevent") {
        const { error: removeProposalsError } = await supabase
          .from("block_proposals")
          .delete()
          .eq("trip_id", tripId)
          .eq("activity_id", winningActivityId)
          .neq("block_id", blockId);

        // Don't fail the commit if cleanup fails; lists refetch anyway.
        if (removeProposalsError) {
          console.warn(
            "Failed to remove duplicate proposals:",
            removeProposalsError.message,
          );
        }
      }

      return {
        success: true,
        // biome-ignore lint/suspicious/noExplicitAny: its ok here
        commit: newCommit as any,
        voteTally,
        duplicatePolicy: trip.duplicate_policy,
        message: "Activity committed successfully",
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["votes", variables.blockId],
      });
      queryClient.invalidateQueries({
        queryKey: ["block-proposals", variables.blockId],
      });
      // Drives CommitPanel/BlockCard committed state
      queryClient.invalidateQueries({
        queryKey: ["commit", variables.blockId],
      });
      queryClient.invalidateQueries({
        queryKey: ["commits", variables.tripId],
      });
      // Drives the Final Itinerary tab
      queryClient.invalidateQueries({
        queryKey: ["committed-blocks", variables.tripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["days", variables.tripId],
      });

      // Cross-block proposal cleanup ran under the "prevent" policy
      if (data.duplicatePolicy === "prevent") {
        queryClient.invalidateQueries({ queryKey: ["block-proposals"] });
        queryClient.invalidateQueries({
          queryKey: ["trip-proposals", variables.tripId],
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

export function useCommittedBlocks(tripId: string) {
  return useQuery({
    queryKey: ["committed-blocks", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commits")
        .select(`
          block_id,
          activity:activities!commits_activity_id_fkey(
            id,
            title,
            category,
            cost_amount,
            cost_currency,
            duration_min,
            location,
            notes
          ),
          blocks!commits_block_id_fkey(
            id,
            label,
            position,
            days!blocks_day_id_fkey(
              date
            )
          )
        `)
        .eq("trip_id", tripId);

      if (error) throw error;

      // Transform the data to match our component expectations, ordered by
      // day then block position (commit order is meaningless for display).
      // Date-only strings get a T00:00:00 suffix so they parse as local time
      // instead of UTC (which renders the previous day west of UTC).
      return (
        (data || [])
          // biome-ignore lint/suspicious/noExplicitAny: embedded join shape
          .map((commit: any) => ({
            id: commit.block_id,
            label: commit.blocks?.label || "Unknown",
            position: commit.blocks?.position ?? 0,
            dayDate: commit.blocks?.days?.date || "",
            dayLabel: commit.blocks?.days?.date
              ? new Date(
                  `${commit.blocks.days.date}T00:00:00`,
                ).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Unknown",
            activity: {
              id: commit.activity?.id || "",
              title: commit.activity?.title || "Unknown",
              category: commit.activity?.category,
              cost_amount: commit.activity?.cost_amount,
              cost_currency: commit.activity?.cost_currency,
              duration_min: commit.activity?.duration_min,
              location: commit.activity?.location,
              notes: commit.activity?.notes,
            },
          }))
          .sort(
            (a, b) =>
              a.dayDate.localeCompare(b.dayDate) || a.position - b.position,
          )
      );
    },
    enabled: !!tripId,
  });
}

export function useBlockCommitQuery(blockId: string) {
  return useQuery({
    queryKey: ["commit", blockId],
    queryFn: async () => {
      if (!blockId) {
        throw new Error("Block ID is required");
      }

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
    enabled: !!blockId && blockId !== "undefined" && blockId !== "null",
  });
}

export function useBlockUncommit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; blockId: string }) => {
      const { tripId, blockId } = params;

      // Step 1: Get current user's member record to verify they're an organizer
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("You must be logged in to uncommit activities");
      }

      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .select("id, role")
        .eq("trip_id", tripId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        throw new Error("You are not a member of this trip");
      }
      if (member.role !== "organizer") {
        throw new Error("Only organizers can uncommit activities");
      }

      // Step 2: Check if block has a commit
      const { data: existingCommit, error: existingCommitError } =
        await supabase
          .from("commits")
          .select("id, activity_id")
          .eq("block_id", blockId)
          .maybeSingle();

      if (existingCommitError) throw existingCommitError;
      if (!existingCommit) {
        throw new Error("This block doesn't have a committed activity");
      }

      // Step 3: Delete the commit
      const { error: deleteError } = await supabase
        .from("commits")
        .delete()
        .eq("block_id", blockId);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: "Activity uncommitted successfully",
        activityId: existingCommit.activity_id,
      };
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["commit", variables.blockId],
      });

      queryClient.invalidateQueries({
        queryKey: ["commits", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["committed-blocks", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["days", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["block-proposals", variables.blockId],
      });
    },
  });
}

export function useBlockSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tripId: string;
      blockId1: string;
      blockId2: string;
    }) => {
      const { tripId, blockId1, blockId2 } = params;

      // Step 1: Get current user's member record to verify they're an organizer
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("You must be logged in to swap activities");
      }

      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .select("id, role")
        .eq("trip_id", tripId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        throw new Error("You are not a member of this trip");
      }
      if (member.role !== "organizer") {
        throw new Error("Only organizers can swap activities");
      }

      // Step 2: Get both commits
      const [
        { data: commit1, error: commit1Error },
        { data: commit2, error: commit2Error },
      ] = await Promise.all([
        supabase
          .from("commits")
          .select("id, activity_id, committed_by, committed_at")
          .eq("block_id", blockId1)
          .maybeSingle(),
        supabase
          .from("commits")
          .select("id, activity_id, committed_by, committed_at")
          .eq("block_id", blockId2)
          .maybeSingle(),
      ]);

      if (commit1Error) throw commit1Error;
      if (commit2Error) throw commit2Error;

      if (!commit1 || !commit2) {
        throw new Error("Both blocks must have committed activities to swap");
      }

      // Step 3: Swap atomically in the database (single transaction with a
      // deferred unique constraint — a client-side multi-step swap can
      // corrupt the itinerary if it fails midway).
      const { error: swapError } = await supabase.rpc("swap_block_commits", {
        p_block_a: blockId1,
        p_block_b: blockId2,
      });

      if (swapError) {
        throw new Error(`Failed to swap activities: ${swapError.message}`);
      }

      return {
        success: true,
        message: "Activities swapped successfully",
      };
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries for both blocks
      queryClient.invalidateQueries({
        queryKey: ["commit", variables.blockId1],
      });

      queryClient.invalidateQueries({
        queryKey: ["commit", variables.blockId2],
      });

      queryClient.invalidateQueries({
        queryKey: ["commits", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["committed-blocks", variables.tripId],
      });

      queryClient.invalidateQueries({
        queryKey: ["days", variables.tripId],
      });
    },
  });
}

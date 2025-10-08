import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Vote {
  id: string;
  trip_id: string;
  block_id: string;
  activity_id: string;
  member_id: string;
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    display_name: string;
    role: string;
  };
  activity?: {
    id: string;
    title: string;
    category?: string;
  };
}

export function useVotes(blockId: string) {
  return useQuery({
    queryKey: ["votes", blockId],
    queryFn: async (): Promise<Vote[]> => {
      if (!blockId) {
        throw new Error("Block ID is required");
      }

      const { data, error } = await supabase
        .from("votes")
        .select(`
          *,
          member:trip_members!votes_member_id_fkey(
            id,
            display_name,
            role
          ),
          activity:activities!votes_activity_id_fkey(
            id,
            title,
            category
          )
        `)
        .eq("block_id", blockId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!blockId && blockId !== "undefined" && blockId !== "null",
  });
}

export function useVoteTally(blockId: string) {
  const { data: votes = [], ...queryResult } = useVotes(blockId);

  const tally = votes.reduce(
    (acc, vote) => {
      const key = vote.activity_id;
      if (!acc[key]) {
        acc[key] = {
          activityId: vote.activity_id,
          activityTitle: vote.activity?.title || "Unknown",
          activityCategory: vote.activity?.category,
          votes: [],
          voteCount: 0,
        };
      }
      acc[key].votes.push(vote);
      acc[key].voteCount++;
      return acc;
    },
    {} as Record<
      string,
      {
        activityId: string;
        activityTitle: string;
        activityCategory?: string;
        votes: Vote[];
        voteCount: number;
      }
    >,
  );

  const sortedTally = Object.values(tally).sort(
    (a, b) => b.voteCount - a.voteCount,
  );

  return {
    ...queryResult,
    data: votes,
    tally: sortedTally,
    totalVotes: votes.length,
    uniqueVoters: new Set(votes.map((v) => v.member_id)).size,
  };
}

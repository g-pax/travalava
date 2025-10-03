/**
 * Edge function for committing block results.
 * Tallies votes, handles ties (requires manual activity selection), enforces duplicate policy.
 *
 * Inputs: { tripId, blockId, activityId? } (activityId required for tie-breaking)
 * Outputs: Commit record with winning activity
 * RLS: Ensures user is trip organizer
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BlockCommitRequest {
  tripId: string;
  blockId: string;
  activityId?: string; // Required for manual tie-breaking
}

interface VoteTally {
  activityId: string;
  activityTitle: string;
  voteCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client with user's auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { tripId, blockId, activityId }: BlockCommitRequest = await req.json();

    if (!tripId || !blockId) {
      throw new Error("Missing required fields: tripId, blockId");
    }

    // Verify user is organizer of this trip
    const { data: memberData, error: memberError } = await supabase
      .from("trip_members")
      .select("id, role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData || memberData.role !== "organizer") {
      throw new Error("Only trip organizers can commit blocks");
    }

    // Check if block is already committed
    const { data: existingCommit, error: commitCheckError } = await supabase
      .from("commits")
      .select("id, activity_id")
      .eq("block_id", blockId)
      .maybeSingle();

    if (commitCheckError) {
      throw new Error("Error checking existing commits");
    }

    if (existingCommit) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Block already committed",
          commit: existingCommit
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get trip's duplicate policy
    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .select("duplicate_policy")
      .eq("id", tripId)
      .single();

    if (tripError || !tripData) {
      throw new Error("Trip not found");
    }

    // Get all votes for this block and tally them
    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select(`
        activity_id,
        activities!inner(title)
      `)
      .eq("block_id", blockId);

    if (votesError) {
      throw new Error("Error fetching votes");
    }

    // Tally votes
    const voteTally: Record<string, VoteTally> = {};

    for (const vote of votesData) {
      if (!voteTally[vote.activity_id]) {
        voteTally[vote.activity_id] = {
          activityId: vote.activity_id,
          activityTitle: vote.activities.title,
          voteCount: 0,
        };
      }
      voteTally[vote.activity_id].voteCount++;
    }

    const talliedVotes = Object.values(voteTally).sort((a, b) => b.voteCount - a.voteCount);

    let winningActivityId: string;

    if (talliedVotes.length === 0) {
      throw new Error("No votes found for this block");
    }

    // Handle tie-breaking
    const topVoteCount = talliedVotes[0].voteCount;
    const tiedActivities = talliedVotes.filter(v => v.voteCount === topVoteCount);

    if (tiedActivities.length > 1) {
      // There's a tie - require manual selection
      if (!activityId) {
        return new Response(
          JSON.stringify({
            error: "Tie detected",
            message: "Multiple activities tied for most votes. Please specify activityId to break the tie.",
            tiedActivities: tiedActivities.map(t => ({
              activityId: t.activityId,
              activityTitle: t.activityTitle,
              voteCount: t.voteCount
            }))
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409, // Conflict status code for tie
          }
        );
      }

      // Verify the manually selected activity is actually tied for first
      const selectedActivity = tiedActivities.find(t => t.activityId === activityId);
      if (!selectedActivity) {
        throw new Error("Selected activity is not among the tied winners");
      }

      winningActivityId = activityId;
    } else {
      winningActivityId = talliedVotes[0].activityId;
    }

    // Enforce duplicate policy
    if (tripData.duplicate_policy !== "allow") {
      // Check if this activity is already committed elsewhere
      const { data: existingCommits, error: duplicateCheckError } = await supabase
        .from("commits")
        .select("id, block_id")
        .eq("trip_id", tripId)
        .eq("activity_id", winningActivityId);

      if (duplicateCheckError) {
        throw new Error("Error checking for duplicate activities");
      }

      if (existingCommits && existingCommits.length > 0) {
        if (tripData.duplicate_policy === "prevent") {
          throw new Error(`Activity is already scheduled in another block. Duplicate policy: prevent.`);
        }
        // For soft_block, we'll proceed but could add a warning
      }
    }

    // Create the commit
    const { data: commitData, error: commitError } = await supabase
      .from("commits")
      .insert({
        trip_id: tripId,
        block_id: blockId,
        activity_id: winningActivityId,
        committed_by: memberData.id,
        client_mutation_id: req.headers.get("x-client-mutation-id") || undefined,
      })
      .select(`
        *,
        activities(title, category, cost_amount, cost_currency)
      `)
      .single();

    if (commitError) {
      // If it's a duplicate key error, that's actually success (idempotency)
      if (commitError.code === "23505") { // Unique constraint violation
        return new Response(
          JSON.stringify({ success: true, message: "Block already committed" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      throw commitError;
    }

    // If duplicate policy is soft_block, mark other proposals as "already scheduled"
    if (tripData.duplicate_policy === "soft_block") {
      // Update other proposals of the same activity to mark them as soft-blocked
      await supabase
        .from("block_proposals")
        .update({
          updated_at: new Date().toISOString(),
          // Note: We'd need to add a status field to track soft-blocked proposals
        })
        .eq("trip_id", tripId)
        .eq("activity_id", winningActivityId)
        .neq("block_id", blockId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        commit: commitData,
        voteTally: talliedVotes,
        duplicatePolicy: tripData.duplicate_policy
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Block commit error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
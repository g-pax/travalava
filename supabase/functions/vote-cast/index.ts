/**
 * Edge function for casting votes on block proposals.
 * Validates voting window and enforces one vote per member per activity in a block.
 *
 * Inputs: { tripId, blockId, activityId, memberIdToVoteFor }
 * Outputs: Success or error response
 * RLS: Ensures user is trip member and voting window is open
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface VoteCastRequest {
  tripId: string;
  blockId: string;
  activityId: string;
  memberIdToVoteFor?: string; // For voting on behalf of someone else (if organizer)
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
    const { tripId, blockId, activityId, memberIdToVoteFor }: VoteCastRequest = await req.json();

    if (!tripId || !blockId || !activityId) {
      throw new Error("Missing required fields: tripId, blockId, activityId");
    }

    // Get the member record for the user
    const { data: memberData, error: memberError } = await supabase
      .from("trip_members")
      .select("id, role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      throw new Error("User is not a member of this trip");
    }

    // Determine which member ID to use for the vote
    let votingMemberId = memberData.id;
    if (memberIdToVoteFor) {
      // Only organizers can vote on behalf of others
      if (memberData.role !== "organizer") {
        throw new Error("Only organizers can vote on behalf of others");
      }
      votingMemberId = memberIdToVoteFor;
    }

    // Check if voting window is open for this block
    const { data: blockData, error: blockError } = await supabase
      .from("blocks")
      .select("vote_open_ts, vote_close_ts")
      .eq("id", blockId)
      .single();

    if (blockError || !blockData) {
      throw new Error("Block not found");
    }

    const now = new Date();
    const voteOpenTs = blockData.vote_open_ts ? new Date(blockData.vote_open_ts) : null;
    const voteCloseTs = blockData.vote_close_ts ? new Date(blockData.vote_close_ts) : null;

    if (voteOpenTs && now < voteOpenTs) {
      throw new Error("Voting has not started yet for this block");
    }

    if (voteCloseTs && now > voteCloseTs) {
      throw new Error("Voting has ended for this block");
    }

    // Check if block is already committed
    const { data: commitData, error: commitError } = await supabase
      .from("commits")
      .select("id")
      .eq("block_id", blockId)
      .maybeSingle();

    if (commitError) {
      throw new Error("Error checking commit status");
    }

    if (commitData) {
      throw new Error("This block has already been committed");
    }

    // Check if proposal exists
    const { data: proposalData, error: proposalError } = await supabase
      .from("block_proposals")
      .select("id")
      .eq("block_id", blockId)
      .eq("activity_id", activityId)
      .single();

    if (proposalError || !proposalData) {
      throw new Error("Proposal does not exist for this block and activity");
    }

    // Insert or update the vote (upsert)
    const { data: voteData, error: voteError } = await supabase
      .from("votes")
      .upsert({
        trip_id: tripId,
        block_id: blockId,
        activity_id: activityId,
        member_id: votingMemberId,
        client_mutation_id: req.headers.get("x-client-mutation-id") || undefined,
      })
      .select()
      .single();

    if (voteError) {
      // If it's a duplicate key error, that's actually success (idempotency)
      if (voteError.code === "23505") { // Unique constraint violation
        return new Response(
          JSON.stringify({ success: true, message: "Vote already cast" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      throw voteError;
    }

    return new Response(
      JSON.stringify({ success: true, vote: voteData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Vote cast error:", error);
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
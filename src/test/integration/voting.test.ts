import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// These tests require a running Supabase instance with the correct schema
// They are meant to be run against a test database, not production

const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data IDs that will be created during setup
let testTripId: string;
let testMemberId: string;
let testActivityId: string;
let testBlockId: string;
let testDayId: string;

describe("Voting Integration Tests", () => {
  beforeAll(async () => {
    // Set up test data
    // Note: In a real test environment, you'd want to use a test database
    // and clean up after each test run

    // Create test trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name: "Test Trip",
        destination_text: "Test City",
        start_date: "2025-01-01",
        end_date: "2025-01-03",
        currency: "USD",
      })
      .select()
      .single();

    if (tripError) throw tripError;
    testTripId = trip.id;

    // Create test member
    const { data: member, error: memberError } = await supabase
      .from("trip_members")
      .insert({
        trip_id: testTripId,
        role: "organizer",
        display_name: "Test Organizer",
        user_id: "test-user-id",
      })
      .select()
      .single();

    if (memberError) throw memberError;
    testMemberId = member.id;

    // Create test day
    const { data: day, error: dayError } = await supabase
      .from("days")
      .insert({
        trip_id: testTripId,
        date: "2025-01-01",
      })
      .select()
      .single();

    if (dayError) throw dayError;
    testDayId = day.id;

    // Create test block
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .insert({
        day_id: testDayId,
        label: "Morning",
        position: 1,
        vote_open_ts: new Date("2025-01-01T00:00:00Z").toISOString(),
        vote_close_ts: new Date("2025-01-01T23:59:59Z").toISOString(),
      })
      .select()
      .single();

    if (blockError) throw blockError;
    testBlockId = block.id;

    // Create test activity
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        trip_id: testTripId,
        title: "Test Activity",
        category: "Culture",
        cost_amount: 25.0,
        cost_currency: "USD",
        duration_min: 120,
        notes: "Test activity for voting",
      })
      .select()
      .single();

    if (activityError) throw activityError;
    testActivityId = activity.id;

    // Create test proposal
    await supabase.from("block_proposals").insert({
      trip_id: testTripId,
      block_id: testBlockId,
      activity_id: testActivityId,
      created_by: testMemberId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testTripId) {
      await supabase.from("trips").delete().eq("id", testTripId);
    }
  });

  beforeEach(async () => {
    // Clean up votes and commits before each test
    await supabase.from("votes").delete().eq("trip_id", testTripId);
    await supabase.from("commits").delete().eq("trip_id", testTripId);
  });

  it("should cast a vote successfully", async () => {
    const { data, error } = await supabase.functions.invoke("vote-cast", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
        activityId: testActivityId,
      },
    });

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.vote).toBeDefined();
    expect(data.vote.trip_id).toBe(testTripId);
    expect(data.vote.block_id).toBe(testBlockId);
    expect(data.vote.activity_id).toBe(testActivityId);
  });

  it("should handle idempotent vote casting", async () => {
    // Cast the same vote twice
    const firstVote = await supabase.functions.invoke("vote-cast", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
        activityId: testActivityId,
      },
    });

    const secondVote = await supabase.functions.invoke("vote-cast", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
        activityId: testActivityId,
      },
    });

    expect(firstVote.error).toBeNull();
    expect(secondVote.error).toBeNull();
    expect(firstVote.data.success).toBe(true);
    expect(secondVote.data.success).toBe(true);

    // Verify only one vote exists
    const { data: votes } = await supabase
      .from("votes")
      .select()
      .eq("trip_id", testTripId);

    expect(votes).toHaveLength(1);
  });

  it("should commit a block with clear winner", async () => {
    // First cast a vote
    await supabase.functions.invoke("vote-cast", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
        activityId: testActivityId,
      },
    });

    // Then commit the block
    const { data, error } = await supabase.functions.invoke("block-commit", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
      },
    });

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.commit).toBeDefined();
    expect(data.commit.activity_id).toBe(testActivityId);
    expect(data.voteTally).toBeDefined();
    expect(data.voteTally).toHaveLength(1);
    expect(data.voteTally[0].voteCount).toBe(1);
  });

  it("should detect ties and require manual selection", async () => {
    // Create a second activity and proposal
    const { data: activity2 } = await supabase
      .from("activities")
      .insert({
        trip_id: testTripId,
        title: "Test Activity 2",
        category: "Outdoor",
      })
      .select()
      .single();

    await supabase.from("block_proposals").insert({
      trip_id: testTripId,
      block_id: testBlockId,
      activity_id: activity2.id,
      created_by: testMemberId,
    });

    // Create a second member and cast votes to create a tie
    const { data: member2 } = await supabase
      .from("trip_members")
      .insert({
        trip_id: testTripId,
        role: "collaborator",
        display_name: "Test Member 2",
        user_id: "test-user-2",
      })
      .select()
      .single();

    // Cast votes to create a tie
    await supabase.from("votes").insert([
      {
        trip_id: testTripId,
        block_id: testBlockId,
        activity_id: testActivityId,
        member_id: testMemberId,
      },
      {
        trip_id: testTripId,
        block_id: testBlockId,
        activity_id: activity2.id,
        member_id: member2.id,
      },
    ]);

    // Try to commit without specifying winner
    const { data } = await supabase.functions.invoke("block-commit", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
      },
    });

    expect(data.error).toBe("Tie detected");
    expect(data.tiedActivities).toHaveLength(2);
  });

  it("should handle manual tie breaking", async () => {
    // Set up the same tie scenario as above
    const { data: activity2 } = await supabase
      .from("activities")
      .insert({
        trip_id: testTripId,
        title: "Test Activity 2",
        category: "Outdoor",
      })
      .select()
      .single();

    await supabase.from("block_proposals").insert({
      trip_id: testTripId,
      block_id: testBlockId,
      activity_id: activity2.id,
      created_by: testMemberId,
    });

    const { data: member2 } = await supabase
      .from("trip_members")
      .insert({
        trip_id: testTripId,
        role: "collaborator",
        display_name: "Test Member 2",
        user_id: "test-user-2",
      })
      .select()
      .single();

    await supabase.from("votes").insert([
      {
        trip_id: testTripId,
        block_id: testBlockId,
        activity_id: testActivityId,
        member_id: testMemberId,
      },
      {
        trip_id: testTripId,
        block_id: testBlockId,
        activity_id: activity2.id,
        member_id: member2.id,
      },
    ]);

    // Now commit with manual selection
    const { data, error } = await supabase.functions.invoke("block-commit", {
      body: {
        tripId: testTripId,
        blockId: testBlockId,
        activityId: testActivityId, // Manual selection
      },
    });

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.commit.activity_id).toBe(testActivityId);
  });

  it("should prevent committing outside voting window", async () => {
    // Create a block with voting window in the past
    const { data: pastBlock } = await supabase
      .from("blocks")
      .insert({
        day_id: testDayId,
        label: "Evening",
        position: 3,
        vote_open_ts: new Date("2024-01-01T00:00:00Z").toISOString(),
        vote_close_ts: new Date("2024-01-01T23:59:59Z").toISOString(),
      })
      .select()
      .single();

    const { data } = await supabase.functions.invoke("vote-cast", {
      body: {
        tripId: testTripId,
        blockId: pastBlock.id,
        activityId: testActivityId,
      },
    });

    expect(data.error).toContain("Voting has ended");
  });
});

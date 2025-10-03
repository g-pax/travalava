import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVotes, useVoteTally } from "../use-votes";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useVotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch votes for a block", async () => {
    const mockVotes = [
      {
        id: "vote-1",
        trip_id: "trip-1",
        block_id: "block-1",
        activity_id: "activity-1",
        member_id: "member-1",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        member: {
          id: "member-1",
          display_name: "John Doe",
          role: "collaborator"
        },
        activity: {
          id: "activity-1",
          title: "Museum Visit",
          category: "Culture"
        }
      }
    ];

    const mockSupabase = supabase.from as any;
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockVotes,
            error: null
          })
        })
      })
    });

    const { result } = renderHook(() => useVotes("block-1"), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockVotes);
  });

  it("should handle empty votes", async () => {
    const mockSupabase = supabase.from as any;
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    const { result } = renderHook(() => useVotes("block-1"), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe("useVoteTally", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate vote tally correctly", async () => {
    const mockVotes = [
      {
        id: "vote-1",
        activity_id: "activity-1",
        member_id: "member-1",
        activity: { title: "Museum Visit", category: "Culture" }
      },
      {
        id: "vote-2",
        activity_id: "activity-1",
        member_id: "member-2",
        activity: { title: "Museum Visit", category: "Culture" }
      },
      {
        id: "vote-3",
        activity_id: "activity-2",
        member_id: "member-3",
        activity: { title: "Park Walk", category: "Outdoor" }
      }
    ];

    const mockSupabase = supabase.from as any;
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockVotes,
            error: null
          })
        })
      })
    });

    const { result } = renderHook(() => useVoteTally("block-1"), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.tally).toHaveLength(2);
    expect(result.current.tally[0]).toMatchObject({
      activityId: "activity-1",
      activityTitle: "Museum Visit",
      voteCount: 2
    });
    expect(result.current.tally[1]).toMatchObject({
      activityId: "activity-2",
      activityTitle: "Park Walk",
      voteCount: 1
    });
    expect(result.current.totalVotes).toBe(3);
    expect(result.current.uniqueVoters).toBe(3);
  });
});
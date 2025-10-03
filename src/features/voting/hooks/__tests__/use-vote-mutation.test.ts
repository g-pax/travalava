import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVoteCast, useVoteRemove } from "../use-vote-mutation";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
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

describe("useVoteCast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cast a vote successfully", async () => {
    const mockResponse = {
      success: true,
      vote: {
        id: "vote-1",
        trip_id: "trip-1",
        block_id: "block-1",
        activity_id: "activity-1",
        member_id: "member-1"
      }
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null
    });

    const { result } = renderHook(() => useVoteCast(), {
      wrapper: createWrapper()
    });

    const voteParams = {
      tripId: "trip-1",
      blockId: "block-1",
      activityId: "activity-1"
    };

    result.current.mutate(voteParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("vote-cast", {
      body: voteParams,
      headers: expect.objectContaining({
        "x-client-mutation-id": expect.any(String)
      })
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should handle vote cast errors", async () => {
    const mockError = new Error("Voting window closed");

    (supabase.functions.invoke as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useVoteCast(), {
      wrapper: createWrapper()
    });

    const voteParams = {
      tripId: "trip-1",
      blockId: "block-1",
      activityId: "activity-1"
    };

    result.current.mutate(voteParams);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe("useVoteRemove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove a vote successfully", async () => {
    const mockSupabase = supabase.from as any;
    mockSupabase.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            })
          })
        })
      })
    });

    const { result } = renderHook(() => useVoteRemove(), {
      wrapper: createWrapper()
    });

    const removeParams = {
      tripId: "trip-1",
      blockId: "block-1",
      activityId: "activity-1",
      memberId: "member-1"
    };

    result.current.mutate(removeParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.from).toHaveBeenCalledWith("votes");
  });
});
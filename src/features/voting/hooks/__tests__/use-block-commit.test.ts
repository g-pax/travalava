import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBlockCommit } from "../use-block-commit";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
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

describe("useBlockCommit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should commit a block successfully", async () => {
    const mockResponse = {
      success: true,
      commit: {
        id: "commit-1",
        trip_id: "trip-1",
        block_id: "block-1",
        activity_id: "activity-1",
        committed_by: "member-1",
        committed_at: "2025-01-01T00:00:00Z"
      },
      voteTally: [
        {
          activityId: "activity-1",
          activityTitle: "Museum Visit",
          voteCount: 3
        },
        {
          activityId: "activity-2",
          activityTitle: "Park Walk",
          voteCount: 1
        }
      ],
      duplicatePolicy: "soft_block"
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null
    });

    const { result } = renderHook(() => useBlockCommit(), {
      wrapper: createWrapper()
    });

    const commitParams = {
      tripId: "trip-1",
      blockId: "block-1"
    };

    result.current.mutate(commitParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("block-commit", {
      body: commitParams,
      headers: expect.objectContaining({
        "x-client-mutation-id": expect.any(String)
      })
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should handle tie detection", async () => {
    const mockResponse = {
      error: "Tie detected",
      message: "Multiple activities tied for most votes. Please specify activityId to break the tie.",
      tiedActivities: [
        {
          activityId: "activity-1",
          activityTitle: "Museum Visit",
          voteCount: 2
        },
        {
          activityId: "activity-2",
          activityTitle: "Park Walk",
          voteCount: 2
        }
      ]
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null
    });

    const { result } = renderHook(() => useBlockCommit(), {
      wrapper: createWrapper()
    });

    const commitParams = {
      tripId: "trip-1",
      blockId: "block-1"
    };

    result.current.mutate(commitParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should handle manual tie breaking", async () => {
    const mockResponse = {
      success: true,
      commit: {
        id: "commit-1",
        trip_id: "trip-1",
        block_id: "block-1",
        activity_id: "activity-1",
        committed_by: "member-1",
        committed_at: "2025-01-01T00:00:00Z"
      }
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null
    });

    const { result } = renderHook(() => useBlockCommit(), {
      wrapper: createWrapper()
    });

    const commitParams = {
      tripId: "trip-1",
      blockId: "block-1",
      activityId: "activity-1" // Manual tie breaking
    };

    result.current.mutate(commitParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("block-commit", {
      body: commitParams,
      headers: expect.objectContaining({
        "x-client-mutation-id": expect.any(String)
      })
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should handle duplicate policy violations", async () => {
    const mockError = new Error("Activity is already scheduled in another block. Duplicate policy: prevent.");

    (supabase.functions.invoke as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useBlockCommit(), {
      wrapper: createWrapper()
    });

    const commitParams = {
      tripId: "trip-1",
      blockId: "block-1"
    };

    result.current.mutate(commitParams);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
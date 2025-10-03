"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useDays(tripId: string) {
  return useQuery({
    queryKey: ["days", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("days")
        .select(`
          *,
          blocks (
            id,
            label,
            position,
            vote_open_ts,
            vote_close_ts
          )
        `)
        .eq("trip_id", tripId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { supabase } from "@/lib/supabase";

interface CreateDaysInput {
  tripId: string;
  startDate: string;
  endDate: string;
}

const BLOCK_TEMPLATE = [
  { label: "Morning", position: 0 },
  { label: "Afternoon", position: 1 },
  { label: "Evening", position: 2 },
] as const;

export function useCreateDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, startDate, endDate }: CreateDaysInput) => {
      // Calendar-date iteration with Luxon: raw Date math mixes UTC parsing
      // with local stepping and drops/duplicates days across DST changes.
      const start = DateTime.fromISO(startDate);
      const end = DateTime.fromISO(endDate);
      if (!start.isValid || !end.isValid || end < start) {
        throw new Error("Invalid trip date range");
      }

      const dates: string[] = [];
      for (let d = start; d <= end; d = d.plus({ days: 1 })) {
        const iso = d.toISODate();
        if (iso) dates.push(iso);
      }

      // Idempotent on (trip_id, date): double-clicking "Create Itinerary"
      // or retrying after a partial failure won't duplicate days.
      const { data: days, error: daysError } = await supabase
        .from("days")
        .upsert(
          dates.map((date) => ({ trip_id: tripId, date })),
          { onConflict: "trip_id,date", ignoreDuplicates: false },
        )
        .select();

      if (daysError) throw daysError;

      const blocksToInsert = days.flatMap((day) =>
        BLOCK_TEMPLATE.map((block) => ({
          day_id: day.id,
          label: block.label,
          position: block.position,
        })),
      );

      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .upsert(blocksToInsert, {
          onConflict: "day_id,position",
          ignoreDuplicates: true,
        })
        .select();

      if (blocksError) throw blocksError;

      return { days, blocks };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["days", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", variables.tripId] });
    },
  });
}

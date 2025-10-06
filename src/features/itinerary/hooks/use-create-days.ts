"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

interface CreateDaysInput {
  tripId: string;
  startDate: string;
  endDate: string;
}

export function useCreateDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, startDate, endDate }: CreateDaysInput) => {
      const clientMutationId = nanoid();

      // Generate array of dates between start and end
      const dates = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        dates.push(new Date(date).toISOString().split("T")[0]);
      }

      // Create days
      const daysToInsert = dates.map((date) => ({
        trip_id: tripId,
        date,
      }));

      const { data: days, error: daysError } = await supabase
        .from("days")
        .insert(daysToInsert)
        .select();

      if (daysError) throw daysError;

      // Create blocks for each day
      const blocksToInsert = days.flatMap((day) => [
        {
          day_id: day.id,
          label: "Morning",
          position: 0,
        },
        {
          day_id: day.id,
          label: "Afternoon",
          position: 1,
        },
        {
          day_id: day.id,
          label: "Evening",
          position: 2,
        },
      ]);

      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .insert(blocksToInsert)
        .select();

      if (blocksError) throw blocksError;

      return { days, blocks, clientMutationId };
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["days"] });
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
}

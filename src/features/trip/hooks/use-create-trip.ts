"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type TripCreateInput, TripCreateSchema } from "@/schemas";

/**
 * Creates the trip plus its organizer membership atomically via the
 * create_trip RPC (security definer). The PIN is hashed server-side.
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TripCreateInput) => {
      const validated = TripCreateSchema.parse(input);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to create a trip");
      }

      // create_trip returns a single trips row (no .single() — PostgREST
      // already returns the bare object for non-setof functions)
      const { data: trip, error } = await supabase.rpc("create_trip", {
        p_name: validated.name,
        p_destination_text: validated.destination_text,
        p_start_date: validated.start_date,
        p_end_date: validated.end_date,
        p_timezone: validated.timezone,
        p_currency: validated.currency,
        p_duplicate_policy: validated.duplicate_policy,
        p_pin: validated.pin,
        p_display_name:
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Organizer",
        p_lat: validated.lat,
        p_lon: validated.lon,
      });

      if (error) {
        throw new Error(`Failed to create trip: ${error.message}`);
      }

      return { trip };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-trips"] });
    },
  });
}

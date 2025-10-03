"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";
import { type TripCreateInput, TripCreateSchema } from "@/schemas";

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TripCreateInput) => {
      const validated = TripCreateSchema.parse(input);

      // Hash PIN if provided
      let pin_hash = null;
      if (validated.pin) {
        pin_hash = await bcrypt.hash(validated.pin, 10);
      }

      const clientMutationId = nanoid();

      // Create trip
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          ...validated,
          pin_hash,
          pin: undefined, // Remove plain text PIN
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create organizer member
      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .insert({
          trip_id: trip.id,
          role: "organizer",
          display_name: "Organizer", // TODO: Get from user input
          user_id: null, // Will be set when auth is implemented
        })
        .select()
        .single();

      if (memberError) throw memberError;

      return { trip, member, clientMutationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

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

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to create a trip");
      }

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
          client_mutation_id: clientMutationId,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Get user profile for display name
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      // Create organizer member
      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .insert({
          trip_id: trip.id,
          role: "organizer",
          display_name: userProfile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Organizer",
          user_id: user.id,
          client_mutation_id: clientMutationId,
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

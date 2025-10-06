"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";
import { type JoinTripInput, JoinTripSchema } from "@/schemas";

export function useJoinTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinTripInput) => {
      const validated = JoinTripSchema.parse(input);
      const { tripId, displayName, pin } = validated;

      const clientMutationId = nanoid();

      // Get trip to validate PIN
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("pin_hash, invite_token_version")
        .eq("id", tripId)
        .maybeSingle();

      if (tripError) throw new Error("Trip not found");

      // Validate PIN if required
      if (trip?.pin_hash) {
        const isValidPin = await bcrypt.compare(pin, trip.pin_hash);
        if (!isValidPin) {
          throw new Error("Invalid PIN");
        }
      }

      // Create trip member
      const { data: member, error: memberError } = await supabase
        .from("trip_members")
        .insert({
          trip_id: tripId,
          role: "collaborator",
          display_name: displayName,
          user_id: null, // Will be set when auth is implemented
        })
        .select()
        .maybeSingle();

      if (memberError) throw memberError;

      return { member, clientMutationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["trip", data.member.trip_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["trip-members", data.member.trip_id],
      });
    },
  });
}

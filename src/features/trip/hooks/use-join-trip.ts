"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type JoinTripInput, JoinTripSchema } from "@/schemas";

/**
 * Public trip info for the join page (name, dates, whether a PIN is needed).
 * Served by the anon-callable get_trip_join_info RPC — never exposes pin_hash.
 */
export function useTripJoinInfo(tripId: string | null) {
  return useQuery({
    enabled: !!tripId,
    queryKey: ["trip-join-info", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_trip_join_info", { p_trip_id: tripId as string })
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to load trip: ${error.message}`);
      }
      return data; // null => trip not found
    },
  });
}

function mapJoinError(message: string): string {
  if (message.includes("TOO_MANY_ATTEMPTS"))
    return "Too many incorrect PIN attempts. Please wait a few minutes and try again.";
  if (message.includes("INVALID_PIN")) return "Invalid PIN";
  if (message.includes("TRIP_NOT_FOUND")) return "Trip not found";
  if (message.includes("AUTH_REQUIRED")) return "You must be signed in to join";
  return message;
}

/**
 * Joins the current user to a trip. If the visitor has no session, an account
 * is created first (or, for an existing email, a sign-in is attempted with the
 * provided credentials). PIN verification happens server-side in the
 * join_trip RPC; joining twice is idempotent.
 */
export function useJoinTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinTripInput) => {
      const validated = JoinTripSchema.parse(input);
      const { tripId, displayName, email, password, pin } = validated;

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!email || !password) {
          throw new Error("Email and password are required to join");
        }

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`/trips/join?tripId=${tripId}`)}`,
              data: { display_name: displayName },
            },
          });

        if (signUpError) {
          // The email may already have an account — try signing in with the
          // provided credentials before giving up.
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            throw new Error(
              signUpError.message.toLowerCase().includes("already")
                ? "An account with this email exists, but the password didn't match. Sign in first, then open the invite link again."
                : signUpError.message,
            );
          }
          session = signInData.session;
        } else {
          session = signUpData.session;
        }

        if (!session) {
          throw new Error(
            "Account created — confirm your email, then open the invite link again to join.",
          );
        }
      }

      // join_trip returns a single trip_members row (non-setof function)
      const { data: member, error: joinError } = await supabase.rpc(
        "join_trip",
        {
          p_trip_id: tripId,
          p_pin: pin,
          p_display_name: displayName,
        },
      );

      if (joinError) {
        throw new Error(mapJoinError(joinError.message));
      }

      return { member };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
      queryClient.invalidateQueries({
        queryKey: ["trip-members", variables.tripId],
      });
      queryClient.invalidateQueries({ queryKey: ["user-trips"] });
      queryClient.invalidateQueries({
        queryKey: ["current-member", variables.tripId],
      });
    },
  });
}

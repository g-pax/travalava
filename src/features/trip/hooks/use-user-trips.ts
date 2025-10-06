"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useUserTrips() {
  return useQuery({
    queryKey: ["user-trips"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to view trips");
      }

      const { data, error } = await supabase
        .from("trip_members")
        .select(`
          id,
          role,
          display_name,
          trip:trips (
            id,
            name,
            destination_text,
            start_date,
            end_date,
            currency,
            created_at,
            trip_members (
              id,
              display_name,
              role
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CurrentMember {
  id: string;
  display_name: string;
  role: "organizer" | "collaborator";
  user_id: string | null;
  trip_id: string;
}

export function useCurrentMember(tripId: string) {
  return useQuery({
    queryKey: ["currentMember", tripId],
    queryFn: async (): Promise<CurrentMember | null> => {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const { user } = userData;
      if (userError || !user) {
        return null;
      }

      // Get member record for this trip
      const { data, error } = await supabase
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching current member:", error);
        return null;
      }

      return data as CurrentMember;
    },
    enabled: !!tripId,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { ActivitiesManager } from "@/features/activities/components/activities-manager";
import { useCurrentMember } from "@/features/trip/hooks/use-current-member";
import { supabase } from "@/lib/supabase";

interface ActivitiesPageProps {
  params: { tripId: string };
}

export default function ActivitiesPage({ params }: ActivitiesPageProps) {
  const { tripId } = params;
  console.log("🚀 ~ ActivitiesPage ~ tripId:", tripId);
  const { data: currentMember } = useCurrentMember(tripId);

  // Get trip data for currency - we need this for the ActivitiesManager component
  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) throw new Error("Trip ID is required");
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members (
            id,
            display_name,
            role
          )
        `)
        .eq("id", tripId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });

  if (!trip) {
    return null; // Layout will handle loading state
  }

  return (
    <ActivitiesManager
      tripId={tripId}
      tripCurrency={trip.currency}
      currentUserId={currentMember?.id || ""}
    />
  );
}

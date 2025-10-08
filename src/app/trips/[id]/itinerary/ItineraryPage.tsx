"use client";

import { useQuery } from "@tanstack/react-query";
import { ItineraryView } from "@/features/itinerary/components/itinerary-view";
import { useCurrentMember } from "@/features/trip/hooks/use-current-member";
import { supabase } from "@/lib/supabase";

interface ItineraryPageProps {
  params: { tripId: string };
}

export default function ItineraryPage({ params }: ItineraryPageProps) {
  const { tripId } = params;
  const { data: currentMember } = useCurrentMember(tripId);

  // Get trip data for dates - we need this for the ItineraryView component
  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
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
    <ItineraryView
      tripId={tripId}
      tripStartDate={trip.start_date}
      tripEndDate={trip.end_date}
      currentMember={currentMember}
    />
  );
}

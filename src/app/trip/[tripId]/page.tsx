import { redirect } from "next/navigation";

interface TripPageProps {
  params: Promise<{ tripId: string }>;
}

const Trip = async ({ params }: TripPageProps) => {
  const { tripId } = await params;

  // Redirect to itinerary as the default view
  redirect(`/trip/${tripId}/itinerary`);
};

export default Trip;

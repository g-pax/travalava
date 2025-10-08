import { redirect } from "next/navigation";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

const Trip = async ({ params }: TripPageProps) => {
  const { id } = await params;

  // Redirect to itinerary as the default view
  redirect(`/trips/${id}/itinerary`);
};

export default Trip;

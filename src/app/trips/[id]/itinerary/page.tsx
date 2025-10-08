import ItineraryPage from "./ItineraryPage";

interface ItineraryRouteProps {
  params: Promise<{ id: string }>;
}

const Itinerary = async ({ params }: ItineraryRouteProps) => {
  const { id } = await params;

  return id ? <ItineraryPage params={{ tripId: id }} /> : null;
};

export default Itinerary;

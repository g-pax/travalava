import ItineraryPage from "./ItineraryPage";

interface ItineraryRouteProps {
  params: Promise<{ id: string }>;
}

const Itinerary = async ({ params }: ItineraryRouteProps) => {
  const { id } = await params;

  return <ItineraryPage params={{ tripId: id }} />;
};

export default Itinerary;

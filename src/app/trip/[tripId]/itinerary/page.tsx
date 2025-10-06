import ItineraryPage from "./ItineraryPage";

interface ItineraryRouteProps {
  params: Promise<{ tripId: string }>;
}

const Itinerary = async ({ params }: ItineraryRouteProps) => {
  const { tripId } = await params;

  return <ItineraryPage params={{ tripId }} />;
};

export default Itinerary;

import ActivitiesPage from "./ActivitiesPage";

interface ActivitiesRouteProps {
  params: Promise<{ tripId: string }>;
}

const Activities = async ({ params }: ActivitiesRouteProps) => {
  const { tripId } = await params;

  return <ActivitiesPage params={{ tripId }} />;
};

export default Activities;

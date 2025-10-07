import ActivitiesPage from "./ActivitiesPage";
export const dynamic = "force-dynamic";

interface ActivitiesRouteProps {
  params: Promise<{ id: string }>;
}

const Activities = async ({ params }: ActivitiesRouteProps) => {
  const { id } = await params;

  return <ActivitiesPage params={{ tripId: id }} />;
};

export default Activities;

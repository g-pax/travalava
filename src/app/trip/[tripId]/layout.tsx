import TripLayout from "./TripLayout";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) => {
  const tripId = await params;
  return <TripLayout tripId={tripId.tripId}>{children}</TripLayout>;
};

export default Layout;

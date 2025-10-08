import TripLayout from "./TripLayout";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => {
  const resolvedParams = await params;
  return <TripLayout tripId={resolvedParams.id}>{children}</TripLayout>;
};

export default Layout;

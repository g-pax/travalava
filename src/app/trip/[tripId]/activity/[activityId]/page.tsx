import { ActivityDetailView } from "@/features/activities/components/activity-detail-view";
export const dynamic = "force-dynamic";

interface ActivityDetailPageProps {
  params: Promise<{
    tripId: string;
    activityId: string;
  }>;
}

export default async function ActivityDetailPage({
  params,
}: ActivityDetailPageProps) {
  const { tripId, activityId } = await params;

  return <ActivityDetailView tripId={tripId} activityId={activityId} />;
}

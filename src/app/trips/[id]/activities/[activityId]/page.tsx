import { EnhancedActivityDetailView } from "@/features/activities/components/enhanced-activity-detail-view";
export const dynamic = "force-dynamic";

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
    activityId: string;
  }>;
}

export default async function ActivityDetailPage({
  params,
}: ActivityDetailPageProps) {
  const { id: tripId, activityId } = await params;

  return <EnhancedActivityDetailView tripId={tripId} activityId={activityId} />;
}

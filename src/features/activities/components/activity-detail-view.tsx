"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Link2,
  MapPin,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InlineLoader, Spinner } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import {
  type Activity,
  useActivity,
  useDeleteActivity,
} from "../hooks/use-activities";
import { ActivityEditForm } from "./activity-edit-form";
import { ActivityGoogleMap } from "./activity-google-map";
import { ActivityRestaurantSection } from "./activity-restaurant-section";

interface ActivityDetailViewProps {
  tripId: string;
  activityId: string;
}

export function ActivityDetailView({
  tripId,
  activityId,
}: ActivityDetailViewProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { data: activity, isLoading, error } = useActivity(activityId);

  // Proposals are now fetched with the activity data
  const proposals = activity?.block_proposals || [];
  const deleteActivity = useDeleteActivity();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this activity? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteActivity.mutateAsync({ id: activityId });
      toast.success("Activity deleted successfully");
      router.push(`/trips/${tripId}/activities`);
    } catch (error) {
      toast.error("Failed to delete activity");
      console.error("Delete activity error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setEditingActivity(null);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <InlineLoader message="Loading activity details..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-2">Failed to load activity</p>
                <p className="text-sm text-gray-500">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/trips/${tripId}/activities`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Activities
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Activity not found</p>
                <Button variant="outline" asChild>
                  <Link href={`/trips/${tripId}/activities`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Activities
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const coverImage = activity.src ?? null;
  const hasLocation = activity.location || activity.link;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8 pt-0">
        {/* Main Activity Section */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Activity Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{activity.title}</CardTitle>
                    {activity.category && (
                      <Badge variant="secondary" className="w-fit">
                        {activity.category}
                      </Badge>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="default"
                      onClick={() => setEditingActivity(activity)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Activity
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-white"
                    >
                      {isDeleting ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Activity
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Cover Image */}
                {coverImage && (
                  <div className="w-full rounded-lg overflow-hidden">
                    <Image
                      src={coverImage}
                      alt={`${activity.title} cover image`}
                      width={800}
                      height={400}
                      className="w-full h-[400px] object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Activity Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activity.cost_amount !== undefined &&
                    activity.cost_amount !== null && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Cost</p>
                          <p className="font-medium">
                            {formatCurrency(
                              activity.cost_amount,
                              activity.cost_currency || "USD",
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                  {activity.duration_min && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">
                          {formatDuration(activity.duration_min)}
                        </p>
                      </div>
                    </div>
                  )}

                  {activity.link && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <Link2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">Link</p>
                        <a
                          href={activity.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate block"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  )}

                  {hasLocation && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">
                          {activity.location?.name || "See map"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {activity.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Notes</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {activity.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Proposals */}
                {proposals.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Scheduled For
                      </h3>
                      <div className="space-y-2">
                        {proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
                          >
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              {formatDate(proposal.block?.day?.date || "")} -{" "}
                              {proposal.block?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Map Sidebar */}
          <div className="space-y-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  {hasLocation
                    ? "View this activity on the map"
                    : "No location information available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasLocation ? (
                  <ActivityGoogleMap
                    activity={activity}
                    className="h-[300px] w-full rounded-lg"
                  />
                ) : (
                  <div className="h-[300px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No location specified</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Restaurants Section - Separate full-width section */}
        <div className="mb-8">
          <ActivityRestaurantSection activity={activity} />
        </div>

        {/* Edit Activity Dialog */}
        {editingActivity && (
          <ActivityEditForm
            activity={editingActivity}
            tripCurrency="EUR" // TODO: Get from trip data
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingActivity(null)}
            open={!!editingActivity}
            onOpenChange={(open) => !open && setEditingActivity(null)}
          />
        )}
      </div>
    </div>
  );
}

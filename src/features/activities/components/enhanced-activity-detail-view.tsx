"use client";

import { ArrowLeft, Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThumbnailUpload } from "@/components/common/thumbnail-upload";
import { InlineLoader, Spinner } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRestaurantsByActivity } from "@/features/restaurants";
import type { ThumbnailUploadResult } from "@/lib/image-upload";

import {
  useActivity,
  useDeleteActivity,
  useUpdateActivity,
} from "../hooks/use-activities";
import { InlineLocationEditor } from "./inline-location-editor";
import { InlineMetadataEditor } from "./inline-metadata-editor";
import { InlineNotesEditor } from "./inline-notes-editor";
import { InlineRestaurantManager } from "./inline-restaurant-manager";

interface EnhancedActivityDetailViewProps {
  tripId: string;
  activityId: string;
}

export function EnhancedActivityDetailView({
  tripId,
  activityId,
}: EnhancedActivityDetailViewProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { data: activity, isLoading, error } = useActivity(activityId);
  const { data: restaurants = [], isLoading: isRestaurantsLoading } =
    useRestaurantsByActivity(activityId);

  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const [isDeleting, setIsDeleting] = useState(false);
  const [thumbnail, setThumbnail] = useState<ThumbnailUploadResult | null>(
    null,
  );

  // Initialize thumbnail from activity
  useEffect(() => {
    if (activity?.src) {
      setThumbnail({
        url: activity.src,
        fileName: "activity-thumbnail",
        originalFileName: "activity-thumbnail",
      });
    }
  }, [activity?.src]);

  const handleMetadataUpdate = async (metadata: any) => {
    if (!activity) return;
    await updateActivity.mutateAsync({
      id: activity.id,
      updates: metadata,
    });
    toast.success("Activity details updated successfully");
  };

  const handleLocationUpdate = async (location: any) => {
    if (!activity) return;
    await updateActivity.mutateAsync({
      id: activity.id,
      updates: { location },
    });
    toast.success("Location updated successfully");
  };

  const handleNotesUpdate = async (notes: string | null) => {
    if (!activity) return;
    await updateActivity.mutateAsync({
      id: activity.id,
      updates: { notes: notes || undefined },
    });
    toast.success("Notes updated successfully");
  };

  const handleThumbnailUploaded = async (result: ThumbnailUploadResult) => {
    if (!activity) return;
    setThumbnail(result);
    await updateActivity.mutateAsync({
      id: activity.id,
      updates: { src: result.url },
    });
    toast.success("Thumbnail updated successfully");
  };

  const handleThumbnailUploadError = (error: string) => {
    toast.error(error);
  };

  const handleRemoveThumbnail = async () => {
    if (!activity) return;
    setThumbnail(null);
    await updateActivity.mutateAsync({
      id: activity.id,
      updates: { src: undefined },
    });
    toast.success("Thumbnail removed successfully");
  };

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || isRestaurantsLoading || !isMounted) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header with Navigation and Actions */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" asChild>
            <Link href={`/trips/${tripId}/activities`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Activities
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || updateActivity.isPending}
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

        <div className="grid grid-cols-1 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activity Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Activity Photo
                </CardTitle>
                <CardDescription>
                  Add a photo to make this activity more appealing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {thumbnail?.url && (
                  <div className="relative w-full rounded-lg overflow-hidden">
                    <Image
                      src={thumbnail.url}
                      alt={`${activity.title} photo`}
                      width={800}
                      height={400}
                      className="w-full h-[300px] object-cover"
                      priority
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveThumbnail}
                      disabled={updateActivity.isPending}
                      className="absolute top-2 right-2 text-white"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <ThumbnailUpload
                  onThumbnailUploaded={handleThumbnailUploaded}
                  onError={handleThumbnailUploadError}
                  disabled={updateActivity.isPending}
                  currentThumbnail={thumbnail?.url}
                  placeholder={
                    thumbnail?.url
                      ? "Upload a different photo"
                      : "Upload a photo for this activity"
                  }
                />
              </CardContent>
            </Card>

            {/* Activity Details */}
            <InlineMetadataEditor
              activity={activity}
              onMetadataUpdate={handleMetadataUpdate}
              isUpdating={updateActivity.isPending}
            />

            {/* Notes Section */}
            <InlineNotesEditor
              notes={activity.notes}
              onNotesUpdate={handleNotesUpdate}
              isUpdating={updateActivity.isPending}
            />

            {/* Restaurant Recommendations */}
            <InlineRestaurantManager
              activityId={activityId}
              tripId={tripId}
              tripLocation={
                activity.location?.lat && activity.location?.lon
                  ? { lat: activity.location.lat, lng: activity.location.lon }
                  : undefined
              }
            />

            {/* Proposals Section (Read-only) */}
            {activity.block_proposals &&
              activity.block_proposals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scheduled For</CardTitle>
                    <CardDescription>
                      This activity has been proposed for the following time
                      blocks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {activity.block_proposals.map((proposal: any) => (
                        <div
                          key={proposal.id}
                          className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-blue-900">
                            {new Date(
                              proposal.block?.day?.date || "",
                            ).toLocaleDateString(undefined, {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            - {proposal.block?.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-8">
            {/* Location and Map */}
            <InlineLocationEditor
              activity={activity}
              restaurants={restaurants}
              onLocationUpdate={handleLocationUpdate}
              isUpdating={updateActivity.isPending}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for this activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/trips/${tripId}/itinerary`}>
                    View in Itinerary
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/trips/${tripId}/activities`}>
                    Browse All Activities
                  </Link>
                </Button>
                {activity.link && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={activity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit External Link
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

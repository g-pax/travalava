"use client";

import { format } from "date-fns";
import { Calendar, Clock, DollarSign, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CardError } from "@/components/error";
import { ActivityListLoader } from "@/components/loading";
/**
 * ActivityList displays all activities for a trip with management actions
 * - Shows activity details in card format
 * - Allows editing, deleting, and proposal management
 * - Displays where activities are currently proposed
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatCurrency, formatDuration } from "@/lib/utils";
import { type Activity, useActivities } from "../hooks/use-activities";

import { ActivityPhotoPreview } from "./activity-photo-gallery";

interface ActivityListProps {
  tripId: string;
  tripCurrency?: string;
  onCreateActivity?: () => void;
  onEditActivity?: (activity: Activity) => void;
  onAssignActivity?: (activityId: string, activityTitle: string) => void;
}

function ActivityCard({
  activity,
  tripId,
}: {
  activity: Activity;
  tripId: string;
}) {
  // Proposals are now fetched with the activity data to avoid N+1 queries
  const proposals = activity.block_proposals || [];
  const coverImage = activity.src ?? null;

  return (
    <Link href={`/trips/${tripId}/activities/${activity.id}`}>
      <Card className="relative flex h-full flex-col overflow-hidden cursor-pointer hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
        {coverImage && (
          <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <Image
              src={coverImage}
              alt={`${activity.title} cover image`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1">
              {activity.title}
            </CardTitle>
            {activity.category && (
              <Badge
                variant="secondary"
                className="w-fit text-xs flex-shrink-0"
              >
                {activity.category}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
          {/* Activity Details */}
          {(activity.cost_amount !== null ||
            activity.duration_min ||
            proposals.length > 0) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {activity.cost_amount !== null &&
                activity.cost_amount !== undefined && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">
                      {formatCurrency(
                        activity.cost_amount,
                        activity.cost_currency || "USD",
                      )}
                    </span>
                  </div>
                )}

              {activity.duration_min && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">
                    {formatDuration(activity.duration_min)}
                  </span>
                </div>
              )}

              {proposals.length > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {proposals.length} block{proposals.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Activity Photos Preview */}
          <ActivityPhotoPreview
            photos={[]} // TODO: Load actual photos from activity_photos table
            activityTitle={activity.title}
            maxDisplay={3}
          />

          {/* Notes */}
          {activity.notes && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="line-clamp-2">{activity.notes}</p>
            </div>
          )}

          {/* Proposals Detail */}
          {proposals.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-1.5">
                {proposals.slice(0, 3).map((proposal) => (
                  <Badge
                    key={proposal.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {proposal.block?.day?.date &&
                      format(new Date(proposal.block.day.date), "MMM d")}{" "}
                    {proposal.block?.label}
                  </Badge>
                ))}
                {proposals.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{proposals.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function ActivityList({ tripId, onCreateActivity }: ActivityListProps) {
  const { data: activities = [], isLoading, error } = useActivities(tripId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <ActivityListLoader />
      </div>
    );
  }

  if (error) {
    return (
      <CardError
        message="Failed to load activities"
        description={error.message}
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activities
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {activities.length === 0
              ? "No activities yet"
              : `${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
          </p>
        </div>
        {onCreateActivity && (
          <Button onClick={onCreateActivity} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        )}
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <CardTitle className="mb-2 text-gray-900 dark:text-white">
                  No activities yet
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Start planning your trip by adding some activities you'd like
                  to do.
                </CardDescription>
              </div>
              {onCreateActivity && (
                <Button
                  onClick={onCreateActivity}
                  size="lg"
                  className="gap-2 mt-4"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Activity
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              tripId={tripId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

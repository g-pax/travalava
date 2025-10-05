"use client";

import { format } from "date-fns";
import { Calendar, Clock, DollarSign, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
import { useActivityProposals } from "../hooks/use-proposals";

import { ActivityPhotoPreview } from "./activity-photo-gallery";

interface BlockProposal {
  block?: {
    day?: { date: string };
    label: string;
  };
}

interface ActivityListProps {
  tripId: string;
  tripCurrency?: string;
  onCreateActivity?: () => void;
}

function ActivityCard({
  activity,
  tripId,
}: {
  activity: Activity;
  tripId: string;
}) {
  const { data: proposals = [] } = useActivityProposals(activity.id);
  const coverImage = activity.src ?? null;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
      <Link href={`/trip/${tripId}/activity/${activity.id}`} className="block">
        {coverImage && (
          <div className="w-full bg-gray-100">
            <Image
              src={coverImage}
              alt={`${activity.title} cover image`}
              width={400}
              height={225}
              className="h-full max-h-[250px] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <CardHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{activity.title}</CardTitle>
              {activity.category && (
                <Badge variant="secondary" className="w-fit">
                  {activity.category}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-0">
          {/* Activity Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {activity.cost_amount !== null &&
                activity.cost_amount !== undefined && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {formatCurrency(
                        activity.cost_amount,
                        activity.cost_currency || "USD",
                      )}
                    </span>
                  </div>
                )}

              {activity.duration_min && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(activity.duration_min)}</span>
                </div>
              )}
            </div>

            {/* Activity Photos Preview */}
            <ActivityPhotoPreview
              photos={[]} // TODO: Load actual photos from activity_photos table
              activityTitle={activity.title}
              maxDisplay={3}
            />
          </div>

          {/* Notes */}
          {activity.notes && (
            <div className="text-sm text-gray-600">
              <p className="line-clamp-2">{activity.notes}</p>
            </div>
          )}

          {/* Proposals */}
          {proposals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                <span>Proposed for:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {proposals.map((proposal) => (
                  <Badge
                    key={proposal.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {/* format the date to be in the format of MMM D, YYYY */}
                    {format(
                      new Date(
                        (proposal as BlockProposal).block?.day?.date ?? "",
                      ),
                      "MMM d, yyyy",
                    )}{" "}
                    {(proposal as BlockProposal).block?.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

export function ActivityList({ tripId, onCreateActivity }: ActivityListProps) {
  const { data: activities = [], isLoading, error } = useActivities(tripId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load activities</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activities</h2>
          <p className="text-gray-600">
            {activities.length === 0
              ? "No activities yet"
              : `${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
          </p>
        </div>
        {onCreateActivity && (
          <Button onClick={onCreateActivity}>
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        )}
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="mb-2">No activities yet</CardTitle>
              <CardDescription className="mb-4">
                Start planning your trip by adding some activities you'd like to
                do.
              </CardDescription>
              {onCreateActivity && (
                <Button onClick={onCreateActivity}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Activity
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
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

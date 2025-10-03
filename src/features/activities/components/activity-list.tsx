"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Link2,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDuration } from "@/lib/utils";
import {
  type Activity,
  useActivities,
  useDeleteActivity,
} from "../hooks/use-activities";
import {
  useActivityProposals,
  useCreateProposal,
} from "../hooks/use-proposals";

interface ActivityListProps {
  tripId: string;
  onCreateActivity?: () => void;
  onEditActivity?: (activity: Activity) => void;
  onAssignActivity?: (activityId: string, activityTitle: string) => void;
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onAddToBlock,
}: {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: string) => void;
  onAddToBlock?: (activityId: string) => void;
}) {
  const { data: proposals = [] } = useActivityProposals(activity.id);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{activity.title}</CardTitle>
            {activity.category && (
              <Badge variant="secondary" className="w-fit">
                {activity.category}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(activity)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToBlock?.(activity.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Block
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(activity.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Activity Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {activity.cost_amount && (
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

          {activity.location && (
            <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{activity.location.name}</span>
            </div>
          )}

          {activity.link && (
            <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
              <Link2 className="h-4 w-4 flex-shrink-0" />
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate"
              >
                View Details
              </a>
            </div>
          )}
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
                <Badge key={proposal.id} variant="outline" className="text-xs">
                  {(proposal as any).block?.day?.date} -{" "}
                  {(proposal as any).block?.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityList({
  tripId,
  onCreateActivity,
  onEditActivity,
  onAssignActivity,
}: ActivityListProps) {
  const { data: activities = [], isLoading, error } = useActivities(tripId);
  const deleteActivity = useDeleteActivity();

  const handleDeleteActivity = async (activityId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this activity? This action cannot be undone.",
      )
    ) {
      deleteActivity.mutate({ id: activityId });
    }
  };

  const handleAddToBlock = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (activity && onAssignActivity) {
      onAssignActivity(activityId, activity.title);
    }
  };

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onEditActivity}
              onDelete={handleDeleteActivity}
              onAddToBlock={handleAddToBlock}
            />
          ))}
        </div>
      )}
    </div>
  );
}

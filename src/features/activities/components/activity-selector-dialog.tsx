"use client";

import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useActivities } from "../hooks/use-activities";
import { useCreateProposal } from "../hooks/use-proposals";

interface ActivitySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  blockId: string;
  blockLabel: string;
  currentMemberId?: string;
  existingActivityIds?: string[];
}

export function ActivitySelectorDialog({
  open,
  onOpenChange,
  tripId,
  blockId,
  blockLabel,
  currentMemberId,
  existingActivityIds = [],
}: ActivitySelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: activities = [], isLoading } = useActivities(tripId);
  const createProposal = useCreateProposal();

  // Filter out activities that are already proposed for this block
  const availableActivities = activities.filter(
    (activity) => !existingActivityIds.includes(activity.id),
  );

  // Filter based on search query
  const filteredActivities = availableActivities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddActivity = async (activityId: string) => {
    if (!currentMemberId) {
      toast.error("You must be logged in to add activities");
      return;
    }

    try {
      await createProposal.mutateAsync({
        tripId,
        blockId,
        activityId,
        createdBy: currentMemberId,
      });
      onOpenChange(false);
      setSearchQuery("");
    } catch (error) {
      // Error handled by mutation
      console.error("Failed to add activity:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Activity to {blockLabel}</DialogTitle>
          <DialogDescription>
            Select an activity to propose for this time block
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <InlineLoader message="Loading activities..." />
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No activities match your search"
                  : availableActivities.length === 0
                    ? "All activities have been added to this block"
                    : "No activities available"}
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <button
                type="button"
                key={activity.id}
                onClick={() => handleAddActivity(activity.id)}
                disabled={createProposal.isPending}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 truncate">
                      {activity.title}
                    </h4>
                    {activity.category && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.category}
                      </Badge>
                    )}
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                  <Plus className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

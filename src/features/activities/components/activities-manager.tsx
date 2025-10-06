"use client";

import { X } from "lucide-react";
/**
 * ActivitiesManager is the main interface for managing trip activities
 * - Displays activity list with CRUD operations
 * - Allows creating new activities
 * - Provides block assignment functionality
 * - Shows modal dialogs for forms
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Activity } from "../hooks/use-activities";
import { ActivityCreateForm } from "./activity-create-form";
import { ActivityList } from "./activity-list";
import { BlockSelector } from "./block-selector";

interface ActivitiesManagerProps {
  tripId: string;
  tripCurrency: string;
  currentUserId: string; // For proposal creation
}

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; activity: Activity }
  | { type: "assign"; activityId: string; activityTitle: string };

export function ActivitiesManager({
  tripId,
  tripCurrency,
  currentUserId,
}: ActivitiesManagerProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ type: "none" });

  const handleCreateActivity = () => {
    setDialogState({ type: "create" });
  };

  const handleEditActivity = (activity: Activity) => {
    setDialogState({ type: "edit", activity });
  };

  const handleAssignActivity = (activityId: string, activityTitle: string) => {
    setDialogState({ type: "assign", activityId, activityTitle });
  };

  const handleCloseDialog = () => {
    setDialogState({ type: "none" });
  };

  const handleActivityCreated = (_activity: Activity) => {
    setDialogState({ type: "none" });
    // Optionally auto-open assignment dialog
    // setDialogState({ type: "assign", activityId: activity.id, activityTitle: activity.title });
  };

  const handleAssignmentComplete = () => {
    setDialogState({ type: "none" });
  };

  return (
    <div className="space-y-6">
      <ActivityList
        tripId={tripId}
        onCreateActivity={handleCreateActivity}
        onEditActivity={handleEditActivity}
        onAssignActivity={handleAssignActivity}
      />

      {/* Create Activity Dialog */}
      <Dialog
        open={dialogState.type === "create"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Activity</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={handleCloseDialog}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <ActivityCreateForm
            tripId={tripId}
            tripCurrency={tripCurrency}
            onSuccess={handleActivityCreated}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Block Assignment Dialog */}
      <Dialog
        open={dialogState.type === "assign"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Activity to Blocks</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={handleCloseDialog}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {dialogState.type === "assign" && (
            <BlockSelector
              tripId={tripId}
              activityId={dialogState.activityId}
              activityTitle={dialogState.activityTitle}
              createdBy={currentUserId}
              onSuccess={handleAssignmentComplete}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

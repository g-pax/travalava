"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type VotingWindowInput, VotingWindowSchema } from "@/schemas";
import {
  useClearVotingWindow,
  useUpdateVotingWindow,
} from "../hooks/use-voting-window";

/**
 * VotingWindowManager allows organizers to set voting windows for blocks
 * - Set voting start and end times
 * - Manages timezone considerations
 * - Updates block voting windows
 */

interface VotingWindowManagerProps {
  block: {
    id: string;
    label: string;
    vote_open_ts: string | null;
    vote_close_ts: string | null;
  };
  tripId: string;
  isOrganizer: boolean;
}

export function VotingWindowManager({
  block,
  tripId,
  isOrganizer,
}: VotingWindowManagerProps) {
  const [open, setOpen] = useState(false);
  const updateVotingWindow = useUpdateVotingWindow();
  const clearVotingWindow = useClearVotingWindow();

  const form = useForm<VotingWindowInput>({
    resolver: zodResolver(VotingWindowSchema),
    defaultValues: {
      vote_open_ts: block.vote_open_ts
        ? new Date(block.vote_open_ts).toISOString().slice(0, 16)
        : "",
      vote_close_ts: block.vote_close_ts
        ? new Date(block.vote_close_ts).toISOString().slice(0, 16)
        : "",
    },
  });

  // Reset form when block changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        vote_open_ts: block.vote_open_ts
          ? new Date(block.vote_open_ts).toISOString().slice(0, 16)
          : "",
        vote_close_ts: block.vote_close_ts
          ? new Date(block.vote_close_ts).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [open, block.vote_open_ts, block.vote_close_ts, form]);

  const now = new Date();
  const voteOpenTs = block.vote_open_ts ? new Date(block.vote_open_ts) : null;
  const voteCloseTs = block.vote_close_ts
    ? new Date(block.vote_close_ts)
    : null;

  const votingNotStarted = voteOpenTs && now < voteOpenTs;
  const votingActive =
    voteOpenTs && voteCloseTs && now >= voteOpenTs && now <= voteCloseTs;
  const votingEnded = voteCloseTs && now > voteCloseTs;

  const onSubmit = async (values: VotingWindowInput) => {
    try {
      await updateVotingWindow.mutateAsync({
        blockId: block.id,
        tripId,
        vote_open_ts: new Date(values.vote_open_ts).toISOString(),
        vote_close_ts: new Date(values.vote_close_ts).toISOString(),
      });
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error updating voting window:", error);
    }
  };

  const handleClearWindow = async () => {
    try {
      await clearVotingWindow.mutateAsync({
        blockId: block.id,
        tripId,
      });
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error clearing voting window:", error);
    }
  };

  if (!isOrganizer) {
    return null;
  }

  const isLoading = updateVotingWindow.isPending || clearVotingWindow.isPending;

  return (
    <div className="space-y-2">
      {/* Current status */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4" />
        {!voteOpenTs ? (
          <span className="text-gray-600 dark:text-gray-400">
            No voting window set
          </span>
        ) : votingNotStarted ? (
          <span className="text-amber-600 dark:text-amber-500">
            Voting starts {voteOpenTs.toLocaleDateString()} at{" "}
            {voteOpenTs.toLocaleTimeString()}
          </span>
        ) : votingActive ? (
          <span className="text-green-600 dark:text-green-500">
            Voting active until {voteCloseTs?.toLocaleDateString()} at{" "}
            {voteCloseTs?.toLocaleTimeString()}
          </span>
        ) : votingEnded ? (
          <span className="text-red-600 dark:text-red-500">
            Voting ended {voteCloseTs?.toLocaleDateString()}
          </span>
        ) : null}
      </div>

      {/* Management button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            {voteOpenTs ? "Update" : "Set"} Voting Window
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voting Window for "{block.label}"</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vote_open_ts">Voting Start Time</Label>
              <Input
                id="vote_open_ts"
                type="datetime-local"
                {...form.register("vote_open_ts")}
                min={new Date().toISOString().slice(0, 16)}
              />
              {form.formState.errors.vote_open_ts && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.vote_open_ts.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vote_close_ts">Voting End Time</Label>
              <Input
                id="vote_close_ts"
                type="datetime-local"
                {...form.register("vote_close_ts")}
                min={form.watch("vote_open_ts")}
              />
              {form.formState.errors.vote_close_ts && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.vote_close_ts.message}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="mb-1">
                💡 <strong>Tips:</strong>
              </p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Give members enough time to review and vote</li>
                <li>Consider time zones for remote members</li>
                <li>Voting can be changed until someone casts a vote</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              {(voteOpenTs || voteCloseTs) && (
                <ActionButton
                  type="button"
                  variant="destructive"
                  onClick={handleClearWindow}
                  className="flex-1"
                  isPending={clearVotingWindow.isPending}
                  pendingText="Clearing..."
                >
                  Clear Window
                </ActionButton>
              )}
              <ActionButton
                type="submit"
                disabled={!form.formState.isValid}
                className="flex-1"
                isPending={updateVotingWindow.isPending}
                pendingText="Saving..."
              >
                Save Window
              </ActionButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

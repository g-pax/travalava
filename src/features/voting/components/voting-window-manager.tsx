"use client";

/**
 * VotingWindowManager allows organizers to set voting windows for blocks
 * - Set voting start and end times
 * - Manages timezone considerations
 * - Updates block voting windows
 */
import { useState } from "react";
import { Calendar, Clock, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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
  const [saving, setSaving] = useState(false);
  const [voteOpenTime, setVoteOpenTime] = useState(
    block.vote_open_ts
      ? new Date(block.vote_open_ts).toISOString().slice(0, 16)
      : ""
  );
  const [voteCloseTime, setVoteCloseTime] = useState(
    block.vote_close_ts
      ? new Date(block.vote_close_ts).toISOString().slice(0, 16)
      : ""
  );

  const now = new Date();
  const voteOpenTs = block.vote_open_ts ? new Date(block.vote_open_ts) : null;
  const voteCloseTs = block.vote_close_ts ? new Date(block.vote_close_ts) : null;

  const votingNotStarted = voteOpenTs && now < voteOpenTs;
  const votingActive = voteOpenTs && voteCloseTs && now >= voteOpenTs && now <= voteCloseTs;
  const votingEnded = voteCloseTs && now > voteCloseTs;

  const handleSave = async () => {
    if (!voteOpenTime || !voteCloseTime) {
      toast.error("Please set both start and end times");
      return;
    }

    const openTime = new Date(voteOpenTime);
    const closeTime = new Date(voteCloseTime);

    if (openTime >= closeTime) {
      toast.error("Start time must be before end time");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts: openTime.toISOString(),
          vote_close_ts: closeTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", block.id)
        .eq("trip_id", tripId); // RLS check

      if (error) throw error;

      toast.success("Voting window updated!");
      setOpen(false);
      // The parent component should refetch data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast.error("Failed to update voting window");
      console.error("Voting window update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearWindow = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("blocks")
        .update({
          vote_open_ts: null,
          vote_close_ts: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", block.id)
        .eq("trip_id", tripId);

      if (error) throw error;

      toast.success("Voting window cleared!");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear voting window");
      console.error("Clear voting window error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOrganizer) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Current status */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4" />
        {!voteOpenTs ? (
          <span className="text-gray-600">No voting window set</span>
        ) : votingNotStarted ? (
          <span className="text-amber-600">
            Voting starts {voteOpenTs.toLocaleDateString()} at {voteOpenTs.toLocaleTimeString()}
          </span>
        ) : votingActive ? (
          <span className="text-green-600">
            Voting active until {voteCloseTs?.toLocaleDateString()} at {voteCloseTs?.toLocaleTimeString()}
          </span>
        ) : votingEnded ? (
          <span className="text-red-600">
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vote_open">Voting Start Time</Label>
              <Input
                id="vote_open"
                type="datetime-local"
                value={voteOpenTime}
                onChange={(e) => setVoteOpenTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vote_close">Voting End Time</Label>
              <Input
                id="vote_close"
                type="datetime-local"
                value={voteCloseTime}
                onChange={(e) => setVoteCloseTime(e.target.value)}
                min={voteOpenTime}
              />
            </div>

            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
              <p className="mb-1">💡 <strong>Tips:</strong></p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Give members enough time to review and vote</li>
                <li>Consider time zones for remote members</li>
                <li>Voting can be changed until someone casts a vote</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              {(voteOpenTs || voteCloseTs) && (
                <Button
                  variant="destructive"
                  onClick={handleClearWindow}
                  disabled={saving}
                  className="flex-1"
                >
                  Clear Window
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !voteOpenTime || !voteCloseTime}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Window"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { InlineLoader } from "@/components/loading";
import { useBlockCommit, useBlockCommitQuery } from "../hooks/use-block-commit";
import { useVoteTally } from "../hooks/use-votes";

interface CommitPanelProps {
  block: {
    id: string;
    label: string;
    vote_open_ts: string | null;
    vote_close_ts: string | null;
  };
  tripId: string;
  isOrganizer: boolean;
}

interface DuplicateWarning {
  existingCommits: Array<{
    blockId: string;
    blockLabel: string;
    dayDate: string;
  }>;
  activityId: string;
}

export function CommitPanel({ block, tripId, isOrganizer }: CommitPanelProps) {
  const {
    tally,
    totalVotes,
    uniqueVoters,
    isLoading: votesLoading,
  } = useVoteTally(block.id);
  const { data: existingCommit, isPending: commitLoading } =
    useBlockCommitQuery(block.id);
  const blockCommit = useBlockCommit();

  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [selectedTieBreaker, setSelectedTieBreaker] = useState<string>("");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateWarning, setDuplicateWarning] =
    useState<DuplicateWarning | null>(null);

  // Check voting window status
  const now = new Date();
  const voteCloseTs = block.vote_close_ts
    ? new Date(block.vote_close_ts)
    : null;
  const votingEnded = voteCloseTs && now > voteCloseTs;

  // Determine if there's a tie
  const topVoteCount = tally[0]?.voteCount || 0;
  const tiedActivities = tally.filter(
    (t) => t.voteCount === topVoteCount && t.voteCount > 0,
  );
  const hasTie = tiedActivities.length > 1;

  const handleCommit = async (
    manualActivityId?: string,
    confirmDuplicate = false,
  ) => {
    try {
      const result = await blockCommit.mutateAsync({
        tripId,
        blockId: block.id,
        activityId: manualActivityId,
        confirmDuplicate,
      });

      // Handle tie-breaking required
      if (
        !result.success &&
        result.tiedActivities &&
        result.tiedActivities.length > 1
      ) {
        setShowTieBreaker(true);
        toast.info("Multiple activities are tied. Please select a winner.");
        return;
      }

      // Handle duplicate policy warnings
      if (
        !result.success &&
        result.existingCommits &&
        result.existingCommits.length > 0
      ) {
        if (result.error === "Duplicate activity not allowed") {
          // "prevent" policy - show error
          toast.error(result.message || "This activity is already scheduled");
          return;
        }
        // "soft_block" policy - show warning and ask for confirmation
        setDuplicateWarning({
          existingCommits: result.existingCommits,
          activityId: manualActivityId || tally[0].activityId,
        });
        setShowDuplicateWarning(true);
        return;
      }

      // Success!
      if (result.success) {
        toast.success(result.message || "Activity committed successfully!");
        setShowTieBreaker(false);
        setShowDuplicateWarning(false);
        setDuplicateWarning(null);
        setSelectedTieBreaker("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to commit activity");
      console.error("Commit error:", error);
    }
  };

  const handleTieBreakCommit = async () => {
    if (!selectedTieBreaker) {
      toast.error("Please select an activity to break the tie");
      return;
    }

    await handleCommit(selectedTieBreaker);
  };

  const handleDuplicateConfirm = async () => {
    if (!duplicateWarning) return;
    await handleCommit(duplicateWarning.activityId, true);
  };

  if (votesLoading || commitLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <InlineLoader message="Loading vote data..." />
        </CardContent>
      </Card>
    );
  }

  // If already committed, show commit status
  if (existingCommit) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Block Committed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">{existingCommit.activity?.title}</h4>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                {existingCommit.activity?.category && (
                  <Badge variant="secondary">
                    {existingCommit.activity.category}
                  </Badge>
                )}
                {existingCommit.activity?.cost_amount && (
                  <span>
                    {formatCurrency(
                      existingCommit.activity.cost_amount,
                      existingCommit.activity.cost_currency || "USD",
                    )}
                  </span>
                )}
                {existingCommit.activity?.duration_min && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(existingCommit.activity.duration_min)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Committed by {existingCommit.committed_by_member?.display_name} on{" "}
              {new Date(existingCommit.committed_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOrganizer) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Only trip organizers can commit blocks
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-4 w-4" />
          Commit Block: {block.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting summary */}
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Users className="h-3 w-3" />
            {totalVotes} total votes from {uniqueVoters} voters
          </div>
          {voteCloseTs && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              {votingEnded ? (
                <span className="text-red-600">
                  Voting ended on {voteCloseTs.toLocaleDateString()}
                </span>
              ) : (
                <span className="text-amber-600">
                  Voting ends on {voteCloseTs.toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Vote results */}
        {tally.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No votes cast yet for this block
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-medium">Vote Results:</h4>
            {tally.map((item, index) => (
              <div
                key={item.activityId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 && !hasTie
                    ? "border-green-300 bg-green-50"
                    : tiedActivities.includes(item)
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {index === 0 && !hasTie && (
                      <Trophy className="h-4 w-4 text-green-600" />
                    )}
                    {tiedActivities.includes(item) && (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-medium">{item.activityTitle}</span>
                    {item.activityCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {item.activityCategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Tie warning */}
        {hasTie && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Tie Detected!</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {tiedActivities.length} activities are tied with {topVoteCount}{" "}
              votes each. You'll need to manually select the winner.
            </p>
          </div>
        )}

        {/* Commit actions */}
        <div className="flex gap-2">
          {!hasTie && tally.length > 0 ? (
            <Button
              onClick={() => handleCommit()}
              disabled={blockCommit.isPending}
              className="flex-1"
            >
              {blockCommit.isPending
                ? "Committing..."
                : `Commit "${tally[0].activityTitle}"`}
            </Button>
          ) : hasTie ? (
            <Dialog open={showTieBreaker} onOpenChange={setShowTieBreaker}>
              <DialogTrigger asChild>
                <Button className="flex-1">Break Tie & Commit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Break the Tie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select which activity should win for the "{block.label}"
                    time block:
                  </p>
                  <div className="space-y-2">
                    {tiedActivities.map((item) => (
                      <label
                        key={item.activityId}
                        className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="tieBreaker"
                          value={item.activityId}
                          checked={selectedTieBreaker === item.activityId}
                          onChange={(e) =>
                            setSelectedTieBreaker(e.target.value)
                          }
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.activityTitle}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.voteCount} votes
                            {item.activityCategory &&
                              ` • ${item.activityCategory}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowTieBreaker(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTieBreakCommit}
                      disabled={!selectedTieBreaker || blockCommit.isPending}
                      className="flex-1"
                    >
                      {blockCommit.isPending
                        ? "Committing..."
                        : "Commit Selected"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled className="flex-1">
              No votes to commit
            </Button>
          )}
        </div>

        {/* Duplicate warning dialog */}
        <Dialog
          open={showDuplicateWarning}
          onOpenChange={setShowDuplicateWarning}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Activity Already Scheduled
              </DialogTitle>
              <DialogDescription>
                This activity has already been committed to another block in
                this trip.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {duplicateWarning &&
                duplicateWarning.existingCommits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Currently scheduled at:
                    </p>
                    {duplicateWarning.existingCommits.map((commit) => (
                      <div
                        key={commit.blockId}
                        className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"
                      >
                        <div className="font-medium">{commit.blockLabel}</div>
                        <div className="text-gray-600">
                          {new Date(commit.dayDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              <p className="text-sm text-gray-600">
                Your trip's duplicate policy is set to "Soft Block". You can
                proceed with this commitment, but consider if scheduling the
                same activity multiple times is intentional.
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateWarning(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicateConfirm}
                disabled={blockCommit.isPending}
                className="flex-1"
              >
                {blockCommit.isPending ? "Committing..." : "Proceed Anyway"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voting deadline warning for organizers */}
        {!votingEnded && voteCloseTs && (
          <div className="text-xs text-gray-500 text-center">
            Consider waiting until voting ends on{" "}
            {voteCloseTs.toLocaleDateString()} unless urgent
          </div>
        )}
      </CardContent>
    </Card>
  );
}

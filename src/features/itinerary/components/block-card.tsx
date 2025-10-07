"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Gavel,
  MapPin,
  Plus,
  Trash2,
  Vote,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ActivitySelectorDialog } from "@/features/activities/components/activity-selector-dialog";
import {
  useBlockProposals,
  useRemoveProposal,
} from "@/features/activities/hooks/use-proposals";
import { CommitPanel } from "@/features/voting/components/commit-panel";
import { VotingPanel } from "@/features/voting/components/voting-panel";
import { VotingWindowManager } from "@/features/voting/components/voting-window-manager";
import { useBlockCommitQuery } from "@/features/voting/hooks/use-block-commit";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { useUpdateBlockLabel } from "../hooks/use-update-block-label";

interface BlockCardProps {
  block: {
    id: string;
    label: string;
    position: number;
    vote_open_ts: string | null;
    vote_close_ts: string | null;
  };
  tripId: string;
  currentMemberId?: string;
  isOrganizer?: boolean;
}

export function BlockCard({
  block,
  tripId,
  currentMemberId,
  isOrganizer = false,
}: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(block.label);
  const [showProposals, setShowProposals] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const updateBlockLabel = useUpdateBlockLabel();
  const { data: proposals = [], isLoading: proposalsLoading } =
    useBlockProposals(block.id);
  const { data: existingCommit } = useBlockCommitQuery(block.id);
  const removeProposal = useRemoveProposal();

  const handleSave = async () => {
    if (editLabel.trim() === "") {
      toast.error("Block label cannot be empty");
      return;
    }

    try {
      await updateBlockLabel.mutateAsync({
        blockId: block.id,
        tripId,
        label: editLabel.trim(),
      });
      setIsEditing(false);
      toast.success("Block label updated!");
    } catch (error) {
      toast.error("Failed to update block label");
      console.error("Update block label error:", error);
    }
  };

  const handleCancel = () => {
    setEditLabel(block.label);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleRemoveProposal = async (proposalId: string) => {
    if (!confirm("Remove this activity from the block?")) {
      return;
    }

    try {
      await removeProposal.mutateAsync({ proposalId });
    } catch (error) {
      // Error handled by mutation
      console.error("Failed to remove proposal:", error);
    }
  };

  // Determine voting status
  const getVotingStatus = () => {
    if (!block.vote_open_ts) return null;
    const now = new Date();
    const voteOpenTs = new Date(block.vote_open_ts);
    const voteCloseTs = block.vote_close_ts
      ? new Date(block.vote_close_ts)
      : null;

    if (now < voteOpenTs) return "soon";
    if (voteCloseTs && now >= voteOpenTs && now <= voteCloseTs) return "active";
    if (voteCloseTs && now > voteCloseTs) return "ended";
    return "open";
  };

  const votingStatus = getVotingStatus();

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-600">
      <CardContent className="p-4 sm:p-6">
        {/* Block Header with inline edit */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-base font-semibold"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={updateBlockLabel.isPending}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateBlockLabel.isPending}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {block.label}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <TooltipProvider>
              {proposals.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {proposals.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {proposals.length} proposal
                    {proposals.length !== 1 ? "s" : ""}
                  </TooltipContent>
                </Tooltip>
              )}

              {votingStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={
                        votingStatus === "active" ? "default" : "secondary"
                      }
                      className="gap-1"
                    >
                      <Vote className="h-3 w-3" />
                      {votingStatus === "active"
                        ? "Active"
                        : votingStatus === "ended"
                          ? "Ended"
                          : votingStatus === "soon"
                            ? "Soon"
                            : "Open"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Voting {votingStatus}</TooltipContent>
                </Tooltip>
              )}

              {existingCommit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                      <Gavel className="h-3 w-3" />
                      Committed
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Activity committed</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowProposals(!showProposals)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {showProposals ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Proposals {proposals.length > 0 && `(${proposals.length})`}
            </button>
            {showProposals && (
              <Button
                onClick={() => setShowActivitySelector(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Activity</span>
              </Button>
            )}
          </div>

          {showProposals && (
            <div className="space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
              {proposalsLoading ? (
                <InlineLoader message="Loading proposals..." />
              ) : proposals.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No activities yet
                  </p>
                  <Button
                    onClick={() => setShowActivitySelector(true)}
                    variant="link"
                    size="sm"
                    className="mt-2"
                  >
                    Add your first activity
                  </Button>
                </div>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    {(proposal.activity as any)?.src && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={(proposal.activity as any).src}
                          alt={proposal.activity?.title || "Activity"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
                        {proposal.activity?.title}
                      </h5>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {proposal.activity?.category && (
                          <Badge variant="secondary" className="text-xs">
                            {proposal.activity.category}
                          </Badge>
                        )}

                        {proposal.activity?.cost_amount !== null &&
                          proposal.activity?.cost_amount !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(
                                proposal.activity.cost_amount,
                                proposal.activity.cost_currency || "USD",
                              )}
                            </span>
                          )}

                        {proposal.activity?.duration_min && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatDuration(proposal.activity.duration_min)}
                          </span>
                        )}
                      </div>

                      {proposal.activity?.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {proposal.activity.location.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProposal(proposal.id)}
                      disabled={removeProposal.isPending}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Voting Section */}
        {(votingStatus || isOrganizer) && (
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowVoting(!showVoting)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
            >
              {showVoting ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Vote className="h-4 w-4" />
              Voting
              {votingStatus && (
                <Badge
                  variant={votingStatus === "active" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {votingStatus}
                </Badge>
              )}
            </button>

            {showVoting && (
              <div className="pl-6 space-y-4">
                {isOrganizer && (
                  <VotingWindowManager
                    block={block}
                    tripId={tripId}
                    isOrganizer={isOrganizer}
                  />
                )}
                <VotingPanel
                  block={block}
                  tripId={tripId}
                  proposals={proposals}
                  currentMemberId={currentMemberId}
                  isOrganizer={isOrganizer}
                />
              </div>
            )}
          </div>
        )}

        {/* Commit Section */}
        <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowCommit(!showCommit)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
          >
            {showCommit ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Gavel className="h-4 w-4" />
            Commit
            {existingCommit && (
              <Badge className="ml-2 bg-green-600">Committed</Badge>
            )}
          </button>

          {showCommit && (
            <div className="pl-6">
              <CommitPanel
                block={block}
                tripId={tripId}
                isOrganizer={isOrganizer}
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* Activity Selector Dialog */}
      <ActivitySelectorDialog
        open={showActivitySelector}
        onOpenChange={setShowActivitySelector}
        tripId={tripId}
        blockId={block.id}
        blockLabel={block.label}
        currentMemberId={currentMemberId}
        existingActivityIds={proposals.map((p) => p.activity_id)}
      />
    </Card>
  );
}

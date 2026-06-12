"use client";

import { Check, Edit2, Gavel, Lock, Plus, Trash2, Vote, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ActivitySelectorDialog } from "@/features/activities/components/activity-selector-dialog";
import {
  type BlockProposal,
  useBlockProposals,
  useRemoveProposal,
} from "@/features/activities/hooks/use-proposals";
import { CommitPanel } from "@/features/voting/components/commit-panel";
import { VotingWindowManager } from "@/features/voting/components/voting-window-manager";
import {
  useBlockCommitQuery,
  useBlockUncommit,
} from "@/features/voting/hooks/use-block-commit";
import {
  useVoteCast,
  useVoteRemove,
} from "@/features/voting/hooks/use-vote-mutation";
import { useVoteTally } from "@/features/voting/hooks/use-votes";
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

/**
 * One time block (Morning / Afternoon / Evening). The whole propose -> vote ->
 * commit flow is visible at a glance: proposals are listed inline with voter
 * avatars and a one-tap vote toggle; committing happens in a focused dialog.
 */
export function BlockCard({
  block,
  tripId,
  currentMemberId,
  isOrganizer = false,
}: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(block.label);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);

  const updateBlockLabel = useUpdateBlockLabel();
  const { data: proposals = [] } = useBlockProposals(block.id);
  const { data: existingCommit } = useBlockCommitQuery(block.id);
  const { tally } = useVoteTally(block.id);
  const voteCast = useVoteCast();
  const voteRemove = useVoteRemove();
  const removeProposal = useRemoveProposal();
  const blockUncommit = useBlockUncommit();

  // Voting window state (no window set = voting open)
  const now = new Date();
  const opensAt = block.vote_open_ts ? new Date(block.vote_open_ts) : null;
  const closesAt = block.vote_close_ts ? new Date(block.vote_close_ts) : null;
  const windowStatus = !opensAt
    ? null
    : now < opensAt
      ? "soon"
      : closesAt && now > closesAt
        ? "ended"
        : "active";
  const votingOpen =
    !existingCommit && windowStatus !== "soon" && windowStatus !== "ended";

  const tallyByActivity = new Map(tally.map((t) => [t.activityId, t]));
  const totalVotes = tally.reduce((sum, t) => sum + t.voteCount, 0);

  const handleSaveLabel = async () => {
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
    } catch {
      toast.error("Failed to update block label");
    }
  };

  const handleVoteToggle = async (activityId: string, hasVoted: boolean) => {
    if (!currentMemberId) {
      toast.error("You must be a trip member to vote");
      return;
    }
    try {
      const params = {
        tripId,
        blockId: block.id,
        activityId,
        memberId: currentMemberId,
      };
      if (hasVoted) {
        await voteRemove.mutateAsync(params);
      } else {
        await voteCast.mutateAsync(params);
      }
    } catch {
      toast.error("Failed to update vote");
    }
  };

  const handleRemoveProposal = async (proposalId: string) => {
    if (!confirm("Remove this activity from the block?")) return;
    try {
      await removeProposal.mutateAsync({ proposalId });
    } catch {
      // surfaced by the mutation's own toast
    }
  };

  const handleUncommit = async () => {
    if (!confirm("Unlock this block? Voting will reopen.")) return;
    try {
      await blockUncommit.mutateAsync({ tripId, blockId: block.id });
      toast.success("Block unlocked - voting is open again");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to uncommit",
      );
    }
  };

  const committedActivityId = existingCommit?.activity?.id;

  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Block header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveLabel();
                if (e.key === "Escape") {
                  setEditLabel(block.label);
                  setIsEditing(false);
                }
              }}
              className="h-8 max-w-48 text-sm font-semibold"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveLabel}
              disabled={updateBlockLabel.isPending}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditLabel(block.label);
                setIsEditing(false);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5">
            <h4 className="truncate font-semibold text-foreground">
              {block.label}
            </h4>
            {isOrganizer && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground"
                aria-label={`Rename ${block.label}`}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {existingCommit ? (
            <Badge className="moment-pop gap-1 bg-success-muted text-success-foreground">
              <Lock className="h-3 w-3" />
              Committed
            </Badge>
          ) : windowStatus === "active" ? (
            <Badge className="gap-1 bg-success-muted text-success-foreground">
              <Vote className="h-3 w-3" />
              Voting open
            </Badge>
          ) : windowStatus === "soon" && opensAt ? (
            <Badge className="bg-warning-muted text-warning-foreground">
              Opens {opensAt.toLocaleDateString()}
            </Badge>
          ) : windowStatus === "ended" ? (
            <Badge variant="secondary" className="text-muted-foreground">
              Voting closed
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Proposals */}
      {proposals.length === 0 ? (
        <div className="border-t border-border px-4 py-8 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            No ideas for {block.label.toLowerCase()} yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowActivitySelector(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Propose the first activity
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {proposals.map((proposal) => (
            <ProposalRow
              key={proposal.id}
              proposal={proposal}
              tally={tallyByActivity.get(proposal.activity_id)}
              isCommitted={committedActivityId === proposal.activity_id}
              dimmed={
                !!existingCommit && committedActivityId !== proposal.activity_id
              }
              votingOpen={votingOpen}
              currentMemberId={currentMemberId}
              voting={voteCast.isPending || voteRemove.isPending}
              onVoteToggle={handleVoteToggle}
              onRemove={handleRemoveProposal}
              canRemove={!existingCommit}
            />
          ))}
        </ul>
      )}

      {/* Footer actions */}
      {(proposals.length > 0 || isOrganizer) && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
          <div>
            {!existingCommit && proposals.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowActivitySelector(true)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Propose activity
              </Button>
            )}
          </div>

          {isOrganizer && (
            <div className="flex items-center gap-1">
              {existingCommit ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUncommit}
                  disabled={blockUncommit.isPending}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  Unlock
                </Button>
              ) : (
                <>
                  <VotingWindowManager
                    block={block}
                    tripId={tripId}
                    isOrganizer={isOrganizer}
                  />
                  {totalVotes > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowCommitDialog(true)}
                      className="gap-1.5"
                    >
                      <Gavel className="h-4 w-4" />
                      Commit
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Commit dialog (organizer): tally, tie-break, duplicate handling */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commit "{block.label}"</DialogTitle>
          </DialogHeader>
          <CommitPanel
            block={block}
            tripId={tripId}
            isOrganizer={isOrganizer}
          />
        </DialogContent>
      </Dialog>

      {/* Activity Selector Dialog */}
      <ActivitySelectorDialog
        open={showActivitySelector}
        onOpenChange={setShowActivitySelector}
        tripId={tripId}
        blockId={block.id}
        blockLabel={block.label}
        currentMemberId={currentMemberId}
      />
    </section>
  );
}

interface ProposalRowProps {
  proposal: BlockProposal;
  tally?: {
    voteCount: number;
    votes: Array<{
      member_id: string;
      member?: { display_name?: string } | null;
    }>;
  };
  isCommitted: boolean;
  dimmed: boolean;
  votingOpen: boolean;
  currentMemberId?: string;
  voting: boolean;
  onVoteToggle: (activityId: string, hasVoted: boolean) => void;
  onRemove: (proposalId: string) => void;
  canRemove: boolean;
}

function ProposalRow({
  proposal,
  tally,
  isCommitted,
  dimmed,
  votingOpen,
  currentMemberId,
  voting,
  onVoteToggle,
  onRemove,
  canRemove,
}: ProposalRowProps) {
  const activity = proposal.activity;
  const voteCount = tally?.voteCount ?? 0;
  const voters = (tally?.votes ?? [])
    .map((v) => v.member?.display_name)
    .filter((name): name is string => !!name);
  const hasVoted = (tally?.votes ?? []).some(
    (v) => v.member_id === currentMemberId,
  );
  // biome-ignore lint/suspicious/noExplicitAny: src column exists; app type lags
  const thumb = (activity as any)?.src as string | undefined;

  const meta = [
    activity?.category,
    activity?.cost_amount != null
      ? formatCurrency(activity.cost_amount, activity.cost_currency || "EUR")
      : null,
    activity?.duration_min != null
      ? formatDuration(activity.duration_min)
      : null,
  ].filter(Boolean);

  return (
    <li
      className={`group flex items-center gap-3 px-4 py-3 ${
        isCommitted ? "bg-success-muted/60" : dimmed ? "opacity-50" : ""
      }`}
    >
      {thumb && (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isCommitted && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-success-foreground" />
          )}
          <p className="truncate text-sm font-medium text-foreground">
            {activity?.title || "Unknown activity"}
          </p>
        </div>
        {meta.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta.join(" - ")}
          </p>
        )}
      </div>

      {/* Voters + count + vote toggle */}
      <div className="flex shrink-0 items-center gap-2">
        {voters.length > 0 && (
          <div
            className="-space-x-1.5 hidden sm:flex"
            title={voters.join(", ")}
          >
            {voters.slice(0, 4).map((name, i) => (
              <Avatar
                key={`${name}-${i}`}
                className="h-6 w-6 border-2 border-card"
              >
                <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground/80">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {voters.length > 4 && (
              <Avatar className="h-6 w-6 border-2 border-card">
                <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                  +{voters.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {voteCount > 0 && (
          <Badge key={voteCount} className="moment-pop tabular-nums">
            {voteCount}
          </Badge>
        )}

        {votingOpen && currentMemberId && (
          <Button
            size="sm"
            variant={hasVoted ? "default" : "outline"}
            onClick={() => onVoteToggle(proposal.activity_id, hasVoted)}
            disabled={voting}
            className="h-8 min-w-[4.5rem] gap-1"
          >
            {hasVoted ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Voted
              </>
            ) : (
              "Vote"
            )}
          </Button>
        )}

        {canRemove && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(proposal.id)}
            className="h-8 w-8 p-0 text-muted-foreground/50 opacity-0 transition-opacity duration-150 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={`Remove ${activity?.title || "proposal"}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </li>
  );
}

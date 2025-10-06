"use client";

import {
  Check,
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
import { useState } from "react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState<"proposals" | "voting" | "commit">(
    "proposals",
  );
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

  return (
    <Card className="relative flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-base font-semibold"
                autoFocus
              />
              <div className="flex gap-1 flex-shrink-0">
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
            </div>
          ) : (
            <>
              <span className="font-semibold">{block.label}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "proposals" | "voting" | "commit")
          }
          className="flex flex-col flex-1"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger
              value="proposals"
              className="text-xs sm:text-sm flex-col sm:flex-row gap-1 py-2"
            >
              <span className="hidden sm:inline">Proposals</span>
              <span className="sm:hidden">Props</span>
              {proposals.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs px-1"
                >
                  {proposals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="voting"
              className="text-xs sm:text-sm flex-col sm:flex-row gap-1 py-2"
            >
              <div className="flex items-center gap-1">
                <Vote className="h-3 w-3" />
                <span>Voting</span>
              </div>
              {block.vote_open_ts && (
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs px-1"
                >
                  {(() => {
                    const now = new Date();
                    const voteOpenTs = new Date(block.vote_open_ts);
                    const voteCloseTs = block.vote_close_ts
                      ? new Date(block.vote_close_ts)
                      : null;

                    if (now < voteOpenTs) return "Soon";
                    if (voteCloseTs && now >= voteOpenTs && now <= voteCloseTs)
                      return "Active";
                    if (voteCloseTs && now > voteCloseTs) return "Ended";
                    return "Open";
                  })()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="commit"
              className="text-xs sm:text-sm flex-col sm:flex-row gap-1 py-2"
            >
              <div className="flex items-center gap-1">
                <Gavel className="h-3 w-3" />
                <span>Commit</span>
              </div>
              {existingCommit && (
                <Badge
                  variant="default"
                  className="text-[10px] sm:text-xs px-1 bg-green-600"
                >
                  ✓
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-4 flex-1">
            {/* Add Activity Button */}
            <div className="mb-4">
              <Button
                onClick={() => setShowActivitySelector(true)}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </div>

            {proposalsLoading ? (
              <InlineLoader message="Loading proposals..." />
            ) : proposals.length === 0 ? (
              <div className="min-h-[140px] border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No activities yet</p>
                  <p className="text-xs mt-1.5">
                    Click "Add Activity" above to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className="border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          <h4 className="font-semibold text-sm sm:text-base line-clamp-1">
                            {proposal.activity?.title}
                          </h4>

                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {proposal.activity?.category && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] sm:text-xs"
                              >
                                {proposal.activity.category}
                              </Badge>
                            )}

                            {proposal.activity?.cost_amount && (
                              <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span className="text-[10px] sm:text-xs">
                                  {formatCurrency(
                                    proposal.activity.cost_amount,
                                    proposal.activity.cost_currency || "USD",
                                  )}
                                </span>
                              </div>
                            )}

                            {proposal.activity?.duration_min && (
                              <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] sm:text-xs">
                                  {formatDuration(
                                    proposal.activity.duration_min,
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {proposal.activity?.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate text-[10px] sm:text-xs">
                                {proposal.activity.location.name}
                              </span>
                            </div>
                          )}

                          {proposal.activity?.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {proposal.activity.notes}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProposal(proposal.id)}
                          disabled={removeProposal.isPending}
                          className="h-8 w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Remove activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Voting status */}
            {block.vote_open_ts && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Voting: {new Date(block.vote_open_ts).toLocaleDateString()}
                    {block.vote_close_ts &&
                      ` - ${new Date(block.vote_close_ts).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="voting" className="mt-4 flex-1">
            <div className="space-y-4">
              {/* Voting Window Management for Organizers */}
              {isOrganizer && (
                <VotingWindowManager
                  block={block}
                  tripId={tripId}
                  isOrganizer={isOrganizer}
                />
              )}

              {/* Voting Panel */}
              <VotingPanel
                block={block}
                tripId={tripId}
                proposals={proposals}
                currentMemberId={currentMemberId}
                isOrganizer={isOrganizer}
              />
            </div>
          </TabsContent>

          <TabsContent value="commit" className="mt-4 flex-1">
            <CommitPanel
              block={block}
              tripId={tripId}
              isOrganizer={isOrganizer}
            />
          </TabsContent>
        </Tabs>
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

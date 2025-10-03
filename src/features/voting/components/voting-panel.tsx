"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVoteTally } from "../hooks/use-votes";
import { useVoteCast, useVoteRemove } from "../hooks/use-vote-mutation";
import { Vote2, Clock, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface VotingPanelProps {
  block: {
    id: string;
    label: string;
    vote_open_ts: string | null;
    vote_close_ts: string | null;
  };
  tripId: string;
  proposals: Array<{
    id: string;
    activity_id: string;
    activity?: {
      id: string;
      title: string;
      category?: string;
      cost_amount?: number;
      cost_currency?: string;
      duration_min?: number;
      notes?: string;
      location?: any;
    };
  }>;
  currentMemberId?: string;
  isOrganizer?: boolean;
}

export function VotingPanel({
  block,
  tripId,
  proposals,
  currentMemberId,
  isOrganizer = false
}: VotingPanelProps) {
  const { tally, data: votes, totalVotes, uniqueVoters, isLoading } = useVoteTally(block.id);
  const voteCast = useVoteCast();
  const voteRemove = useVoteRemove();

  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // Check voting window status
  const now = new Date();
  const voteOpenTs = block.vote_open_ts ? new Date(block.vote_open_ts) : null;
  const voteCloseTs = block.vote_close_ts ? new Date(block.vote_close_ts) : null;

  const votingNotStarted = voteOpenTs && now < voteOpenTs;
  const votingEnded = voteCloseTs && now > voteCloseTs;
  const votingActive = !votingNotStarted && !votingEnded;

  // Get current user's votes
  const userVotes = votes.filter(vote => vote.member_id === currentMemberId);
  const userVotedActivityIds = new Set(userVotes.map(vote => vote.activity_id));

  const handleVoteToggle = async (activityId: string) => {
    if (!currentMemberId) {
      toast.error("You must be logged in to vote");
      return;
    }

    if (!votingActive) {
      toast.error("Voting is not currently active for this block");
      return;
    }

    try {
      if (userVotedActivityIds.has(activityId)) {
        // Remove vote
        await voteRemove.mutateAsync({
          tripId,
          blockId: block.id,
          activityId,
          memberId: currentMemberId,
        });
        toast.success("Vote removed");
      } else {
        // Add vote
        await voteCast.mutateAsync({
          tripId,
          blockId: block.id,
          activityId,
        });
        toast.success("Vote cast!");
      }
    } catch (error) {
      toast.error("Failed to update vote");
      console.error("Vote error:", error);
    }
  };

  const handleBulkVote = async () => {
    if (!currentMemberId || selectedActivities.size === 0) {
      toast.error("Please select activities to vote for");
      return;
    }

    if (!votingActive) {
      toast.error("Voting is not currently active for this block");
      return;
    }

    try {
      // Cast votes for all selected activities
      const promises = Array.from(selectedActivities).map(activityId =>
        voteCast.mutateAsync({
          tripId,
          blockId: block.id,
          activityId,
        })
      );

      await Promise.all(promises);
      setSelectedActivities(new Set());
      toast.success(`Voted for ${selectedActivities.size} activities!`);
    } catch (error) {
      toast.error("Failed to cast votes");
      console.error("Bulk vote error:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-gray-500">Loading voting data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote2 className="h-4 w-4" />
            Voting: {block.label}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-3 w-3" />
            {totalVotes} votes from {uniqueVoters} voters
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
          <Clock className="h-4 w-4" />
          <div className="text-sm">
            {votingNotStarted && voteOpenTs && (
              <span className="text-amber-600">
                Voting starts {voteOpenTs.toLocaleDateString()} at {voteOpenTs.toLocaleTimeString()}
              </span>
            )}
            {votingActive && (
              <span className="text-green-600">
                Voting is active
                {voteCloseTs && ` until ${voteCloseTs.toLocaleDateString()} at ${voteCloseTs.toLocaleTimeString()}`}
              </span>
            )}
            {votingEnded && (
              <span className="text-red-600">
                Voting ended on {voteCloseTs?.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Proposals with votes */}
        {proposals.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No activities proposed for this block yet
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const activityTally = tally.find(t => t.activityId === proposal.activity_id);
              const voteCount = activityTally?.voteCount || 0;
              const hasUserVoted = userVotedActivityIds.has(proposal.activity_id);
              const isSelected = selectedActivities.has(proposal.activity_id);

              return (
                <Card
                  key={proposal.id}
                  className={`border transition-colors ${
                    hasUserVoted ? 'border-blue-300 bg-blue-50' :
                    isSelected ? 'border-green-300 bg-green-50' :
                    'border-gray-200'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm truncate">
                            {proposal.activity?.title}
                          </h4>
                          {hasUserVoted && (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                          {proposal.activity?.category && (
                            <Badge variant="secondary" className="text-xs">
                              {proposal.activity.category}
                            </Badge>
                          )}

                          {proposal.activity?.cost_amount && (
                            <span className="flex items-center gap-1">
                              {formatCurrency(
                                proposal.activity.cost_amount,
                                proposal.activity.cost_currency || "USD"
                              )}
                            </span>
                          )}

                          {proposal.activity?.duration_min && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(proposal.activity.duration_min)}
                            </span>
                          )}
                        </div>

                        {proposal.activity?.notes && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {proposal.activity.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={voteCount > 0 ? "default" : "secondary"}>
                              {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                            </Badge>
                            {voteCount > 0 && activityTally && (
                              <div className="text-xs text-gray-500">
                                {activityTally.votes.map(vote => vote.member?.display_name).join(", ")}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {votingActive && (
                              <>
                                <Button
                                  size="sm"
                                  variant={isSelected ? "secondary" : "outline"}
                                  onClick={() => {
                                    const newSelected = new Set(selectedActivities);
                                    if (isSelected) {
                                      newSelected.delete(proposal.activity_id);
                                    } else {
                                      newSelected.add(proposal.activity_id);
                                    }
                                    setSelectedActivities(newSelected);
                                  }}
                                  className="text-xs"
                                >
                                  {isSelected ? "Deselect" : "Select"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={hasUserVoted ? "default" : "outline"}
                                  onClick={() => handleVoteToggle(proposal.activity_id)}
                                  disabled={voteCast.isPending || voteRemove.isPending}
                                  className="text-xs"
                                >
                                  {hasUserVoted ? "Remove Vote" : "Vote"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bulk voting controls */}
        {votingActive && selectedActivities.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-800">
              {selectedActivities.size} activities selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedActivities(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={handleBulkVote}
                disabled={voteCast.isPending}
              >
                Vote for Selected
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
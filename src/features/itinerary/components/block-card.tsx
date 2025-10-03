"use client";

import {
  Check,
  Clock,
  DollarSign,
  Edit2,
  Gavel,
  MapPin,
  MoreVertical,
  Vote,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlockProposals } from "@/features/activities/hooks/use-proposals";
import { useBlockCommit } from "@/features/voting/hooks/use-block-commit";
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
  dayId: string;
  currentMemberId?: string;
  isOrganizer?: boolean;
}

export function BlockCard({
  block,
  tripId,
  dayId,
  currentMemberId,
  isOrganizer = false,
}: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(block.label);
  const [activeTab, setActiveTab] = useState<"proposals" | "voting" | "commit">(
    "proposals",
  );
  const updateBlockLabel = useUpdateBlockLabel();
  const { data: proposals = [], isLoading: proposalsLoading } =
    useBlockProposals(block.id);
  const { data: existingCommit } = useBlockCommit();

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

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-base font-semibold"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={updateBlockLabel.isPending}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateBlockLabel.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <span>{block.label}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "proposals" | "voting" | "commit")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposals" className="text-xs">
              Proposals
              {proposals.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {proposals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="voting" className="text-xs">
              <Vote className="h-3 w-3 mr-1" />
              Voting
            </TabsTrigger>
            <TabsTrigger value="commit" className="text-xs">
              <Gavel className="h-3 w-3 mr-1" />
              Commit
              {existingCommit && (
                <Badge variant="default" className="ml-1 text-xs bg-green-600">
                  ✓
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-4">
            {proposalsLoading ? (
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="animate-pulse text-gray-500">
                  Loading proposals...
                </div>
              </div>
            ) : proposals.length === 0 ? (
              <div className="min-h-[120px] border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Clock className="h-6 w-6 mb-2 opacity-50" />
                  <p className="text-sm">No activities yet</p>
                  <p className="text-xs mt-1">
                    Add activities to this time block
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-2 truncate">
                            {proposal.activity?.title}
                          </h4>

                          <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                            {proposal.activity?.category && (
                              <Badge variant="secondary" className="text-xs">
                                {proposal.activity.category}
                              </Badge>
                            )}

                            {proposal.activity?.cost_amount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(
                                  proposal.activity.cost_amount,
                                  proposal.activity.cost_currency || "USD",
                                )}
                              </div>
                            )}

                            {proposal.activity?.duration_min && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(proposal.activity.duration_min)}
                              </div>
                            )}
                          </div>

                          {proposal.activity?.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {proposal.activity.location.name}
                              </span>
                            </div>
                          )}

                          {proposal.activity?.notes && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {proposal.activity.notes}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Voting status */}
            {block.vote_open_ts && (
              <div className="mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Voting: {new Date(block.vote_open_ts).toLocaleDateString()}
                  {block.vote_close_ts &&
                    ` - ${new Date(block.vote_close_ts).toLocaleDateString()}`}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="voting" className="mt-4">
            <div className="text-center py-6 text-gray-500">
              <Vote className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Voting functionality will be available here</p>
              <p className="text-xs mt-1">
                Cast votes for your preferred activities
              </p>
            </div>
          </TabsContent>

          <TabsContent value="commit" className="mt-4">
            <div className="text-center py-6 text-gray-500">
              <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Commit functionality will be available here</p>
              <p className="text-xs mt-1">
                Organizers can finalize block decisions
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

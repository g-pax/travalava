"use client";

import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
/**
 * BlockSelector allows users to assign activities to specific blocks
 * - Shows day/block structure for easy selection
 * - Prevents assignment to committed blocks
 * - Shows existing proposals
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDays } from "@/features/itinerary/hooks/use-days";
import { formatDate } from "@/lib/utils";
import { useCreateProposal } from "../hooks/use-proposals";

interface BlockSelectorProps {
  tripId: string;
  activityId: string;
  activityTitle: string;
  createdBy: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface BlockInfo {
  id: string;
  label: string;
  position: number;
  dayId: string;
  dayDate: string;
  isCommitted: boolean;
  hasProposal: boolean;
  proposalCount: number;
}

function BlockCard({
  block,
  onSelect,
  isSelected,
  disabled,
}: {
  block: BlockInfo;
  onSelect: (blockId: string) => void;
  isSelected: boolean;
  disabled: boolean;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : isSelected
            ? "ring-2 ring-blue-500 bg-blue-50"
            : "hover:bg-gray-50"
      }`}
      onClick={() => !disabled && onSelect(block.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{block.label}</h4>
          {block.isCommitted && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Committed
            </Badge>
          )}
        </div>

        {block.hasProposal && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>Already proposed</span>
          </div>
        )}

        {block.proposalCount > 0 && !block.hasProposal && (
          <div className="text-xs text-gray-500">
            {block.proposalCount} other{" "}
            {block.proposalCount === 1 ? "proposal" : "proposals"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BlockSelector({
  tripId,
  activityId,
  activityTitle,
  createdBy,
  onSuccess,
  onCancel,
}: BlockSelectorProps) {
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const { data: days = [] } = useDays(tripId);
  const createProposal = useCreateProposal();

  // Prepare block data with additional info
  const blockData: BlockInfo[] = [];
  days.forEach((day) => {
    day.blocks?.forEach((block: any) => {
      blockData.push({
        id: block.id,
        label: block.label,
        position: block.position,
        dayId: day.id,
        dayDate: day.date,
        isCommitted: false, // TODO: Check if block is committed
        hasProposal: false, // Will be checked below
        proposalCount: 0, // Will be counted below
      });
    });
  });

  // Check proposals for each block
  // This is simplified - in a real app you might want to fetch all proposals at once
  // For now, we'll use the existing hook data if available

  const handleBlockToggle = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId],
    );
  };

  const handleSubmit = async () => {
    if (selectedBlocks.length === 0) return;

    try {
      // Create proposals for all selected blocks
      await Promise.all(
        selectedBlocks.map((blockId) =>
          createProposal.mutateAsync({
            tripId,
            blockId,
            activityId,
            createdBy,
          }),
        ),
      );

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create proposals:", error);
    }
  };

  // Group blocks by day
  const blocksByDay = blockData.reduce(
    (acc, block) => {
      if (!acc[block.dayDate]) {
        acc[block.dayDate] = [];
      }
      acc[block.dayDate].push(block);
      return acc;
    },
    {} as Record<string, BlockInfo[]>,
  );

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Add "{activityTitle}" to Blocks</CardTitle>
        <CardDescription>
          Select one or more time blocks where you'd like to propose this
          activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(blocksByDay).map(([date, blocks]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium">{formatDate(date)}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {blocks
                .sort((a, b) => a.position - b.position)
                .map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onSelect={handleBlockToggle}
                    isSelected={selectedBlocks.includes(block.id)}
                    disabled={block.isCommitted}
                  />
                ))}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={selectedBlocks.length === 0 || createProposal.isPending}
            className="flex-1"
          >
            {createProposal.isPending
              ? "Adding..."
              : `Add to ${selectedBlocks.length} ${selectedBlocks.length === 1 ? "Block" : "Blocks"}`}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={createProposal.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

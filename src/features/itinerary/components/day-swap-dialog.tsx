"use client";

import { ArrowLeftRight, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { useBlockSwap } from "@/features/voting/hooks/use-block-commit";

type CommittedBlock = {
  id: string;
  label: string;
  dayDate: string;
  dayLabel: string;
  activity: {
    id: string;
    title: string;
    category: string | null;
    cost_amount: number | null;
    cost_currency: string | null;
    duration_min: number | null;
  };
};

interface DaySwapDialogProps {
  tripId: string;
  committedBlocks: CommittedBlock[];
  children: React.ReactNode;
}

export function DaySwapDialog({
  tripId,
  committedBlocks,
  children,
}: DaySwapDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedBlock1, setSelectedBlock1] = useState<string>("");
  const [selectedBlock2, setSelectedBlock2] = useState<string>("");
  const blockSwap = useBlockSwap();

  const handleSwap = async () => {
    if (!selectedBlock1 || !selectedBlock2) {
      toast.error("Please select two blocks to swap");
      return;
    }

    if (selectedBlock1 === selectedBlock2) {
      toast.error("Please select different blocks to swap");
      return;
    }

    try {
      const result = await blockSwap.mutateAsync({
        tripId,
        blockId1: selectedBlock1,
        blockId2: selectedBlock2,
      });

      if (result.success) {
        toast.success(result.message || "Activities swapped successfully!");
        setOpen(false);
        setSelectedBlock1("");
        setSelectedBlock2("");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to swap activities");
      console.error("Swap error:", error);
    }
  };

  const getBlockInfo = (blockId: string) => {
    return committedBlocks.find((block) => block.id === blockId);
  };

  const block1Info = selectedBlock1 ? getBlockInfo(selectedBlock1) : null;
  const block2Info = selectedBlock2 ? getBlockInfo(selectedBlock2) : null;

  if (committedBlocks.length < 2) {
    return null; // Don't show swap dialog if less than 2 committed blocks
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Swap Day Activities
          </DialogTitle>
          <DialogDescription>
            Select two committed blocks to swap their activities. This is useful
            when weather or other factors make you want to rearrange your
            itinerary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Block 1 Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">First Block</label>
            <Select value={selectedBlock1} onValueChange={setSelectedBlock1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first block to swap" />
              </SelectTrigger>
              <SelectContent>
                {committedBlocks.map((block) => (
                  <SelectItem
                    key={block.id}
                    value={block.id}
                    disabled={block.id === selectedBlock2}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {block.dayLabel} • {block.label} • {block.activity.title}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {block1Info && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-medium">{block1Info.activity.title}</div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                  <span>{block1Info.dayLabel}</span>
                  <span>•</span>
                  <span>{block1Info.label}</span>
                  {block1Info.activity.category && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {block1Info.activity.category}
                      </Badge>
                    </>
                  )}
                  {block1Info.activity.cost_amount && (
                    <>
                      <span>•</span>
                      <span>
                        {formatCurrency(
                          block1Info.activity.cost_amount,
                          block1Info.activity.cost_currency || "USD",
                        )}
                      </span>
                    </>
                  )}
                  {block1Info.activity.duration_min && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(block1Info.activity.duration_min)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Swap Arrow */}
          {selectedBlock1 && selectedBlock2 && (
            <div className="flex justify-center">
              <ArrowLeftRight className="h-6 w-6 text-gray-400" />
            </div>
          )}

          {/* Block 2 Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Second Block</label>
            <Select value={selectedBlock2} onValueChange={setSelectedBlock2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second block to swap" />
              </SelectTrigger>
              <SelectContent>
                {committedBlocks.map((block) => (
                  <SelectItem
                    key={block.id}
                    value={block.id}
                    disabled={block.id === selectedBlock1}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {block.dayLabel} • {block.label} • {block.activity.title}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {block2Info && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="font-medium">{block2Info.activity.title}</div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                  <span>{block2Info.dayLabel}</span>
                  <span>•</span>
                  <span>{block2Info.label}</span>
                  {block2Info.activity.category && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {block2Info.activity.category}
                      </Badge>
                    </>
                  )}
                  {block2Info.activity.cost_amount && (
                    <>
                      <span>•</span>
                      <span>
                        {formatCurrency(
                          block2Info.activity.cost_amount,
                          block2Info.activity.cost_currency || "USD",
                        )}
                      </span>
                    </>
                  )}
                  {block2Info.activity.duration_min && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(block2Info.activity.duration_min)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedBlock1("");
              setSelectedBlock2("");
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={
              !selectedBlock1 ||
              !selectedBlock2 ||
              selectedBlock1 === selectedBlock2 ||
              blockSwap.isPending
            }
            className="flex-1"
          >
            {blockSwap.isPending ? "Swapping..." : "Swap Activities"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
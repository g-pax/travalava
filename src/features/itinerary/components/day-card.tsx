"use client";

import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { forwardRef } from "react";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";
import { BlockCard } from "./block-card";

interface DayCardProps {
  day: {
    id: string;
    date: string;
    blocks?: Array<{
      id: string;
      label: string;
      position: number;
      vote_open_ts: string | null;
      vote_close_ts: string | null;
    }>;
  };
  tripId: string;
  dayNumber: number;
  currentMember?: CurrentMember | null;
  dayId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const DayCard = forwardRef<HTMLDivElement, DayCardProps>(
  ({ day, tripId, dayNumber, currentMember, isExpanded, onToggle }, ref) => {
    const sortedBlocks =
      day.blocks?.sort((a, b) => a.position - b.position) || [];

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    };

    return (
      <div ref={ref} id={`day-${day.id}`} className="scroll-mt-24 relative">
        {/* Timeline connector line - only show if expanded */}
        {isExpanded && (
          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        )}

        {/* Day header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Timeline dot - clickable */}
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 flex flex-col items-center gap-2 group relative"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            {/* Expand/Collapse indicator */}
            <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 flex items-center justify-center shadow-sm">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </button>

          {/* Day info */}
          <div className="flex-1 pt-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Day {dayNumber}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-0.5">
              {formatDate(day.date)}
            </p>
            {!isExpanded && sortedBlocks.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {sortedBlocks.length} time block
                {sortedBlocks.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Blocks in a cleaner layout - only show if expanded */}
        {isExpanded && (
          <div className="ml-0 sm:ml-16 space-y-6">
            {sortedBlocks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No time blocks scheduled yet
                </p>
              </div>
            ) : (
              sortedBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  tripId={tripId}
                  currentMemberId={currentMember?.id}
                  isOrganizer={currentMember?.role === "organizer"}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);

DayCard.displayName = "DayCard";

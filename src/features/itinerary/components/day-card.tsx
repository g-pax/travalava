"use client";

import { forwardRef } from "react";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";
import { formatDate } from "@/lib/utils";
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
}

/**
 * One day of the trip: a heading plus its time blocks, always expanded so
 * the group's state is readable without clicking around.
 */
export const DayCard = forwardRef<HTMLDivElement, DayCardProps>(
  ({ day, tripId, dayNumber, currentMember }, ref) => {
    const sortedBlocks =
      day.blocks?.sort((a, b) => a.position - b.position) || [];

    return (
      <section ref={ref} id={`day-${day.id}`} className="scroll-mt-24">
        <div className="mb-3 flex items-baseline gap-2.5">
          <h3 className="text-xl font-bold text-foreground">Day {dayNumber}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(day.date)}
          </p>
        </div>

        {sortedBlocks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No time blocks scheduled yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBlocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                tripId={tripId}
                currentMemberId={currentMember?.id}
                isOrganizer={currentMember?.role === "organizer"}
              />
            ))}
          </div>
        )}
      </section>
    );
  },
);

DayCard.displayName = "DayCard";

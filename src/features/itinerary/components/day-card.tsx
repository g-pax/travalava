"use client";

import { Calendar } from "lucide-react";
import { forwardRef } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
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
}

export const DayCard = forwardRef<HTMLDivElement, DayCardProps>(
  ({ day, tripId, dayNumber, currentMember, dayId }, ref) => {
    const sortedBlocks =
      day.blocks?.sort((a, b) => a.position - b.position) || [];

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <AccordionItem
        value={dayId}
        ref={ref}
        id={`day-${day.id}`}
        className="scroll-mt-24 border-0"
      >
        <Card className="overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <div className="text-xl font-semibold">Day {dayNumber}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {formatDate(day.date)}
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 gap-6 pt-2">
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
          </AccordionContent>
        </Card>
      </AccordionItem>
    );
  },
);

DayCard.displayName = "DayCard";

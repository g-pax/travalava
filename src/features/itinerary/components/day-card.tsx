"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockCard } from "./block-card";
import { Calendar } from "lucide-react";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";

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
}

export function DayCard({ day, tripId, dayNumber, currentMember }: DayCardProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <div>
            <div className="text-lg">Day {dayNumber}</div>
            <div className="text-sm font-normal text-gray-600">
              {formatDate(day.date)}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {sortedBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              tripId={tripId}
              dayId={day.id}
              currentMemberId={currentMember?.id}
              isOrganizer={currentMember?.role === "organizer"}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

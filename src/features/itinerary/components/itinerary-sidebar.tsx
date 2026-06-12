"use client";

import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Day {
  id: string;
  date: string;
  blocks?: Array<{
    id: string;
    label: string;
    vote_open_ts: string | null;
    vote_close_ts: string | null;
  }>;
}

interface ItinerarySidebarProps {
  days: Day[];
  activeDayId: string | null;
  onDayClick: (dayId: string) => void;
}

type DayStatus = "empty" | "active" | "partial" | "complete";

function getDayStatus(day: Day): DayStatus {
  if (!day.blocks || day.blocks.length === 0) {
    return "empty";
  }

  const now = new Date();
  let hasActiveVoting = false;
  let hasScheduledVoting = false;

  for (const block of day.blocks) {
    if (block.vote_open_ts) {
      const voteOpenTs = new Date(block.vote_open_ts);
      const voteCloseTs = block.vote_close_ts
        ? new Date(block.vote_close_ts)
        : null;

      if (now >= voteOpenTs && (!voteCloseTs || now <= voteCloseTs)) {
        hasActiveVoting = true;
      } else if (now < voteOpenTs) {
        hasScheduledVoting = true;
      }
    }
  }

  if (hasActiveVoting) return "active";
  if (hasScheduledVoting) return "partial";
  return "empty";
}

function StatusIcon({ status }: { status: DayStatus }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-success-foreground" />;
    case "active":
      return <Clock className="h-4 w-4 text-primary-deep animate-pulse" />;
    case "partial":
      return <Clock className="h-4 w-4 text-warning-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  }
}

export function ItinerarySidebar({
  days,
  activeDayId,
  onDayClick,
}: ItinerarySidebarProps) {
  const formatDayLabel = (date: string, index: number) => {
    // parse date-only strings as local time (UTC parse shifts the day west of UTC)
    const d = new Date(`${date}T00:00:00`);
    return {
      day: `Day ${index + 1}`,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  };

  return (
    <>
      {/* Desktop Sidebar - Sticky */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-2">
          <div className="flex items-center gap-2 mb-4 px-3">
            <Calendar className="h-5 w-5 text-foreground/70" />
            <h3 className="font-semibold text-lg">Days</h3>
          </div>

          <nav className="space-y-1">
            {days.map((day, index) => {
              const {
                day: dayLabel,
                date,
                weekday,
              } = formatDayLabel(day.date, index);
              const status = getDayStatus(day);
              const isActive = day.id === activeDayId;

              return (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => onDayClick(day.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-foreground/80",
                  )}
                >
                  <StatusIcon status={status} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{dayLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {weekday}, {date}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Tabs - Horizontal Scroll */}
      <div className="lg:hidden sticky top-0 z-10 bg-card border-b border-border -mx-4 px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          {days.map((day, index) => {
            const { day: dayLabel } = formatDayLabel(day.date, index);
            const isActive = day.id === activeDayId;

            return (
              <button
                type="button"
                key={day.id}
                onClick={() => onDayClick(day.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground/80 hover:bg-muted dark:bg-foreground/90 dark:text-muted-foreground/50",
                )}
              >
                {dayLabel}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

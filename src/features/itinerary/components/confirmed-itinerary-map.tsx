"use client";

import { MapPin } from "lucide-react";
import { LeafletMap, type MapMarker } from "@/components/common/leaflet-map";
import { cn } from "@/lib/utils";

interface ActivityLocation {
  id: string;
  title: string;
  location: {
    name: string;
    coordinates: [number, number]; // [lng, lat]
  };
  dayDate: string;
  blockLabel: string;
}

interface ConfirmedItineraryMapProps {
  activities: ActivityLocation[];
  className?: string;
}

// Distinct but on-brand day colors (terracotta, teal, success, warning, plus
// supporting hues) so each day's pins read as a group.
const DAY_COLORS = [
  "oklch(0.55 0.15 35)", // coral
  "oklch(0.55 0.095 180)", // teal
  "oklch(0.55 0.15 150)", // green
  "oklch(0.62 0.14 75)", // amber
  "oklch(0.5 0.12 280)", // violet
  "oklch(0.55 0.13 320)", // magenta
  "oklch(0.5 0.13 230)", // blue
  "oklch(0.5 0.1 20)", // brick
];

export function ConfirmedItineraryMap({
  activities,
  className,
}: ConfirmedItineraryMapProps) {
  const withCoords = activities.filter((a) => {
    const c = a.location?.coordinates;
    return (
      Array.isArray(c) &&
      c.length === 2 &&
      Number.isFinite(c[0]) &&
      Number.isFinite(c[1])
    );
  });

  if (withCoords.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted",
          className,
        )}
      >
        <div className="p-6 text-center">
          <MapPin className="mx-auto mb-2 h-12 w-12 text-muted-foreground/70" />
          <p className="text-sm text-foreground/70">
            No activities with locations to map yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a location to a committed activity to see it here
          </p>
        </div>
      </div>
    );
  }

  const uniqueDays = [...new Set(withCoords.map((a) => a.dayDate))].sort();
  const colorForDay = (date: string) =>
    DAY_COLORS[uniqueDays.indexOf(date) % DAY_COLORS.length];

  const markers: MapMarker[] = withCoords.map((a) => {
    const [lng, lat] = a.location.coordinates;
    return {
      id: a.id,
      lat,
      lng,
      title: a.title,
      color: colorForDay(a.dayDate),
      popup: (
        <div className="min-w-[8rem]">
          <p className="text-sm font-semibold">{a.title}</p>
          <p className="text-xs text-foreground/70">{a.location.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{a.blockLabel}</p>
        </div>
      ),
    };
  });

  return (
    <div>
      <LeafletMap markers={markers} className={cn("h-[400px]", className)} />
      <div className="mt-4 flex flex-wrap gap-3">
        {uniqueDays.map((day) => {
          const label = new Date(`${day}T00:00:00`).toLocaleDateString(
            undefined,
            { weekday: "short", month: "short", day: "numeric" },
          );
          const count = withCoords.filter((a) => a.dayDate === day).length;
          return (
            <div key={day} className="flex items-center gap-2 text-xs">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colorForDay(day) }}
              />
              <span className="text-foreground/70">
                {label} ({count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

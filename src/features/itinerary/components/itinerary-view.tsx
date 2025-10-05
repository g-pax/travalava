"use client";

import { Calendar, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ItineraryLoader, ActionButton } from "@/components/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";
import { useCreateDays } from "../hooks/use-create-days";
import { useDays } from "../hooks/use-days";
import { DayCard } from "./day-card";
import { ItinerarySidebar } from "./itinerary-sidebar";

interface ItineraryViewProps {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  currentMember?: CurrentMember | null;
}

export function ItineraryView({
  tripId,
  tripStartDate,
  tripEndDate,
  currentMember,
}: ItineraryViewProps) {
  const { data: days, isLoading, error } = useDays(tripId);
  const createDays = useCreateDays();

  // State for accordion management - using string[] for shadcn Accordion
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // Refs for scroll-to functionality
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize: expand first day by default
  // biome-ignore lint/correctness/useExhaustiveDependencies: This should run only once
  useEffect(() => {
    if (days && days.length > 0 && expandedDays.length === 0) {
      setExpandedDays([days[0].id]);
      setActiveDayId(days[0].id);
    }
  }, []);

  const handleCreateDays = async () => {
    try {
      await createDays.mutateAsync({
        tripId,
        startDate: tripStartDate,
        endDate: tripEndDate,
      });
      toast.success("Itinerary created successfully!");
    } catch (error) {
      toast.error("Failed to create itinerary. Please try again.");
      console.error("Create days error:", error);
    }
  };

  const expandAll = useCallback(() => {
    if (days) {
      setExpandedDays(days.map((d) => d.id));
    }
  }, [days]);

  const collapseAll = useCallback(() => {
    setExpandedDays([]);
  }, []);

  const scrollToDay = useCallback((dayId: string) => {
    const element = dayRefs.current.get(dayId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveDayId(dayId);
      // Expand the day when navigating to it
      setExpandedDays((prev) =>
        prev.includes(dayId) ? prev : [...prev, dayId],
      );
    }
  }, []);

  const setDayRef = useCallback(
    (dayId: string, element: HTMLDivElement | null) => {
      if (element) {
        dayRefs.current.set(dayId, element);
      } else {
        dayRefs.current.delete(dayId);
      }
    },
    [],
  );

  if (isLoading) {
    return <ItineraryLoader />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Itinerary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Failed to load itinerary. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!days || days.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Itinerary</CardTitle>
          <CardDescription>
            Create your trip itinerary to start planning activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 mb-6">
              No itinerary created yet. Generate days and time blocks to start
              planning!
            </p>
            <ActionButton
              onClick={handleCreateDays}
              className="gap-2"
              isPending={createDays.isPending}
              pendingText="Creating..."
            >
              <Plus className="h-4 w-4" />
              Create Itinerary
            </ActionButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allExpanded = days && expandedDays.length === days.length;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <ItinerarySidebar
        days={days || []}
        activeDayId={activeDayId}
        onDayClick={scrollToDay}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Itinerary</h2>
            <div className="text-sm text-muted-foreground mt-1">
              {days?.length || 0} day{days?.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={allExpanded ? collapseAll : expandAll}
              className="gap-2"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Day Cards with Accordion */}
        <Accordion
          type="multiple"
          value={expandedDays}
          onValueChange={setExpandedDays}
          className="space-y-4"
        >
          {days?.map((day, index) => (
            <DayCard
              key={day.id}
              ref={(el) => setDayRef(day.id, el)}
              day={day}
              tripId={tripId}
              dayNumber={index + 1}
              currentMember={currentMember}
              dayId={day.id}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
}

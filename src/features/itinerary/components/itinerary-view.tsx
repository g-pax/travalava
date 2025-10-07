"use client";

import { ArrowLeftRight, Calendar, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionButton, ItineraryLoader } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";
import { useCommittedBlocks } from "@/features/voting/hooks/use-block-commit";
import { useCreateDays } from "../hooks/use-create-days";
import { useDays } from "../hooks/use-days";
import { ConfirmedBlocksView } from "./confirmed-blocks-view";
import { DayCard } from "./day-card";
import { DaySwapDialog } from "./day-swap-dialog";
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
  const { data: committedBlocks = [] } = useCommittedBlocks(tripId);
  const createDays = useCreateDays();

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Refs for scroll-to functionality
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize: set first day as active and expanded by default
  // biome-ignore lint/correctness/useExhaustiveDependencies: This should run only once
  useEffect(() => {
    if (days && days.length > 0 && !activeDayId) {
      setActiveDayId(days[0].id);
      setExpandedDays(new Set([days[0].id]));
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

  const scrollToDay = useCallback((dayId: string) => {
    const element = dayRefs.current.get(dayId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveDayId(dayId);
      // Expand the day when navigating to it
      setExpandedDays((prev) => new Set(prev).add(dayId));
    }
  }, []);

  const toggleDay = useCallback((dayId: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Itinerary</h2>
          <div className="text-sm text-muted-foreground mt-1">
            {days?.length || 0} day{days?.length !== 1 ? "s" : ""} • {committedBlocks.length} confirmed activit{committedBlocks.length !== 1 ? "ies" : "y"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentMember?.role === "organizer" &&
            committedBlocks.length >= 2 && (
              <DaySwapDialog
                tripId={tripId}
                committedBlocks={committedBlocks}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Swap Days
                </Button>
              </DaySwapDialog>
            )}
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planning">Planning View</TabsTrigger>
          <TabsTrigger value="confirmed">
            Final Itinerary
            {committedBlocks.length > 0 && (
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                {committedBlocks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Planning View Tab */}
        <TabsContent value="planning" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <ItinerarySidebar
              days={days || []}
              activeDayId={activeDayId}
              onDayClick={scrollToDay}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-12">
              {days?.map((day, index) => (
                <DayCard
                  key={day.id}
                  ref={(el) => setDayRef(day.id, el)}
                  day={day}
                  tripId={tripId}
                  dayNumber={index + 1}
                  currentMember={currentMember}
                  dayId={day.id}
                  isExpanded={expandedDays.has(day.id)}
                  onToggle={() => toggleDay(day.id)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Confirmed View Tab */}
        <TabsContent value="confirmed" className="mt-6">
          <ConfirmedBlocksView tripId={tripId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

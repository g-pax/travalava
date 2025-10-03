"use client";

import { useDays } from "../hooks/use-days";
import { useCreateDays } from "../hooks/use-create-days";
import { DayCard } from "./day-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import type { CurrentMember } from "@/features/trip/hooks/use-current-member";

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Itinerary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading itinerary...</div>
        </CardContent>
      </Card>
    );
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
            <Button
              onClick={handleCreateDays}
              disabled={createDays.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {createDays.isPending ? "Creating..." : "Create Itinerary"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Itinerary</h2>
        <div className="text-sm text-gray-600">
          {days.length} day{days.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid gap-6">
        {days.map((day, index) => (
          <DayCard
            key={day.id}
            day={day}
            tripId={tripId}
            dayNumber={index + 1}
            currentMember={currentMember}
          />
        ))}
      </div>
    </div>
  );
}

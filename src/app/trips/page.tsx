"use client";

import { Calendar, MapPin, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/auth-guard";
import { PageError } from "@/components/error";
import { TripNav } from "@/components/trip/trip-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCreateForm } from "@/features/trip/components/trip-create-form";
import { useUserTrips } from "@/features/trip/hooks/use-user-trips";
import { formatDate, parseLocalDate } from "@/lib/utils";

function TripCard({ trip, role }: { trip: any; role: string }) {
  const memberCount = trip.trip_members?.length || 0;
  // Parse as local midnight and treat a trip starting today as upcoming
  const startDate = parseLocalDate(trip.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isUpcoming = startDate >= today;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="group hover:border-primary/40 transition-colors cursor-pointer overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-2 text-foreground line-clamp-1 group-hover:text-primary-deep transition-colors">
                {trip.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{trip.destination_text}</span>
              </CardDescription>
            </div>
            <Badge
              variant={role === "organizer" ? "default" : "secondary"}
              className="capitalize flex-shrink-0"
            >
              {role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <div className="p-1.5 rounded-md bg-muted">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Dates</p>
                <p className="text-sm font-medium truncate">
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <div className="p-1.5 rounded-md bg-muted">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Members</p>
                <p className="text-sm font-medium">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">
              {trip.currency}
            </span>
            <Badge
              variant={isUpcoming ? "default" : "secondary"}
              className="text-xs"
            >
              {isUpcoming ? "Upcoming" : "Past"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TripsPageContent() {
  const router = useRouter();
  const { data: tripMemberships, isLoading, error } = useUserTrips();

  const handleTripCreated = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TripNav />

        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <TripNav />
        <PageError
          message="Error Loading Trips"
          description="There was an error loading your trips. Please try again."
          onRetry={() => window.location.reload()}
          showRetry={true}
          showNavigation={false}
        />
      </div>
    );
  }

  const trips =
    tripMemberships
      ?.filter((membership) => membership.trip)
      .map((membership) => ({
        ...membership.trip,
        membershipRole: membership.role,
      })) || [];

  return (
    <div className="min-h-screen bg-background">
      <TripNav />

      {/* Page Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Trips</h1>
          <p className="mt-2 text-foreground/70">
            Manage your trips and create new adventures.
          </p>
        </div>

        {trips.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                No trips yet
              </h3>
              <p className="text-foreground/70 mb-8">
                Get started by creating your first trip or joining an existing
                one.
              </p>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                        <PlusCircle className="h-5 w-5 text-primary-foreground" />
                      </div>
                      Create New Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TripCreateForm onSuccess={handleTripCreated} />
                  </CardContent>
                </Card>

                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-lg bg-teal-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-teal-brand" />
                      </div>
                      Join Existing Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground/70">
                      Have an invite link or trip code?
                    </p>
                    <Link href="/trips/join">
                      <Button variant="outline" className="w-full">
                        Join Trip
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Trips grid
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Trip
                </Button>
              </Link>
            </div>

            {/* Trips Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  role={trip.membershipRole}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <RequireAuth>
      <TripsPageContent />
    </RequireAuth>
  );
}

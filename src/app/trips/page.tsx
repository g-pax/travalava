"use client";

import { Calendar, MapPin, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/auth-guard";
import { Spinner } from "@/components/loading/spinner";
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
import { useAuth } from "@/lib/auth-context";

function TripCard({ trip, role }: { trip: any; role: string }) {
  const memberCount = trip.trip_members?.length || 0;
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const isUpcoming = startDate > new Date();

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{trip.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {trip.destination_text}
              </CardDescription>
            </div>
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
              {role}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {startDate.toLocaleDateString()} -{" "}
                  {endDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {trip.currency} • {isUpcoming ? "Upcoming" : "Past"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TripsPageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { data: tripMemberships, isLoading, error } = useUserTrips();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleTripCreated = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  Travalava
                </span>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </nav>

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Trips</CardTitle>
            <CardDescription>
              There was an error loading your trips. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trips =
    tripMemberships?.map((membership) => ({
      ...membership.trip,
      membershipRole: membership.role,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Travalava</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.user_metadata?.display_name || user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Trips</h1>
          <p className="mt-2 text-gray-600">
            Manage your trips and create new adventures.
          </p>
        </div>

        {trips.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <Calendar className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No trips yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first trip or joining an existing
                one.
              </p>
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PlusCircle className="h-4 w-4" />
                      Create New Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TripCreateForm onSuccess={handleTripCreated} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      Join Existing Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Have an invite link or trip code?
                    </p>
                    <Link href="/join">
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
            <div className="flex gap-4">
              <Link href="/">
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Trip
                </Button>
              </Link>
              <Link href="/join">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Join Trip
                </Button>
              </Link>
            </div>

            {/* Trips Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, index) => (
                <TripCard
                  // biome-ignore lint/suspicious/noArrayIndexKey: safe index
                  key={index}
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, Share2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useCurrentMember } from "@/features/trip/hooks/use-current-member";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface TripLayoutProps {
  children: React.ReactNode;
  tripId: string;
}

const TripLayout = ({ children, tripId }: TripLayoutProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { data: _currentMember } = useCurrentMember(tripId || "");

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members (
            id,
            display_name,
            role
          )
        `)
        .eq("id", tripId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: mounted && Boolean(tripId),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join?tripId=${tripId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  // Show loading state during SSR and initial mount
  if (!mounted || isLoading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Banner Skeleton */}
              <Skeleton className="mb-8 h-52 sm:h-64 md:h-80 rounded-3xl" />

              {/* Header Card Skeleton */}
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-9 w-64 mb-3" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Skeleton */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>

              {/* Loading Message */}
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground text-sm">
                  Loading trip details...
                </p>
              </div>
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error || !trip) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Trip Not Found</CardTitle>
                  <CardDescription>
                    The trip you're looking for doesn't exist or you don't have
                    access to it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/">
                    <Button>Go Home</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  console.log(trip);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Trip Banner */}
            <div className="relative mb-8 h-52 overflow-hidden rounded-3xl bg-gray-900 sm:h-64 md:h-80">
              <Image
                src="https://images.unsplash.com/photo-1706722533137-dd3c3f06c624?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt={`${trip.name} banner`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {trip.name}
                </h1>
                {trip.destination_text ? (
                  <p className="mt-3 text-lg font-medium text-white/90">
                    {trip.destination_text}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Trip Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Link href="/trips">
                        <Button variant="ghost" size="sm" className="p-2">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                      <CardTitle className="text-3xl">{trip.name}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-lg ml-11">
                      <MapPin className="h-4 w-4" />
                      {trip.destination_text}
                    </CardDescription>
                  </div>
                  <Button onClick={generateInviteLink} variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(trip.start_date).toLocaleDateString()} -{" "}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {trip.trip_members?.length || 0} members
                    </span>
                  </div>
                  <div className="text-sm">Currency: {trip.currency}</div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <nav className="flex gap-4">
                  <Link
                    href={`/trip/${tripId}/itinerary`}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname?.includes("/itinerary")
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Itinerary
                  </Link>
                  <Link
                    href={`/trip/${tripId}/activities`}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname?.includes("/activities")
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Activities
                  </Link>
                </nav>
              </CardContent>
            </Card>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
};

export default TripLayout;

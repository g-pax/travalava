"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/auth-guard";
import { TripNav } from "@/components/trip/trip-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentMember } from "@/features/trip/hooks/use-current-member";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

interface TripLayoutProps {
  children: React.ReactNode;
  tripId: string;
}

interface TripMemberSummary {
  id: string;
  display_name: string;
  role: string;
}

/**
 * Shared shell for all trip pages: sticky app nav plus a compact trip header
 * (name, destination, dates, members, share) so content starts immediately.
 */
const TripLayout = ({ children, tripId }: TripLayoutProps) => {
  const [mounted, setMounted] = useState(false);
  const { data: currentMember } = useCurrentMember(tripId || "");
  const isOrganizer = currentMember?.role === "organizer";

  const {
    data: trip,
    isLoading,
    error,
    isPending,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
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

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/trips/join?tripId=${tripId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  // Show loading state during SSR, initial mount, or while fetching.
  // Don't include !trip here: a null trip means "not found" and must fall
  // through to the error card instead of an infinite skeleton.
  const isLoadingData = !mounted || isLoading || isPending;

  if (isLoadingData) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <TripNav tripId={tripId} />
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mx-auto max-w-6xl py-6">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="mb-3 h-9 w-72" />
                <Skeleton className="h-5 w-96" />
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-6xl space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error || !trip) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
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

  const members: TripMemberSummary[] = Array.isArray(trip.trip_members)
    ? (trip.trip_members as TripMemberSummary[])
    : [];

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <TripNav tripId={tripId} />

        {/* Compact trip header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-4 py-5 sm:py-6">
              <div className="min-w-0">
                <Link
                  href="/trips"
                  className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  All trips
                </Link>
                <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {trip.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
                  {trip.destination_text && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-teal-brand" />
                      {trip.destination_text}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-brand" />
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                  </span>
                  <span className="text-muted-foreground">{trip.currency}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {members.length > 0 && (
                  <TooltipProvider>
                    <div className="flex -space-x-2">
                      {members.slice(0, 5).map((member) => (
                        <Tooltip key={member.id} delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-card transition-transform duration-150 hover:z-10 hover:scale-110">
                              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                {member.display_name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{member.display_name}</p>
                            {member.role && (
                              <p className="text-xs capitalize text-muted-foreground">
                                {member.role}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {members.length > 5 && (
                        <Avatar className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                            +{members.length - 5}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </TooltipProvider>
                )}

                {isOrganizer && (
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Share2 className="h-4 w-4" />
                    Invite
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
};

export default TripLayout;

"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, Share2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/auth-guard";
import { Spinner } from "@/components/loading/spinner";
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

interface TripLayoutProps {
  children: React.ReactNode;
  tripId: string;
}

const TripLayout = ({ children, tripId }: TripLayoutProps) => {
  const [mounted, setMounted] = useState(false);
  const { data: _currentMember } = useCurrentMember(tripId || "");

  const {
    data: trip,
    isLoading,
    error,
    isPending,
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

  // Show loading state during SSR, initial mount, or when data is being fetched
  const isLoadingData = !mounted || isLoading || !trip || isPending;

  if (isLoadingData) {
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

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Trip Navigation */}
        <TripNav tripId={tripId} />
        {/* Trip Header Section */}
        <div className="py-12">
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
                        {Array.isArray(trip.trip_members)
                          ? trip.trip_members.length
                          : 0}{" "}
                        {trip.trip_members?.length === 1 ? "member" : "members"}
                      </span>
                      {Array.isArray(trip.trip_members) &&
                        trip.trip_members.length > 0 && (
                          <TooltipProvider>
                            <div className="flex -space-x-2 overflow-hidden">
                              {trip.trip_members
                                .slice(0, 5)
                                .map((member: any) => (
                                  <Tooltip key={member.id} delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-950 cursor-pointer transition-transform hover:scale-110 hover:z-10">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
                                          {member.display_name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">
                                        {member.display_name}
                                      </p>
                                      {member.role && (
                                        <p className="text-xs text-muted-foreground capitalize">
                                          {member.role}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              {trip.trip_members.length > 5 && (
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-950 cursor-pointer">
                                      <AvatarFallback className="bg-gray-400 text-xs font-medium text-white">
                                        +{trip.trip_members.length - 5}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm">
                                      {trip.trip_members.length - 5} more{" "}
                                      {trip.trip_members.length - 5 === 1
                                        ? "member"
                                        : "members"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        )}
                    </div>
                    <div className="text-sm">Currency: {trip.currency}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
};

export default TripLayout;

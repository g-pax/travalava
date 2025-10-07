"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { formatDate } from "@/lib/utils";

interface TripLayoutProps {
  children: React.ReactNode;
  tripId: string;
}

const TripLayout = ({ children, tripId }: TripLayoutProps) => {
  const navigate = useRouter();
  const pathname = usePathname();
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
    const inviteUrl = `${window.location.origin}/trips/join?tripId=${tripId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  const generateBreadcrumbs = () => {
    const breadcrumbs = [
      { label: "All Trips", href: "/trips" },
      { label: trip?.name || "Trip", href: `/trips/${tripId}` },
    ];

    if (pathname?.includes("/itinerary")) {
      breadcrumbs.push({
        label: "Itinerary",
        href: `/trips/${tripId}/itinerary`,
      });
    } else if (pathname?.includes("/activities")) {
      breadcrumbs.push({
        label: "Activities",
        href: `/trips/${tripId}/activities`,
      });

      const activityIdMatch = pathname?.match(/\/activities\/([^/]+)$/);
      if (activityIdMatch) {
        breadcrumbs.push({
          label: "Activity Details",
          href: `/trips/${tripId}/activities/${activityIdMatch[1]}`,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

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
        {/* Trip Navigation overlaid on banner */}
        <TripNav tripId={tripId} />

        {/* Full-width Trip Banner */}
        <div className="relative h-52 overflow-hidden bg-gray-900 sm:h-64 md:h-[600px] -translate-y-14">
          <Image
            src="https://images.unsplash.com/photo-1706722533137-dd3c3f06c624?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={`${trip.name} banner`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Navigation buttons on the image */}
          <div className="absolute top-14 left-0 right-0 z-20">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between pt-4 sm:pt-6">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => navigate.back()}
                      variant="ghost"
                      size="sm"
                      className="gap-2 bg-black/40 hover:bg-black/60 hover:text-white text-white border border-white/20 backdrop-blur-sm self-start"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-white/80">
                      {breadcrumbs.map((breadcrumb, index) => (
                        <div
                          key={breadcrumb.href}
                          className="flex items-center"
                        >
                          {index === breadcrumbs.length - 1 ? (
                            <span className="text-white font-medium">
                              {breadcrumb.label}
                            </span>
                          ) : (
                            <>
                              <Link
                                href={breadcrumb.href}
                                className="hover:text-white transition-colors"
                              >
                                {breadcrumb.label}
                              </Link>
                              <ChevronRight className="h-4 w-4 mx-2 text-white/60" />
                            </>
                          )}
                        </div>
                      ))}
                    </nav>
                  </div>

                  <Button
                    onClick={generateInviteLink}
                    variant="ghost"
                    size="sm"
                    className="gap-2 bg-black/40 hover:bg-black/60 hover:text-white text-white border border-white/20 backdrop-blur-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Trip title and location */}
          <div className="relative z-10 flex h-full flex-col justify-end text-white">
            <div className="container mx-auto px-4 sm:px-6 pb-6">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {trip.name}
                </h1>
                {trip.destination_text ? (
                  <p className="mt-3 text-lg font-medium text-white/90 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {trip.destination_text}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Trip Metadata Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="py-4">
                {/* Trip metadata in organized sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Dates */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        Dates
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {formatDate(trip.start_date)} -{" "}
                        {formatDate(trip.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        Members
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {Array.isArray(trip.trip_members)
                            ? trip.trip_members.length
                            : 0}{" "}
                          {trip.trip_members?.length === 1
                            ? "member"
                            : "members"}
                        </p>
                        {Array.isArray(trip.trip_members) &&
                          trip.trip_members.length > 0 && (
                            <TooltipProvider>
                              <div className="flex -space-x-2">
                                {trip.trip_members
                                  .slice(0, 5)
                                  .map((member: any) => (
                                    <Tooltip
                                      key={member.id}
                                      delayDuration={300}
                                    >
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-900 cursor-pointer transition-transform hover:scale-110 hover:z-10">
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
                                      <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-900 cursor-pointer">
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
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <div className="h-5 w-5 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                        {trip.currency?.charAt(0) || "$"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        Currency
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {trip.currency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

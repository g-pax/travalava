"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Share2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivitiesManager } from "@/features/activities/components/activities-manager";
import { ItineraryView } from "@/features/itinerary/components/itinerary-view";
import { useCurrentMember } from "@/features/trip/hooks/use-current-member";
import { supabase } from "@/lib/supabase";

interface TripPageProps {
  params: { tripId: string };
}

const TripPage = ({ params }: TripPageProps) => {
  const { tripId } = params;

  const { data: currentMember } = useCurrentMember(tripId);

  const {
    data: trip,
    isLoading,
    error,
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
        .single();

      if (error) throw error;
      return data;
    },
  });
  console.log("🚀 ~ TripPage ~ trip:", trip)


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading trip details...</div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
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
    );
  }

  const generateInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join?tripId=${tripId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
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
                  <CardTitle className="text-3xl mb-2">{trip.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-lg">
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

          {/* Trip Members */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Trip Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.trip_members?.map(
                  (member: {
                    id: string;
                    display_name: string;
                    role: string;
                  }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">{member.display_name}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {member.role}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="itinerary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="itinerary" className="mt-6">
              <ItineraryView
                tripId={tripId}
                tripStartDate={trip.start_date}
                tripEndDate={trip.end_date}
                currentMember={currentMember}
              />
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <ActivitiesManager
                tripId={tripId}
                tripCurrency={trip.currency}
                currentUserId="current-user-id" // TODO: Get from auth context
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default TripPage;

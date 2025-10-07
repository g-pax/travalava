"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TripJoinForm } from "@/features/trip/components/trip-join-form";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");

  const handleJoinSuccess = (_memberId: string) => {
    if (tripId) {
      router.push(`/trips/${tripId}`);
    }
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border-2 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl">Trip ID Required</CardTitle>
                <CardDescription className="text-base mt-2">
                  Please use a valid invite link to join a trip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  The trip ID should be included in your invite link. If you
                  received an invite, please click on that link.
                </p>
                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/" className="w-full">
                    <Button variant="outline" className="w-full">
                      Go back to home
                    </Button>
                  </Link>
                  <Link href="/trips" className="w-full">
                    <Button className="w-full">View all trips</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Join Trip</CardTitle>
              <CardDescription className="text-base mt-2">
                Enter your details to join this trip
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TripJoinForm tripId={tripId} onSuccess={handleJoinSuccess} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}

"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
      router.push(`/trip/${tripId}`);
    }
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Join Trip
                </CardTitle>
                <CardDescription>Trip ID is required to join</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Please use a valid invite link or provide a trip ID in the
                  URL.
                </p>
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Go back to home
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Trip
              </CardTitle>
              <CardDescription>
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

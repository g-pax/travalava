"use client";

import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TripCreateForm } from "@/features/trip/components/trip-create-form";

export default function Home() {
  const router = useRouter();

  const handleTripCreated = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Travalava
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plan your perfect trip collaboratively with friends and family
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New Trip
              </CardTitle>
              <CardDescription>
                Start planning a new adventure with your group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TripCreateForm onSuccess={handleTripCreated} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Existing Trip
              </CardTitle>
              <CardDescription>
                Have an invite link? Join your friends' trip here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                If you have an invite link, click it to join the trip directly.
                Or enter the trip code below:
              </p>
              <Link href="/join">
                <Button variant="outline" className="w-full">
                  Join with Trip Code
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

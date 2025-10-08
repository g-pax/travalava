"use client";

import { Calendar, MapPin, PlusCircle, Users } from "lucide-react";
/**
 * Home page that shows different content for authenticated and unauthenticated users
 * - Landing page for guests with auth CTA
 * - Dashboard for authenticated users with their trips
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLoader } from "@/components/loading";
import { TripNav } from "@/components/trip/trip-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TripCreateForm } from "@/features/trip/components/trip-create-form";
import { useAuth } from "@/lib/auth-context";

function LandingPage() {
  return (
    <div className="text-8xl text-center">
      Coming soon after Anto stops harassing me
    </div>
  );
  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  //     {/* Navigation */}
  //     <nav className="flex items-center justify-between px-6 py-4">
  //       <div className="flex items-center space-x-2">
  //         <Calendar className="h-8 w-8 text-blue-600" />
  //         <span className="text-xl font-bold text-gray-900">Travalava</span>
  //       </div>
  //       <div className="flex items-center space-x-4">
  //         <Link href="/auth/login">
  //           <Button variant="ghost">Sign In</Button>
  //         </Link>
  //         <Link href="/auth/register">
  //           <Button>Get Started</Button>
  //         </Link>
  //       </div>
  //     </nav>

  //     {/* Hero Section */}
  //     <div className="px-6 py-20">
  //       <div className="mx-auto max-w-4xl text-center">
  //         <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
  //           Plan Amazing Trips <span className="text-blue-600">Together</span>
  //         </h1>
  //         <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
  //           Collaborate with friends and family to create the perfect itinerary.
  //           Vote on activities, manage expenses, and make memories that last a
  //           lifetime.
  //         </p>
  //         <div className="mt-10 flex items-center justify-center gap-x-6">
  //           <Link href="/auth/register">
  //             <Button size="lg" className="px-8">
  //               Start Planning
  //             </Button>
  //           </Link>
  //           <Link
  //             href="/auth/login"
  //             className="text-sm font-semibold leading-6 text-gray-900"
  //           >
  //             Already have an account? <span aria-hidden="true">→</span>
  //           </Link>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Features */}
  //     <div className="px-6 py-16">
  //       <div className="mx-auto max-w-6xl">
  //         <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
  //           <Card>
  //             <CardHeader>
  //               <Users className="h-8 w-8 text-blue-600 mb-2" />
  //               <CardTitle>Collaborative Planning</CardTitle>
  //               <CardDescription>
  //                 Invite friends and family to plan together. Everyone can
  //                 contribute ideas and vote on activities.
  //               </CardDescription>
  //             </CardHeader>
  //           </Card>

  //           <Card>
  //             <CardHeader>
  //               <Calendar className="h-8 w-8 text-blue-600 mb-2" />
  //               <CardTitle>Smart Scheduling</CardTitle>
  //               <CardDescription>
  //                 Organize your trip by days and time blocks. Vote on activities
  //                 and let the group decide.
  //               </CardDescription>
  //             </CardHeader>
  //           </Card>

  //           <Card>
  //             <CardHeader>
  //               <MapPin className="h-8 w-8 text-blue-600 mb-2" />
  //               <CardTitle>Location Integration</CardTitle>
  //               <CardDescription>
  //                 Add locations with Google Maps integration. Get directions and
  //                 weather information.
  //               </CardDescription>
  //             </CardHeader>
  //           </Card>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}

function UserDashboard() {
  const router = useRouter();

  const handleTripCreated = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation */}
      <TripNav />

      {/* Dashboard Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Your Trips
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Create a new trip or continue planning an existing one.
          </p>
        </div>

        {/* Trip Management */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg">
                  <PlusCircle className="h-4 w-4 text-white" />
                </div>
                Create New Trip
              </CardTitle>
              <CardDescription className="text-base">
                Start planning a new adventure with your group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TripCreateForm onSuccess={handleTripCreated} />
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Join Existing Trip
              </CardTitle>
              <CardDescription className="text-base">
                Have an invite link? Join your friends' trip here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have an invite link, click it to join the trip directly.
                Or enter the trip code below:
              </p>
              <Link href="/trips/join">
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

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  return user ? <UserDashboard /> : <LandingPage />;
}

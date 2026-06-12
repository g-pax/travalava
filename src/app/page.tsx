"use client";

import { Calendar, MapPin, PlusCircle, Users, Vote } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-xl font-bold text-foreground">Travalava</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Plan the trip <span className="text-primary-deep">together</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground/75">
            One place for the whole group: propose activities, vote on what to
            do each morning, afternoon, and evening — and lock in an itinerary
            everyone actually agreed on.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/register">
              <Button size="lg" className="px-8">
                Start Planning
              </Button>
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-semibold leading-6 text-foreground hover:text-primary-deep transition-colors"
            >
              Already have an account? <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* How it works — a real sequence, so the numbers carry meaning */}
      <div className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <ol className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </span>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-brand" />
                  Everyone proposes
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-foreground/70">
                  Invite the group with one link. Anyone can pitch activities
                  and restaurants for any part of the trip.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </span>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Vote className="h-4 w-4 text-teal-brand" />
                  The group votes
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-foreground/70">
                  Each day splits into morning, afternoon, and evening blocks.
                  Votes decide what wins — not the loudest voice.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </span>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-brand" />
                  Lock it in
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-foreground/70">
                  Winners get committed into a clean final itinerary — one
                  shared plan the whole group owns.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function UserDashboard() {
  const router = useRouter();

  const handleTripCreated = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <TripNav />

      {/* Dashboard Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground">Your Trips</h1>
          <p className="mt-3 text-lg text-foreground/70">
            Create a new trip or continue planning an existing one.
          </p>
        </div>

        {/* Trip Management */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <PlusCircle className="h-4 w-4 text-primary-foreground" />
                </span>
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

          <Card className="transition-colors hover:border-teal-brand/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-muted">
                  <Users className="h-4 w-4 text-teal-brand" />
                </span>
                Join Existing Trip
              </CardTitle>
              <CardDescription className="text-base">
                Have an invite link? Join your friends' trip here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/70">
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

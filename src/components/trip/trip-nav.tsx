"use client";

import { Calendar, Home, MapPin, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface TripNavProps {
  tripId?: string;
}

export function TripNav({ tripId }: TripNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Determine if we're on a trip-specific page
  const isOnTripPage = pathname?.includes("/trips/") && tripId;

  const navItems = [
    {
      href: "/trips",
      label: "All Trips",
      icon: Home,
      isActive: pathname === "/trips",
      show: true,
    },
    {
      href: `/trips/${tripId}/itinerary`,
      label: "Itinerary",
      icon: Calendar,
      isActive: pathname?.includes("/itinerary"),
      show: isOnTripPage,
    },
    {
      href: `/trips/${tripId}/activities`,
      label: "Activities",
      icon: MapPin,
      isActive: pathname?.includes("/activities"),
      show: isOnTripPage,
    },
    {
      href: `/trips/${tripId}/restaurants`,
      label: "Restaurants",
      icon: UtensilsCrossed,
      isActive: pathname?.includes("/restaurants"),
      show: isOnTripPage,
    },
  ].filter((item) => item.show);

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline text-lg sm:text-xl font-bold text-foreground">
              Travalava
            </span>
          </Link>

          {/* Navigation - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1 rounded-full bg-muted p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-medium transition-colors duration-150",
                      item.isActive
                        ? "bg-background text-primary-deep shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User & Logout - Right */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="text-xs sm:text-sm text-muted-foreground max-w-[100px] sm:max-w-none truncate">
              {user?.user_metadata?.display_name || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs sm:text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

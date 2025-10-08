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
    <nav className="sticky top-0 z-40 w-full bg-white/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-2">
            <Calendar
              className={cn(
                "h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400",
                {
                  "text-black": isOnTripPage,
                },
              )}
            />
            <span
              className={cn(
                "text-lg sm:text-xl font-bold text-gray-900 dark:text-white",
                {
                  "text-black": isOnTripPage,
                },
              )}
            >
              Travalava
            </span>
          </Link>

          {/* Navigation - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-200",
                      item.isActive
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50",
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
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-[100px] sm:max-w-none truncate">
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

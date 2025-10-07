"use client";

import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TripNavProps {
  tripId: string;
}

export function TripNav({ tripId }: TripNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: `/trip/${tripId}/itinerary`,
      label: "Itinerary",
      icon: Calendar,
      isActive: pathname?.includes("/itinerary"),
    },
    {
      href: `/trip/${tripId}/activities`,
      label: "Activities",
      icon: MapPin,
      isActive: pathname?.includes("/activities"),
    },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-center">
          <div className="flex items-center space-x-1 rounded-full bg-gray-100 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    item.isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
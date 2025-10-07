"use client";

/**
 * ActivityEntryModeToggle allows users to choose between manual entry and Google Places search
 * - Preserves existing manual entry functionality
 * - Adds Google Places integration as an option
 * - Provides smooth switching between modes
 */

import { Edit3, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityEntryModeToggleProps {
  manualEntryComponent: React.ReactNode;
  googlePlacesComponent: React.ReactNode;
  defaultMode?: "manual" | "google";
  disabled?: boolean;
}

export function ActivityEntryModeToggle({
  manualEntryComponent,
  googlePlacesComponent,
  defaultMode = "manual",
  disabled = false,
}: ActivityEntryModeToggleProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Add Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="google"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Google Places
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                🔍 Search for activities, attractions, and restaurants using
                Google Places data. Get verified information including ratings,
                photos, and contact details.
              </div>
              {googlePlacesComponent}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                ✏️ Enter activity details manually. You can still add Google Maps
                location links for coordinates extraction.
              </div>
              {manualEntryComponent}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Restaurant-specific version
 */
export function RestaurantEntryModeToggle({
  manualEntryComponent,
  googlePlacesComponent,
  defaultMode = "manual",
  disabled = false,
}: ActivityEntryModeToggleProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Add Restaurant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="google"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Google Places
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                🍽️ Search for restaurants using Google Places data. Get verified
                information including ratings, reviews, photos, and contact
                details.
              </div>
              {googlePlacesComponent}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                ✏️ Enter restaurant details manually if you prefer or if the
                place isn't found in Google Places.
              </div>
              {manualEntryComponent}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  Link as LinkIcon,
  Plus,
  Unlink,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  useLinkRestaurantToActivity,
  useRestaurant,
  useUnlinkRestaurantFromActivity,
} from "../hooks/use-restaurants";

interface ActivityLinkManagerProps {
  restaurantId: string;
  tripId: string;
}

interface Activity {
  id: string;
  title: string;
  category?: string;
}

export function ActivityLinkManager({
  restaurantId,
  tripId,
}: ActivityLinkManagerProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const { data: restaurant } = useRestaurant(restaurantId);
  const linkRestaurant = useLinkRestaurantToActivity();
  const unlinkRestaurant = useUnlinkRestaurantFromActivity();

  // Fetch all activities for this trip
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities", tripId],
    enabled: !!tripId,
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, title, category")
        .eq("trip_id", tripId)
        .order("title");

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      return data || [];
    },
  });

  const linkedActivityIds = new Set(
    restaurant?.activity_links?.map((link) => link.activity_id) || [],
  );

  const handleLinkActivity = async (activityId: string) => {
    try {
      await linkRestaurant.mutateAsync({
        activity_id: activityId,
        restaurant_id: restaurantId,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUnlinkActivity = async (activityId: string) => {
    try {
      await unlinkRestaurant.mutateAsync({
        activity_id: activityId,
        restaurant_id: restaurantId,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const linkedActivities = activities.filter((activity) =>
    linkedActivityIds.has(activity.id),
  );

  const availableActivities = activities.filter(
    (activity) => !linkedActivityIds.has(activity.id),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Linked Activities
            </CardTitle>
            <CardDescription>
              Activities where this restaurant is recommended
            </CardDescription>
          </div>
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link to Activities</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="text-center py-4">Loading activities...</div>
                ) : availableActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-600">
                    {activities.length === 0
                      ? "No activities found for this trip"
                      : "Already linked to all activities"}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.category && (
                            <p className="text-sm text-gray-600">
                              {activity.category}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkActivity(activity.id)}
                          disabled={linkRestaurant.isPending}
                          className="flex items-center gap-2"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {linkedActivities.length === 0 ? (
          <div className="text-center py-6 text-gray-600">
            <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Not linked to any activities yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  {activity.category && (
                    <p className="text-xs text-gray-600">{activity.category}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkActivity(activity.id)}
                  disabled={unlinkRestaurant.isPending}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

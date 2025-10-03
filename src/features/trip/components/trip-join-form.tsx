"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type JoinTripInput, JoinTripSchema } from "@/schemas";
import { useJoinTrip } from "../hooks/use-join-trip";

interface TripJoinFormProps {
  tripId: string;
  onSuccess?: (memberId: string) => void;
}

export function TripJoinForm({ tripId, onSuccess }: TripJoinFormProps) {
  const joinTrip = useJoinTrip();

  const form = useForm<JoinTripInput>({
    resolver: zodResolver(JoinTripSchema),
    defaultValues: {
      tripId,
      clientDeviceId: nanoid(), // Generate unique device ID
    },
  });

  const onSubmit = async (values: JoinTripInput) => {
    try {
      const result = await joinTrip.mutateAsync(values);
      toast.success("Successfully joined the trip!");
      onSuccess?.(result.member.id);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to join trip. Please try again.");
      }
      console.error("Join trip error:", error);
    }
  };
  console.log(form.formState.errors)
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input
          id="displayName"
          placeholder="Enter your display name"
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName && (
          <p className="text-sm text-red-600">
            {form.formState.errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pin">Trip PIN</Label>
        <Input
          id="pin"
          type="password"
          placeholder="Enter the trip PIN"
          {...form.register("pin")}
        />
        {form.formState.errors.pin && (
          <p className="text-sm text-red-600">
            {form.formState.errors.pin.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={joinTrip.isPending}>
        {joinTrip.isPending ? "Joining..." : "Join Trip"}
      </Button>
    </form>
  );
}

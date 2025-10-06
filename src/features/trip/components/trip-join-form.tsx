"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionButton } from "@/components/loading";
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
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: {
      tripId,
      clientDeviceId: nanoid(), // Generate unique device ID
    },
  });

  const onSubmit = async (values: JoinTripInput) => {
    try {
      const result = await joinTrip.mutateAsync(values);
      toast.success("Successfully joined the trip!");
      form.reset();
      onSuccess?.(result.member.id);
    } catch (error) {
      // Clear any previous submission errors
      form.clearErrors();

      if (error instanceof Error) {
        toast.error(error.message);

        // Set field-specific errors if applicable
        if (error.message.toLowerCase().includes("pin")) {
          form.setError("pin", { message: error.message });
        } else if (error.message.toLowerCase().includes("name")) {
          form.setError("displayName", { message: error.message });
        }
      } else {
        toast.error("Failed to join trip. Please try again.");
      }
      console.error("Join trip error:", error);
    }
  };
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

      <ActionButton
        type="submit"
        className="w-full"
        isPending={joinTrip.isPending}
        pendingText="Joining..."
      >
        Join Trip
      </ActionButton>
    </form>
  );
}

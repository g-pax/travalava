"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionButton } from "@/components/loading";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { type JoinTripInput, JoinTripSchema } from "@/schemas";
import { useJoinTrip } from "../hooks/use-join-trip";

interface TripJoinFormProps {
  tripId: string;
  onSuccess?: (memberId: string) => void;
}

export function TripJoinForm({ tripId, onSuccess }: TripJoinFormProps) {
  const joinTrip = useJoinTrip();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<JoinTripInput>({
    resolver: zodResolver(JoinTripSchema),
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: {
      tripId,
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      pin: "",
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
        } else if (error.message.toLowerCase().includes("email")) {
          form.setError("email", { message: error.message });
        } else if (error.message.toLowerCase().includes("password")) {
          form.setError("password", { message: error.message });
        }
      } else {
        toast.error("Failed to join trip. Please try again.");
      }
      console.error("Join trip error:", error);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-600">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pin">Trip PIN</Label>
        <InputOTP
          maxLength={4}
          value={form.watch("pin")}
          onChange={(value) => form.setValue("pin", value)}
          className="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
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
        pendingText="Creating account and joining..."
      >
        Create Account & Join Trip
      </ActionButton>
    </form>
  );
}

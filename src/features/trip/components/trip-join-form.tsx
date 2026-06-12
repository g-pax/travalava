"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionButton } from "@/components/loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { type JoinTripInput, JoinTripSchema } from "@/schemas";
import { useJoinTrip, useTripJoinInfo } from "../hooks/use-join-trip";

interface TripJoinFormProps {
  tripId: string;
  onSuccess?: (memberId: string) => void;
}

/**
 * Join form for invite links. Signed-in users only pick a display name (and
 * PIN when the trip requires one); visitors also create an account inline.
 */
export function TripJoinForm({ tripId, onSuccess }: TripJoinFormProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: joinInfo, isPending: infoPending } = useTripJoinInfo(tripId);
  const joinTrip = useJoinTrip();

  const isAuthenticated = !!user;
  const requiresPin = !!joinInfo?.requires_pin;

  const form = useForm<JoinTripInput>({
    resolver: zodResolver(JoinTripSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      tripId,
      displayName: "",
      isAuthenticated: false,
      email: "",
      password: "",
      confirmPassword: "",
      requiresPin: false,
      pin: "",
    },
  });

  // Keep schema context flags in sync with session/trip state.
  useEffect(() => {
    form.setValue("isAuthenticated", isAuthenticated);
  }, [isAuthenticated, form]);
  useEffect(() => {
    form.setValue("requiresPin", requiresPin);
  }, [requiresPin, form]);

  const onSubmit = async (values: JoinTripInput) => {
    try {
      const result = await joinTrip.mutateAsync(values);
      toast.success("Successfully joined the trip!");
      onSuccess?.(result.member.id);
    } catch (error) {
      form.clearErrors();
      const message =
        error instanceof Error
          ? error.message
          : "Failed to join trip. Please try again.";
      toast.error(message);

      const lower = message.toLowerCase();
      if (lower.includes("pin")) {
        form.setError("pin", { message });
      } else if (lower.includes("email")) {
        form.setError("email", { message });
      } else if (lower.includes("password")) {
        form.setError("password", { message });
      }
    }
  };

  if (authLoading || infoPending) {
    return (
      <p className="text-sm text-foreground/70 text-center py-8">
        Loading trip details…
      </p>
    );
  }

  if (joinInfo === null) {
    return (
      <p className="text-sm text-destructive text-center py-8">
        This invite link doesn't match any trip. Ask the organizer for a new
        link.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {joinInfo && (
        <div className="rounded-md bg-teal-muted p-3 text-sm">
          <p className="font-medium">{joinInfo.name}</p>
          <p className="text-foreground/70">
            {joinInfo.destination_text} · {joinInfo.start_date} →{" "}
            {joinInfo.end_date}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input
          id="displayName"
          placeholder="Enter your display name"
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        )}
      </div>

      {!isAuthenticated && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <PasswordField
            form={form}
            name="password"
            label="Password"
            placeholder="Create a strong password"
          />
          <PasswordField
            form={form}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
          />
        </>
      )}

      {requiresPin && (
        <div className="space-y-2">
          <Label htmlFor="pin">Trip PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="Enter the trip PIN (4-8 digits)"
            {...form.register("pin")}
          />
          {form.formState.errors.pin && (
            <p className="text-sm text-destructive">
              {form.formState.errors.pin.message}
            </p>
          )}
        </div>
      )}

      <ActionButton
        type="submit"
        className="w-full"
        isPending={joinTrip.isPending}
        pendingText={isAuthenticated ? "Joining..." : "Creating account..."}
      >
        {isAuthenticated ? "Join Trip" : "Create Account & Join Trip"}
      </ActionButton>
    </form>
  );
}

function PasswordField({
  form,
  name,
  label,
  placeholder,
}: {
  form: ReturnType<typeof useForm<JoinTripInput>>;
  name: "password" | "confirmPassword";
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <PasswordInput form={form} name={name} placeholder={placeholder} />
      {form.formState.errors[name] && (
        <p className="text-sm text-destructive">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  form,
  name,
  placeholder,
}: {
  form: ReturnType<typeof useForm<JoinTripInput>>;
  name: "password" | "confirmPassword";
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        {...form.register(name)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

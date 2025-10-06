"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionButton } from "@/components/loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type TripCreateInput, TripCreateSchema } from "@/schemas";
import { useCreateTrip } from "../hooks/use-create-trip";

interface TripCreateFormProps {
  onSuccess?: (tripId: string) => void;
}

export function TripCreateForm({ onSuccess }: TripCreateFormProps) {
  const createTrip = useCreateTrip();

  const form = useForm<TripCreateInput>({
    resolver: zodResolver(TripCreateSchema),
    defaultValues: {
      currency: "EUR",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duplicate_policy: "soft_block",
    },
  });

  const onSubmit = async (values: TripCreateInput) => {
    try {
      const result = await createTrip.mutateAsync(values);
      toast.success("Trip created successfully!");
      form.reset();
      onSuccess?.(result.trip.id);
    } catch (error) {
      // Clear any previous submission errors
      form.clearErrors();

      if (error instanceof Error) {
        toast.error(error.message);

        // Set field-specific errors if applicable
        if (error.message.toLowerCase().includes("name")) {
          form.setError("name", { message: error.message });
        } else if (error.message.toLowerCase().includes("destination")) {
          form.setError("destination_text", { message: error.message });
        } else if (error.message.toLowerCase().includes("date")) {
          if (error.message.toLowerCase().includes("start")) {
            form.setError("start_date", { message: error.message });
          } else if (error.message.toLowerCase().includes("end")) {
            form.setError("end_date", { message: error.message });
          }
        }
      } else {
        toast.error("Failed to create trip. Please try again.");
      }
      console.error("Create trip error:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Trip Name</Label>
        <Input
          id="name"
          placeholder="Summer Vacation 2025"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination_text">Destination</Label>
        <Input
          id="destination_text"
          placeholder="Barcelona, Spain"
          {...form.register("destination_text")}
        />
        {form.formState.errors.destination_text && (
          <p className="text-sm text-red-600">
            {form.formState.errors.destination_text.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" type="date" {...form.register("start_date")} />
          {form.formState.errors.start_date && (
            <p className="text-sm text-red-600">
              {form.formState.errors.start_date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input id="end_date" type="date" {...form.register("end_date")} />
          {form.formState.errors.end_date && (
            <p className="text-sm text-red-600">
              {form.formState.errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch("currency")}
            onValueChange={(value) => form.setValue("currency", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duplicate_policy">Duplicate Policy</Label>
          <Select
            value={form.watch("duplicate_policy")}
            onValueChange={(value) =>
              // biome-ignore lint/suspicious/noExplicitAny: its ok here
              form.setValue("duplicate_policy", value as any)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soft_block">Soft Block (Warning)</SelectItem>
              <SelectItem value="prevent">Prevent Duplicates</SelectItem>
              <SelectItem value="allow">Allow Duplicates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pin">PIN (optional)</Label>
        <Input
          id="pin"
          type="password"
          placeholder="4+ characters"
          {...form.register("pin")}
        />
        {form.formState.errors.pin && (
          <p className="text-sm text-red-600">
            {form.formState.errors.pin.message}
          </p>
        )}
        <p className="text-sm text-gray-600">
          Set a PIN to require collaborators to enter it when joining
        </p>
      </div>

      <ActionButton
        type="submit"
        className="w-full"
        isPending={createTrip.isPending}
        pendingText="Creating..."
      >
        Create Trip
      </ActionButton>
    </form>
  );
}

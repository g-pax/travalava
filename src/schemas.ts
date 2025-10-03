import { z } from "zod";

// Common schemas
export const TripIdSchema = z.string();
export const MemberIdSchema = z.string().uuid();

// Trip schemas
export const TripCreateSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  destination_text: z.string().min(1, "Destination is required"),
  lat: z.number().optional(),
  lon: z.number().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  timezone: z.string().default("UTC").optional(),
  currency: z.string().length(3).default("USD").optional(),
  duplicate_policy: z
    .enum(["soft_block", "prevent", "allow"])
    .default("soft_block")
    .optional(),
  pin: z.string().optional(),
});

export const JoinTripSchema = z.object({
  tripId: TripIdSchema,
  displayName: z.string().min(1, "Display name is required"),
  pin: z.string().min(1, "PIN is required"),
  clientDeviceId: z.string().min(1, "Device ID is required"),
});

// Activity schemas
export const ActivityCreateSchema = z.object({
  trip_id: TripIdSchema,
  title: z.string().min(1, "Activity title is required"),
  category: z.string().optional(),
  cost_amount: z.number().optional(),
  cost_currency: z.string().length(3).optional(),
  duration_min: z.number().positive().optional(),
  notes: z.string().optional(),
  link: z.string().url().optional(),
  location: z
    .object({
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
});

// Vote schemas
export const VoteCastSchema = z.object({
  trip_id: TripIdSchema,
  block_id: z.string().uuid(),
  activity_id: z.string().uuid(),
  member_id: MemberIdSchema,
});

// Block commit schemas
export const BlockCommitSchema = z.object({
  trip_id: TripIdSchema,
  block_id: z.string().uuid(),
  activity_id: z.string().uuid().optional(), // Optional for tie-breaking
});

export type TripCreateInput = z.infer<typeof TripCreateSchema>;
export type JoinTripInput = z.infer<typeof JoinTripSchema>;
export type ActivityCreateInput = z.infer<typeof ActivityCreateSchema>;
export type VoteCastInput = z.infer<typeof VoteCastSchema>;
export type BlockCommitInput = z.infer<typeof BlockCommitSchema>;

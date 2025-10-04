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

export const ActivityUpdateSchema = ActivityCreateSchema.omit({
  trip_id: true,
}).partial();

// Authentication schemas
export const SignUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(50, "Display name must be 50 characters or less"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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

// Voting window schemas
export const VotingWindowSchema = z
  .object({
    vote_open_ts: z.string().min(1, "Start time is required"),
    vote_close_ts: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      const openTime = new Date(data.vote_open_ts);
      const closeTime = new Date(data.vote_close_ts);
      return openTime < closeTime;
    },
    {
      message: "Start time must be before end time",
      path: ["vote_close_ts"],
    },
  );

export type TripCreateInput = z.infer<typeof TripCreateSchema>;
export type JoinTripInput = z.infer<typeof JoinTripSchema>;
export type ActivityCreateInput = z.infer<typeof ActivityCreateSchema>;
export type VoteCastInput = z.infer<typeof VoteCastSchema>;
export type BlockCommitInput = z.infer<typeof BlockCommitSchema>;
export type VotingWindowInput = z.infer<typeof VotingWindowSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

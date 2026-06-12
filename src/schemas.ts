import { z } from "zod";

// Form inputs submit "" for untouched text fields and NaN for empty
// valueAsNumber fields; both must collapse to undefined instead of failing
// the optional validators (which would block submission). Built with
// union + transform (not preprocess) so z.input<> keeps concrete field types
// for react-hook-form.
export const OptionalUrlSchema = z
  .union([z.literal(""), z.url("Please enter a valid URL")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const OptionalNumberSchema = z
  .union([z.nan(), z.number()])
  .optional()
  .transform((value) =>
    value === undefined || Number.isNaN(value) ? undefined : value,
  );

const optionalTrimmedString = () =>
  z
    .string()
    .optional()
    .transform((value) => (value?.trim() === "" ? undefined : value));

// Common schemas
export const TripIdSchema = z.string();
export const MemberIdSchema = z.string();

export const PinSchema = z
  .union([
    z.literal(""),
    z.string().regex(/^\d{4,8}$/, "PIN must be 4-8 digits"),
  ])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

// Trip schemas
export const TripCreateSchema = z
  .object({
    name: z.string().min(1, "Trip name is required"),
    destination_text: z.string().min(1, "Destination is required"),
    lat: z.number().optional(),
    lon: z.number().optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    timezone: z.string().optional().default("UTC"),
    currency: z.string().length(3).optional().default("EUR"),
    duplicate_policy: z
      .enum(["soft_block", "prevent", "allow"])
      .optional()
      .default("soft_block"),
    pin: PinSchema,
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  });

export const JoinTripSchema = z
  .object({
    tripId: TripIdSchema,
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(50, "Display name must be 50 characters or less"),
    // Account fields are only needed when the visitor isn't signed in yet.
    isAuthenticated: z.boolean().default(false),
    email: z
      .union([z.literal(""), z.email("Please enter a valid email address")])
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    password: z
      .union([
        z.literal(""),
        z.string().min(8, "Password must be at least 8 characters"),
      ])
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    confirmPassword: optionalTrimmedString(),
    requiresPin: z.boolean().default(false),
    pin: PinSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.isAuthenticated) {
      if (!data.email) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Email is required",
        });
      }
      if (!data.password) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password is required",
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords don't match",
        });
      }
    }
    if (data.requiresPin && !data.pin) {
      ctx.addIssue({
        code: "custom",
        path: ["pin"],
        message: "PIN is required",
      });
    }
  });

// Restaurant schemas (DEPRECATED - Use @/features/restaurants/schemas instead)
export const RestaurantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Restaurant name is required"),
  cuisine_type: z.string().optional(),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: OptionalUrlSchema,
  location: z
    .object({
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  image_url: OptionalUrlSchema,
  rating: z
    .union([z.nan(), z.number().min(0).max(5)])
    .optional()
    .transform((value) =>
      value === undefined || Number.isNaN(value) ? undefined : value,
    ),
  review_count: z
    .union([z.nan(), z.number().min(0)])
    .optional()
    .transform((value) =>
      value === undefined || Number.isNaN(value) ? undefined : value,
    ),
});

// Activity schemas
export const ActivityCreateSchema = z.object({
  trip_id: TripIdSchema,
  title: z.string().min(1, "Activity title is required"),
  category: optionalTrimmedString(),
  cost_amount: OptionalNumberSchema,
  cost_currency: z
    .union([z.literal(""), z.string().length(3)])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  duration_min: OptionalNumberSchema,
  notes: optionalTrimmedString(),
  link: OptionalUrlSchema,
  location: z
    .object({
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  src: OptionalUrlSchema,
  restaurants: z.array(RestaurantSchema).optional(),
});

export const ActivityUpdateSchema = ActivityCreateSchema.omit({
  trip_id: true,
}).partial();

// Authentication schemas
export const SignUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
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
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ResetPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
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
      // Both values are datetime-local strings in the same zone, so
      // lexicographic comparison is correct.
      return data.vote_open_ts < data.vote_close_ts;
    },
    {
      message: "Start time must be before end time",
      path: ["vote_close_ts"],
    },
  );

export type TripCreateInput = z.input<typeof TripCreateSchema>;
export type JoinTripInput = z.input<typeof JoinTripSchema>;
export type ActivityCreateInput = z.input<typeof ActivityCreateSchema>;
export type RestaurantInput = z.input<typeof RestaurantSchema>;
export type VoteCastInput = z.infer<typeof VoteCastSchema>;
export type BlockCommitInput = z.infer<typeof BlockCommitSchema>;
export type VotingWindowInput = z.infer<typeof VotingWindowSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

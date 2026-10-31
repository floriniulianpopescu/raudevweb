import { z } from "zod";

export const HealthCheckResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export const SignUpInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export const SignInInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof SignInInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const UpdateProfileInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    image: z.string().url("Image must be a valid URL").optional(),
  })
  .refine((data) => data.name !== undefined || data.image !== undefined, {
    message: "Provide at least one field to update",
  })

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

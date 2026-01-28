import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("validation.invalidEmail"),
  password: z.string().min(1, "validation.passwordRequired"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "validation.fullNameRequired"),
  email: z.string().trim().email("validation.invalidEmail"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("validation.invalidEmail"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "validation.passwordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const createSessionSchema = z.object({
  role: z.string().trim().min(1, "validation.requiredFields"),
  experience: z.coerce.number().min(1, "validation.requiredFields"),
  topicsToFocus: z.string().trim().min(1, "validation.requiredFields"),
  description: z.string().trim().optional(),
});

export type LoginFields = z.infer<typeof loginSchema>;
export type SignupFields = z.infer<typeof signupSchema>;
export type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;
export type CreateSessionFields = z.infer<typeof createSessionSchema>;
export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

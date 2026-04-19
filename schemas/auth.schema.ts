import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email").nonempty("Email is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .nonempty("Password is required"),

  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .nonempty("Name is required"),

  email: z.email("Invalid email").nonempty("Email is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .nonempty("Password is required"),

  rememberMe: z.boolean().default(false),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgetPasswordSchema = z.object({
  email: z.email("Invalid email").nonempty("Email is required"),
});

export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;

export const resetPasswordOtpSchema = z.object({
  email: z.email("Invalid email").nonempty("Email is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .nonempty("Password is required"),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP is required"),
});

export type ResetPasswordOtpInput = z.infer<typeof resetPasswordOtpSchema>;

export const verifyEmailOtpSchema = z.object({
  email: z.email("Invalid email").nonempty("Email is required"),

  otp: z.string(),
});

export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;

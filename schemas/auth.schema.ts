import {
  InferOutput,
  object,
  string,
  boolean,
  pipe,
  minLength,
  maxLength,
  nonEmpty,
  regex,
  email,
  length,
  custom,
  optional,
} from "valibot";

// Login
export const loginSchema = object({
  email: pipe(string(), nonEmpty("Email is required"), email("Invalid email")),

  password: pipe(
    string(),
    nonEmpty("Password is required"),
    minLength(8, "Password must be at least 8 characters"),
  ),

  rememberMe: optional(boolean(), true),
});

// Sign Up
export const signUpSchema = object({
  name: pipe(
    string(),
    nonEmpty("Name is required"),
    minLength(3, "Name must be at least 3 characters"),
  ),

  email: pipe(string(), nonEmpty("Email is required"), email("Invalid email")),

  password: pipe(
    string(),
    nonEmpty("Password is required"),
    minLength(8, "Password must be at least 8 characters"),
  ),

  rememberMe: optional(boolean(), true),
});

// Forget Password
export const forgetPasswordSchema = object({
  email: pipe(string(), nonEmpty("Email is required"), email("Invalid email")),
});

// Reset Password with OTP
export const resetPasswordOtpSchema = object({
  email: pipe(string(), nonEmpty("Email is required"), email("Invalid email")),

  password: pipe(
    string(),
    nonEmpty("Password is required"),
    minLength(8, "Password must be at least 8 characters"),
  ),

  otp: pipe(
    string(),
    length(6, "OTP must be 6 digits"),
    regex(/^\d+$/, "OTP must contain only digits"),
  ),
});

// Verify Email OTP
export const verifyEmailOtpSchema = object({
  email: pipe(string(), nonEmpty("Email is required"), email("Invalid email")),

  otp: string(),
});

// Edit Profile
export const editProfileSchema = object({
  name: pipe(
    string(),
    minLength(2, "Name must be at least 2 characters"),
    maxLength(50, "Name must be less than 50 characters"),
  ),
});

// Change Email
export const changeEmailSchema = object({
  email: pipe(string(), email("Please enter a valid email address")),
});

// Change Password
export const changePasswordSchema = pipe(
  object({
    currentPassword: pipe(
      string(),
      minLength(1, "Current password is required"),
    ),

    newPassword: pipe(
      string(),
      minLength(8, "Password must be at least 8 characters"),
      maxLength(128, "Password must be less than 128 characters"),
    ),

    confirmPassword: pipe(
      string(),
      minLength(1, "Please confirm your password"),
    ),
  }),

  custom(
    (data) => data.newPassword === data.confirmPassword,
    "Passwords do not match",
  ),
);

export type LoginInput = InferOutput<typeof loginSchema>;
export type SignUpInput = InferOutput<typeof signUpSchema>;
export type ForgetPasswordInput = InferOutput<typeof forgetPasswordSchema>;
export type ResetPasswordOtpInput = InferOutput<typeof resetPasswordOtpSchema>;
export type VerifyEmailOtpInput = InferOutput<typeof verifyEmailOtpSchema>;
export type EditProfileInput = InferOutput<typeof editProfileSchema>;
export type ChangeEmailInput = InferOutput<typeof changeEmailSchema>;
export type ChangePasswordInput = InferOutput<typeof changePasswordSchema>;

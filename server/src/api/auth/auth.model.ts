import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { emailSchema, idSchema } from "../../types.js";

extendZodWithOpenApi(z);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Password must contain at least one special character")
  .openapi({ description: "User password with security requirements" });

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .openapi({ description: "Unique username for the user" });

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name cannot exceed 50 characters")
  .trim()
  .openapi({ description: "User's first or last name" });

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    password: passwordSchema,
  })
  .openapi({ description: "User registration data" });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").openapi({ description: "User password for login" }),
  })
  .openapi({ description: "User login credentials" });

export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1, "Refresh token is required")
      .openapi({ description: "JWT refresh token" }),
  })
  .openapi({ description: "Token refresh request" });

export const passwordResetRequestSchema = z
  .object({
    email: emailSchema,
  })
  .openapi({ description: "Password reset request data" });

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required").openapi({ description: "Password reset token" }),
    newPassword: passwordSchema,
  })
  .openapi({ description: "Password reset data" });

export const emailVerificationSchema = z
  .object({
    token: z
      .string()
      .min(1, "Verification token is required")
      .openapi({ description: "Email verification token" }),
  })
  .openapi({ description: "Email verification data" });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .openapi({ description: "Current user password" }),
    newPassword: passwordSchema,
  })
  .openapi({ description: "Password change request" });

export const logoutSchema = z
  .object({
    sessionId: z.string().optional().openapi({ description: "Session ID to logout (optional)" }),
  })
  .openapi({ description: "Logout request data" });

export const userResponseSchema = z
  .object({
    id: idSchema,
    username: usernameSchema,
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    role: z.string().openapi({ description: "User role" }),
    permissions: z.array(z.string()).openapi({ description: "User permissions" }),
    isActive: z.boolean().openapi({ description: "Whether the user account is active" }),
    isEmailVerified: z.boolean().openapi({ description: "Whether the user's email is verified" }),
    isSuspended: z.boolean().openapi({ description: "Whether the user account is suspended" }),
  })
  .openapi({ description: "User profile information" });

export const tokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({ description: "JWT access token" }),
    refreshToken: z.string().openapi({ description: "JWT refresh token" }),
    expiresIn: z.number().openapi({ description: "Access token expiration time in seconds" }),
    refreshExpiresIn: z.number().openapi({ description: "Refresh token expiration time in seconds" }),
  })
  .openapi({ description: "Authentication tokens" });

export const loginResponseSchema = z
  .object({
    user: userResponseSchema,
    tokens: tokenResponseSchema,
    sessionId: z.string().openapi({ description: "Session identifier" }),
  })
  .openapi({ description: "Successful login response" });

export const refreshTokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({ description: "New JWT access token" }),
    refreshToken: z.string().openapi({ description: "New JWT refresh token" }),
    expiresIn: z.number().openapi({ description: "New access token expiration time in seconds" }),
    refreshExpiresIn: z.number().openapi({ description: "New refresh token expiration time in seconds" }),
  })
  .openapi({ description: "Refreshed authentication tokens" });

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

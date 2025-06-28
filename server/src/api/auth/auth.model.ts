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
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Password must contain at least one special character");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name cannot exceed 50 characters")
  .trim();


export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const logoutSchema = z.object({
  sessionId: z.string().optional(),
});


export const userResponseSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.string(),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  isSuspended: z.boolean(),
});

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  refreshExpiresIn: z.number(),
});

export const loginResponseSchema = z.object({
  user: userResponseSchema,
  tokens: tokenResponseSchema,
  sessionId: z.string(),
});

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  refreshExpiresIn: z.number(),
});



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

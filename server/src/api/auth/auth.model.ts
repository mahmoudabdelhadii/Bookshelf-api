import { z } from "zod";
import { createRoute } from "@asteasolutions/zod-to-openapi";
import { emailSchema, idSchema } from "../../types.js";

// Password validation schema
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

// Authentication request schemas
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

// Response schemas
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

// OpenAPI route definitions
export const registerRoute = createRoute({
  method: "post",
  path: "/auth/register",
  tags: ["Authentication"],
  summary: "Register a new user account",
  description: "Create a new user account with email verification",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            responseObject: z.object({
              user: userResponseSchema.omit({ permissions: true }),
            }),
            statusCode: z.number(),
          }),
        },
      },
    },
    400: {
      description: "Invalid input data",
    },
    409: {
      description: "User already exists",
    },
    422: {
      description: "Validation error",
    },
  },
});

export const loginRoute = createRoute({
  method: "post",
  path: "/auth/login",
  tags: ["Authentication"],
  summary: "Authenticate user and receive tokens",
  description: "Login with email and password to receive JWT tokens",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            responseObject: loginResponseSchema,
            statusCode: z.number(),
          }),
        },
      },
    },
    401: {
      description: "Invalid credentials or account locked",
    },
    403: {
      description: "Account suspended or deactivated",
    },
  },
});

export const refreshTokenRoute = createRoute({
  method: "post",
  path: "/auth/refresh",
  tags: ["Authentication"],
  summary: "Refresh access token",
  description: "Use refresh token to get a new access token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token refreshed successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            responseObject: refreshTokenResponseSchema,
            statusCode: z.number(),
          }),
        },
      },
    },
    401: {
      description: "Invalid or expired refresh token",
    },
  },
});

export const logoutRoute = createRoute({
  method: "post",
  path: "/auth/logout",
  tags: ["Authentication"],
  summary: "Logout and invalidate session",
  description: "Logout user and invalidate current session",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: logoutSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Logout successful",
    },
    401: {
      description: "Authentication required",
    },
  },
});

export const passwordResetRequestRoute = createRoute({
  method: "post",
  path: "/auth/password/reset-request",
  tags: ["Authentication"],
  summary: "Request password reset",
  description: "Send password reset email to user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: passwordResetRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reset instructions sent if email exists",
    },
    400: {
      description: "Invalid email format",
    },
  },
});

export const passwordResetRoute = createRoute({
  method: "post",
  path: "/auth/password/reset",
  tags: ["Authentication"],
  summary: "Reset password with token",
  description: "Reset password using token from email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: passwordResetSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset successfully",
    },
    400: {
      description: "Invalid or expired token",
    },
    422: {
      description: "Password validation failed",
    },
  },
});

export const emailVerificationRoute = createRoute({
  method: "post",
  path: "/auth/email/verify",
  tags: ["Authentication"],
  summary: "Verify email address",
  description: "Verify email address using token from email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: emailVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Email verified successfully",
    },
    400: {
      description: "Invalid or expired verification token",
    },
  },
});

export const changePasswordRoute = createRoute({
  method: "post",
  path: "/auth/password/change",
  tags: ["Authentication"],
  summary: "Change password",
  description: "Change password for authenticated user",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: changePasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
    },
    401: {
      description: "Current password is incorrect",
    },
    422: {
      description: "New password validation failed",
    },
  },
});

export const profileRoute = createRoute({
  method: "get",
  path: "/auth/profile",
  tags: ["Authentication"],
  summary: "Get current user profile",
  description: "Get profile information for authenticated user",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "User profile retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            responseObject: userResponseSchema,
            statusCode: z.number(),
          }),
        },
      },
    },
    401: {
      description: "Authentication required",
    },
  },
});

// Type exports
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
import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { AuthController } from "./auth.controller.js";
import { OAuthController } from "./oauth.controller.js";
import { authRequired } from "../../common/middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  userResponseSchema,
  loginResponseSchema,
  refreshTokenResponseSchema,
} from "./auth.model.js";
import { env } from "../../common/utils/envConfig.js";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
export const authRegistry = new OpenAPIRegistry();

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    return process.env.NODE_ENV === "test";
  },
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
});

const emailVerificationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many email verification attempts. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
});

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed",
      responseObject: { errors: errors.array() },
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
    });
  }
  next();
  
};

const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name is required and must not exceed 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name is required and must not exceed 50 characters"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidation = [
  body("refreshToken").optional().notEmpty().withMessage("Refresh token cannot be empty"),
];

const passwordResetRequestValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
];

const passwordResetValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

const emailVerificationValidation = [body("token").notEmpty().withMessage("Verification token is required")];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

const sessionIdValidation = [param("sessionId").notEmpty().withMessage("Session ID is required")];

// Register OpenAPI schemas
authRegistry.register("User", userResponseSchema);
authRegistry.register("LoginResponse", loginResponseSchema);
authRegistry.register("TokenResponse", refreshTokenResponseSchema);
authRegistry.register("RegisterRequest", registerSchema);
authRegistry.register("LoginRequest", loginSchema);

// Register auth routes with OpenAPI
authRegistry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Authentication"],
  summary: "Register a new user",
  security: [], // No authentication required for registration
  request: {
    body: {
      description: "User registration data",
      required: true,
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(userResponseSchema, "User registered successfully", 201),
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string" },
              statusCode: { type: "number", example: 400 },
            },
          },
        },
      },
    },
  },
});

authRegistry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Authentication"],
  summary: "Login user",
  security: [], // No authentication required for login
  request: {
    body: {
      description: "User login credentials",
      required: true,
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(loginResponseSchema, "Login successful"),
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string" },
              statusCode: { type: "number", example: 401 },
            },
          },
        },
      },
    },
  },
});

// Add OpenAPI documentation for protected routes
authRegistry.registerPath({
  method: "get",
  path: "/auth/profile",
  tags: ["Authentication"],
  summary: "Get user profile",
  security: [{ bearerAuth: [] }], // Requires JWT authentication
  responses: {
    ...createApiResponse(userResponseSchema, "User profile retrieved successfully"),
    401: {
      description: "Unauthorized - Invalid or missing token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Unauthorized" },
              statusCode: { type: "number", example: 401 },
            },
          },
        },
      },
    },
  },
});

authRegistry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Authentication"],
  summary: "Logout user",
  security: [{ bearerAuth: [] }], // Requires JWT authentication
  responses: {
    200: {
      description: "Logout successful",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Logout successful" },
              statusCode: { type: "number", example: 200 },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Unauthorized" },
              statusCode: { type: "number", example: 401 },
            },
          },
        },
      },
    },
  },
});

authRouter.post("/register", authRateLimit, registerValidation, validateRequest, AuthController.register);

authRouter.post("/login", authRateLimit, loginValidation, validateRequest, AuthController.login);

authRouter.post("/refresh", refreshTokenValidation, validateRequest, AuthController.refreshToken);

authRouter.post(
  "/password/reset-request",
  passwordResetRateLimit,
  passwordResetRequestValidation,
  validateRequest,
  AuthController.requestPasswordReset,
);

authRouter.post("/password/reset", passwordResetValidation, validateRequest, AuthController.resetPassword);

authRouter.post(
  "/email/verify",
  emailVerificationRateLimit,
  emailVerificationValidation,
  validateRequest,
  AuthController.verifyEmail,
);

authRouter.post(
  "/email/resend-verification",
  emailVerificationRateLimit,
  authRequired,
  AuthController.resendEmailVerification,
);

authRouter.post("/logout", authRequired, AuthController.logout);

authRouter.post(
  "/password/change",
  authRequired,
  changePasswordValidation,
  validateRequest,
  AuthController.changePassword,
);

authRouter.get("/profile", authRequired, AuthController.getProfile);

authRouter.get("/sessions", authRequired, AuthController.getUserSessions);

authRouter.delete(
  "/sessions/:sessionId",
  authRequired,
  sessionIdValidation,
  validateRequest,
  AuthController.revokeSession,
);

authRouter.delete("/sessions", authRequired, AuthController.revokeAllSessions);

authRouter.get("/google", OAuthController.googleAuth);

authRouter.get("/google/callback", OAuthController.googleCallback);

authRouter.get("/apple", OAuthController.appleAuth);

authRouter.get("/apple/callback", OAuthController.appleCallback);

authRouter.post("/oauth/link", authRequired, OAuthController.linkOAuthAccount);

authRouter.delete(
  "/oauth/:provider",
  authRequired,
  param("provider").isIn(["google", "apple"]).withMessage("Invalid OAuth provider"),
  validateRequest,
  OAuthController.unlinkOAuthAccount,
);

authRouter.get("/oauth/accounts", authRequired, OAuthController.getConnectedAccounts);

authRouter.get("/health", (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Authentication service is healthy",
    responseObject: {
      timestamp: new Date().toISOString(),
      service: "authentication",
      version: "1.0.0",
    },
    statusCode: StatusCodes.OK,
  });
});

export default authRouter;

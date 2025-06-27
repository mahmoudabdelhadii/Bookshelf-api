// import { OpenAPIHono } from "@hono/zod-openapi"; // Commented out as not currently used
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { AuthController } from "./auth.controller.js";
import { 
  authenticateJWT, 
  authRequired, 
  authRequiredWithEmail,
  optionalAuth 
} from "../../common/middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  changePasswordSchema,
  logoutSchema,
  registerRoute,
  loginRoute,
  refreshTokenRoute,
  logoutRoute,
  passwordResetRequestRoute,
  passwordResetRoute,
  emailVerificationRoute,
  changePasswordRoute,
  profileRoute,
} from "./auth.model.js";
import { env } from "../../common/utils/envConfig.js";

// Create router
export const authRouter = Router();

// Rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS, // 5 attempts per window
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === "test";
  },
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

const emailVerificationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 verification attempts per 10 minutes
  message: {
    success: false,
    message: "Too many email verification attempts. Please try again later.",
    responseObject: null,
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
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

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
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
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const refreshTokenValidation = [
  body("refreshToken")
    .optional()
    .notEmpty()
    .withMessage("Refresh token cannot be empty"),
];

const passwordResetRequestValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

const passwordResetValidation = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

const emailVerificationValidation = [
  body("token")
    .notEmpty()
    .withMessage("Verification token is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

const sessionIdValidation = [
  param("sessionId")
    .notEmpty()
    .withMessage("Session ID is required"),
];

// Public authentication routes
authRouter.post(
  "/register",
  authRateLimit,
  registerValidation,
  validateRequest,
  AuthController.register
);

authRouter.post(
  "/login",
  authRateLimit,
  loginValidation,
  validateRequest,
  AuthController.login
);

authRouter.post(
  "/refresh",
  refreshTokenValidation,
  validateRequest,
  AuthController.refreshToken
);

// Password reset routes
authRouter.post(
  "/password/reset-request",
  passwordResetRateLimit,
  passwordResetRequestValidation,
  validateRequest,
  AuthController.requestPasswordReset
);

authRouter.post(
  "/password/reset",
  passwordResetValidation,
  validateRequest,
  AuthController.resetPassword
);

// Email verification routes
authRouter.post(
  "/email/verify",
  emailVerificationRateLimit,
  emailVerificationValidation,
  validateRequest,
  AuthController.verifyEmail
);

authRouter.post(
  "/email/resend-verification",
  emailVerificationRateLimit,
  authRequired,
  AuthController.resendEmailVerification
);

// Protected authentication routes
authRouter.post(
  "/logout",
  authRequired,
  AuthController.logout
);

authRouter.post(
  "/password/change",
  authRequired,
  changePasswordValidation,
  validateRequest,
  AuthController.changePassword
);

authRouter.get(
  "/profile",
  authRequired,
  AuthController.getProfile
);

// Session management routes
authRouter.get(
  "/sessions",
  authRequired,
  AuthController.getUserSessions
);

authRouter.delete(
  "/sessions/:sessionId",
  authRequired,
  sessionIdValidation,
  validateRequest,
  AuthController.revokeSession
);

authRouter.delete(
  "/sessions",
  authRequired,
  AuthController.revokeAllSessions
);

// Health check for auth service
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

// OpenAPI documentation setup (for when integrated with OpenAPI generator)
// export const authOpenAPIRouter = new OpenAPIHono();

// Register OpenAPI routes (commented out for now)
/*
authOpenAPIRouter.openapi(registerRoute, async (c) => {
  // This would be handled by the actual controller
  return c.json({ message: "Registration endpoint" });
});

authOpenAPIRouter.openapi(loginRoute, async (c) => {
  return c.json({ message: "Login endpoint" });
});

authOpenAPIRouter.openapi(refreshTokenRoute, async (c) => {
  return c.json({ message: "Refresh token endpoint" });
});

authOpenAPIRouter.openapi(logoutRoute, async (c) => {
  return c.json({ message: "Logout endpoint" });
});

authOpenAPIRouter.openapi(passwordResetRequestRoute, async (c) => {
  return c.json({ message: "Password reset request endpoint" });
});

authOpenAPIRouter.openapi(passwordResetRoute, async (c) => {
  return c.json({ message: "Password reset endpoint" });
});

authOpenAPIRouter.openapi(emailVerificationRoute, async (c) => {
  return c.json({ message: "Email verification endpoint" });
});

authOpenAPIRouter.openapi(changePasswordRoute, async (c) => {
  return c.json({ message: "Change password endpoint" });
});

authOpenAPIRouter.openapi(profileRoute, async (c) => {
  return c.json({ message: "Profile endpoint" });
});
*/

export default authRouter;
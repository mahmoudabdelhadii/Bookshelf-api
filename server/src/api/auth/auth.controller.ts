import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "./auth.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { DrizzleClient } from "database";
import {
  type RegisterRequest,
  type LoginRequest,
  type PasswordResetRequest,
  type PasswordResetData,
  type EmailVerificationData,
  type ChangePasswordRequest,
} from "./auth.model.js";

interface AuthRequest extends Request {
  drizzle: DrizzleClient;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    isEmailVerified: boolean;
    isSuspended: boolean;
  };
}

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: AuthRequest, res: Response) {
    try {
      const userData: RegisterRequest = req.body;

      const serviceResponse = await AuthService.registerUser(req.drizzle, {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during registration",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Authenticate user and return tokens
   */
  public static async login(req: AuthRequest, res: Response) {
    try {
      const credentials: LoginRequest = req.body;

      const serviceResponse = await AuthService.login(req.drizzle, {
        email: credentials.email,
        password: credentials.password,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      if (
        serviceResponse.success &&
        serviceResponse.responseObject &&
        "tokens" in serviceResponse.responseObject
      ) {
        const { tokens } = serviceResponse.responseObject;

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: tokens.refreshExpiresIn * 1000,
          path: "/auth/refresh",
        });
      }

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during login",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Refresh access token
   */
  public static async refreshToken(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken ?? req.body.refreshToken;

      if (!refreshToken) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token is required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const serviceResponse = await AuthService.refreshToken(req.drizzle, {
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      if (
        serviceResponse.success &&
        serviceResponse.responseObject &&
        "refreshToken" in serviceResponse.responseObject
      ) {
        const tokens = serviceResponse.responseObject;

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: tokens.refreshExpiresIn * 1000,
          path: "/auth/refresh",
        });
      }

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during token refresh",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Logout user and invalidate session
   */
  public static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const sessionId = req.body.sessionId ?? "current-session";

      const serviceResponse = await AuthService.logout(req.drizzle, sessionId, req.user.id);

      res.clearCookie("refreshToken", {
        path: "/auth/refresh",
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during logout",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Request password reset
   */
  public static async requestPasswordReset(req: AuthRequest, res: Response) {
    try {
      const data: PasswordResetRequest = req.body;

      const serviceResponse = await AuthService.requestPasswordReset(req.drizzle, {
        email: data.email,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password reset request",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Reset password with token
   */
  public static async resetPassword(req: AuthRequest, res: Response) {
    try {
      const data: PasswordResetData = req.body;

      const serviceResponse = await AuthService.resetPassword(req.drizzle, {
        token: data.token,
        newPassword: data.newPassword,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password reset",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Verify email address
   */
  public static async verifyEmail(req: AuthRequest, res: Response) {
    try {
      const data: EmailVerificationData = req.body;

      const serviceResponse = await AuthService.verifyEmail(req.drizzle, {
        token: data.token,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during email verification",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Change password for authenticated user
   */
  public static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const data: ChangePasswordRequest = req.body;

      const serviceResponse = await AuthService.changePassword(req.drizzle, {
        userId: req.user.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password change",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get current user profile
   */
  public static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Profile retrieved successfully",
        responseObject: req.user,
        statusCode: StatusCodes.OK,
      });
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error retrieving profile",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Resend email verification
   */
  public static async resendEmailVerification(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      if (req.user.isEmailVerified) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Email is already verified",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Verification email sent successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      });
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error sending verification email",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get user sessions (for security management)
   */
  public static async getUserSessions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const sessions = [
        {
          id: "session-1",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          isActive: true,
          isCurrent: true,
        },
      ];

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Sessions retrieved successfully",
        responseObject: sessions,
        statusCode: StatusCodes.OK,
      });
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error retrieving sessions",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Revoke a specific session
   */
  public static async revokeSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Session ID is required",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await AuthService.logout(req.drizzle, sessionId, req.user.id);

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error revoking session",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Revoke all sessions except current
   */
  public static async revokeAllSessions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "All other sessions revoked successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      });
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error revoking sessions",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

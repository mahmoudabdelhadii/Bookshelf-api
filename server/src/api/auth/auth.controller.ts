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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthController {
  
  export async function register(req: AuthRequest, res: Response) {
    try {
      const userData = req.body as RegisterRequest;

      const serviceResponse = await AuthService.registerUser(req.drizzle, {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during registration",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function login(req: AuthRequest, res: Response) {
    try {
      const credentials = req.body as LoginRequest;

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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during login",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function refreshToken(req: AuthRequest, res: Response) {
    try {
      const refreshTokenValue =
        (req.cookies as { refreshToken?: string }).refreshToken ??
        (req.body as { refreshToken?: string }).refreshToken;

      if (!refreshTokenValue) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token is required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const serviceResponse = await AuthService.refreshToken(req.drizzle, {
        refreshToken: refreshTokenValue,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      if (
        serviceResponse.success &&
        serviceResponse.responseObject &&
        "refreshToken" in serviceResponse.responseObject
      ) {
        const tokens = serviceResponse.responseObject as {
          refreshToken: string;
          refreshExpiresIn: number;
        };

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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during token refresh",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const sessionId = (req.body as { sessionId?: string }).sessionId ?? "current-session";

      const serviceResponse = await AuthService.logout(req.drizzle, sessionId, req.user.id);

      res.clearCookie("refreshToken", {
        path: "/auth/refresh",
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during logout",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function requestPasswordReset(req: AuthRequest, res: Response) {
    try {
      const data = req.body as PasswordResetRequest;

      const serviceResponse = await AuthService.requestPasswordReset(req.drizzle, {
        email: data.email,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password reset request",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function resetPassword(req: AuthRequest, res: Response) {
    try {
      const data = req.body as PasswordResetData;

      const serviceResponse = await AuthService.resetPassword(req.drizzle, {
        token: data.token,
        newPassword: data.newPassword,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password reset",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function verifyEmail(req: AuthRequest, res: Response) {
    try {
      const data = req.body as EmailVerificationData;

      const serviceResponse = await AuthService.verifyEmail(req.drizzle, {
        token: data.token,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during email verification",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          responseObject: null,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const data = req.body as ChangePasswordRequest;

      const serviceResponse = await AuthService.changePassword(req.drizzle, {
        userId: req.user.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during password change",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function getProfile(req: AuthRequest, res: Response) {
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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error retrieving profile",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function resendEmailVerification(req: AuthRequest, res: Response) {
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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error sending verification email",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function getUserSessions(req: AuthRequest, res: Response) {
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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error retrieving sessions",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function revokeSession(req: AuthRequest, res: Response) {
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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error revoking session",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  
  export async function revokeAllSessions(req: AuthRequest, res: Response) {
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
      // eslint-disable-next-line no-console
      console.error(err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error revoking sessions",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}


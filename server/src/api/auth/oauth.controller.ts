import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { StatusCodes } from "http-status-codes";
import { generateTokenPair } from "../../common/auth/jwt.js";
import { env } from "../../common/utils/envConfig.js";
import { createSessionRecord } from "../../common/middleware/session.js";
import { OAuthService, type OAuthUser } from "../../common/auth/oauthStrategies.js";
import type { DrizzleClient } from "database";

interface OAuthRequest extends Request {
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
    userId: string;
    sessionId?: string;
  };
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface OAuthData {
  providerId: string;
  email: string;
  profileData: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace OAuthController {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  export const googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  });

  export function googleCallback(req: Request, res: Response, next: NextFunction): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    passport.authenticate("google", { session: false }, async (err: Error | null, user: OAuthUser, _info: unknown) => {
      try {
        if (err) {
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_error`);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!user) {
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_failed`);
          return;
        }

        const tokenPair = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          sessionId: user.id,
        });

        await createSessionRecord((req as OAuthRequest).drizzle, user.id, {
          sessionToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          expiresAt: new Date(Date.now() + tokenPair.refreshExpiresIn * 1000),
        });

        setAuthCookies(res, tokenPair);

        res.redirect(`${env.FRONTEND_URL}/auth/success?provider=google`);
      } catch {
        res.redirect(`${env.FRONTEND_URL}/auth/error?reason=server_error`);
      }
    })(req, res, next);
  }

  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  export const appleAuth = passport.authenticate("apple", {
    scope: ["name", "email"],
  });

  
  export function appleCallback(req: Request, res: Response, next: NextFunction): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    passport.authenticate("apple", { session: false }, async (err: Error | null, user: OAuthUser, _info: unknown) => {
      try {
        if (err) {
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_error`);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!user) {
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_failed`);
          return;
        }

        const tokenPair = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          sessionId: user.id,
        });

        await createSessionRecord((req as OAuthRequest).drizzle, user.id, {
          sessionToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          expiresAt: new Date(Date.now() + tokenPair.refreshExpiresIn * 1000),
        });

        setAuthCookies(res, tokenPair);

        res.redirect(`${env.FRONTEND_URL}/auth/success?provider=apple`);
      } catch {
        res.redirect(`${env.FRONTEND_URL}/auth/error?reason=server_error`);
      }
    })(req, res, next);
  }

  
  export async function linkOAuthAccount(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as { provider?: string; oauthData?: OAuthData };
      const { provider, oauthData } = body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!provider || !oauthData) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Provider and OAuth data are required",
        });
      }

      if (!["google", "apple"].includes(provider)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Unsupported OAuth provider",
        });
      }

      await OAuthService.linkOAuthAccount((req as OAuthRequest).drizzle, userId, {
        provider: provider as "google" | "apple",
        providerId: oauthData.providerId,
        email: oauthData.email,
        profileData: oauthData.profileData,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: `${provider} account linked successfully`,
      });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("already linked")) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to link OAuth account",
      });
    }
  }

  
  export async function unlinkOAuthAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { provider } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!["google", "apple"].includes(provider)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Unsupported OAuth provider",
        });
      }

      await OAuthService.unlinkOAuthAccount(
        (req as OAuthRequest).drizzle,
        userId,
        provider as "google" | "apple",
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: `${provider} account unlinked successfully`,
      });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("not found")) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to unlink OAuth account",
      });
    }
  }

  
  export async function getConnectedAccounts(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      const oauthAccounts = await OAuthService.getUserOAuthAccounts((req as OAuthRequest).drizzle, userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          accounts: oauthAccounts,
        },
      });
    } catch {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to retrieve connected accounts",
      });
    }
  }

  
  function setAuthCookies(res: Response, tokenPair: TokenPair): void {
    const isProduction = env.isProduction;

    res.cookie("accessToken", tokenPair.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: tokenPair.expiresIn * 1000,
      path: "/",
    });

    res.cookie("refreshToken", tokenPair.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: tokenPair.refreshExpiresIn * 1000,
      path: "/",
    });
  }
}
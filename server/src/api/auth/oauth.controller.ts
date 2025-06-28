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

type CallbackHandler = (req: Request, res: Response, next: NextFunction) => void;

export class OAuthController {
  static googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  });

  static googleCallback: CallbackHandler = (req: Request, res: Response, next: any) => {
    passport.authenticate("google", { session: false }, async (err: any, user: OAuthUser, info: any) => {
      try {
        if (err) {
          console.error("Google OAuth error:", err);
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_error`); return;
        }

        if (!user) {
          console.error("Google OAuth failed:", info);
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_failed`); return;
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

        
        OAuthController.setAuthCookies(res, tokenPair);

        
        res.redirect(`${env.FRONTEND_URL}/auth/success?provider=google`);
      } catch (err_) {
        console.error("Google OAuth callback error:", err_);
        res.redirect(`${env.FRONTEND_URL}/auth/error?reason=server_error`);
      }
    })(req, res, next);
  };

  /**
   * Initiate Apple OAuth authentication
   */
  static appleAuth = passport.authenticate("apple", {
    scope: ["name", "email"],
  });

  /**
   * Handle Apple OAuth callback
   */
  static appleCallback: CallbackHandler = (req: Request, res: Response, next: any) => {
    passport.authenticate("apple", { session: false }, async (err: any, user: OAuthUser, info: any) => {
      try {
        if (err) {
          console.error("Apple OAuth error:", err);
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_error`); return;
        }

        if (!user) {
          console.error("Apple OAuth failed:", info);
          res.redirect(`${env.FRONTEND_URL}/auth/error?reason=oauth_failed`); return;
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

        
        OAuthController.setAuthCookies(res, tokenPair);

        
        res.redirect(`${env.FRONTEND_URL}/auth/success?provider=apple`);
      } catch (err_) {
        console.error("Apple OAuth callback error:", err_);
        res.redirect(`${env.FRONTEND_URL}/auth/error?reason=server_error`);
      }
    })(req, res, next);
  };

  /**
   * Link OAuth account to existing authenticated user
   */
  static linkOAuthAccount = async (req: Request, res: Response) => {
    try {
      const { provider, oauthData } = req.body;
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
    } catch (err: any) {
      console.error("Link OAuth account error:", err);

      if (err.message.includes("already linked")) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to link OAuth account",
      });
    }
  };

  /**
   * Unlink OAuth account from authenticated user
   */
  static unlinkOAuthAccount = async (req: Request, res: Response) => {
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
    } catch (err: any) {
      console.error("Unlink OAuth account error:", err);

      if (err.message.includes("not found")) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to unlink OAuth account",
      });
    }
  };

  /**
   * Get user's connected OAuth accounts
   */
  static getConnectedAccounts = async (req: Request, res: Response) => {
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
    } catch (err) {
      console.error("Get connected accounts error:", err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to retrieve connected accounts",
      });
    }
  };

  /**
   * Set authentication cookies
   */
  private static setAuthCookies(res: Response, tokenPair: any) {
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

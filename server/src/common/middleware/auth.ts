import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "../models/serviceResponse.js";
import { extractTokenFromHeader, verifyAccessToken } from "../auth/jwt.js";
import { AuthUser } from "../auth/strategies.js";
import { PermissionValidator } from "database";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware using JWT
 * Verifies the JWT token and sets req.user
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    const errorResponse = ServiceResponse.failure(
      "Authentication required. Please provide a valid token.",
      null,
      StatusCodes.UNAUTHORIZED
    );
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  const verification = verifyAccessToken(token);

  if (!verification.isValid) {
    const status = verification.expired ? StatusCodes.UNAUTHORIZED : StatusCodes.FORBIDDEN;
    const message = verification.expired 
      ? "Token has expired. Please refresh your token."
      : "Invalid token provided.";

    const errorResponse = ServiceResponse.failure(message, null, status);
    return res.status(status).json(errorResponse);
  }

  // Use Passport JWT strategy to authenticate and populate req.user
  passport.authenticate("jwt", { session: false }, (err: any, user: AuthUser | false, info: any) => {
    if (err) {
      console.error("JWT authentication error:", err);
      const errorResponse = ServiceResponse.failure(
        "Authentication error occurred.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }

    if (!user) {
      const errorResponse = ServiceResponse.failure(
        info?.message || "Authentication failed.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Optional authentication middleware
 * Sets req.user if valid token is provided, but doesn't fail if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return next(); // No token provided, continue without user
  }

  const verification = verifyAccessToken(token);

  if (!verification.isValid) {
    return next(); // Invalid token, continue without user
  }

  // Use Passport JWT strategy to authenticate
  passport.authenticate("jwt", { session: false }, (err: any, user: AuthUser | false) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Local authentication middleware for login
 * Uses username/password authentication
 */
export const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", { session: false }, (err: any, user: AuthUser | false, info: any) => {
    if (err) {
      console.error("Local authentication error:", err);
      const errorResponse = ServiceResponse.failure(
        "Authentication error occurred.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }

    if (!user) {
      const errorResponse = ServiceResponse.failure(
        info?.message || "Invalid credentials provided.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Require email verification middleware
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure(
      "Authentication required.",
      null,
      StatusCodes.UNAUTHORIZED
    );
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  if (!req.user.isEmailVerified) {
    const errorResponse = ServiceResponse.failure(
      "Email verification required. Please verify your email address.",
      null,
      StatusCodes.FORBIDDEN
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
};

/**
 * Require active account middleware
 */
export const requireActiveAccount = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure(
      "Authentication required.",
      null,
      StatusCodes.UNAUTHORIZED
    );
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  if (!req.user.isActive) {
    const errorResponse = ServiceResponse.failure(
      "Account is deactivated. Please contact support.",
      null,
      StatusCodes.FORBIDDEN
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  if (req.user.isSuspended) {
    const errorResponse = ServiceResponse.failure(
      "Account is suspended. Please contact support.",
      null,
      StatusCodes.FORBIDDEN
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
};

/**
 * Role-based access control middleware
 * Requires specific roles
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const errorResponse = ServiceResponse.failure(
        "Insufficient permissions. Required roles: " + allowedRoles.join(", "),
        null,
        StatusCodes.FORBIDDEN
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * Requires specific permissions
 */
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    const hasPermission = PermissionValidator.hasAllPermissions(
      req.user.permissions,
      requiredPermissions
    );

    if (!hasPermission) {
      const errorResponse = ServiceResponse.failure(
        "Insufficient permissions. Required permissions: " + requiredPermissions.join(", "),
        { requiredPermissions, userPermissions: req.user.permissions },
        StatusCodes.FORBIDDEN
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
  };
};

/**
 * Permission-based access control middleware (any permission)
 * Requires at least one of the specified permissions
 */
export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    const hasPermission = PermissionValidator.hasAnyPermission(
      req.user.permissions,
      requiredPermissions
    );

    if (!hasPermission) {
      const errorResponse = ServiceResponse.failure(
        "Insufficient permissions. Required at least one of: " + requiredPermissions.join(", "),
        { requiredPermissions, userPermissions: req.user.permissions },
        StatusCodes.FORBIDDEN
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Allows access if user owns the resource or has admin permissions
 */
export const requireOwnershipOrAdmin = (userIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    // Admin roles can access any resource
    if (req.user.role === "admin" || req.user.role === "Super Administrator") {
      return next();
    }

    // Check if user has management permissions for the resource type
    const hasManagementPermission = req.user.permissions.some(p => 
      p.includes(":manage") || p.includes("system:manage")
    );

    if (hasManagementPermission) {
      return next();
    }

    // Check resource ownership
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

    if (!resourceUserId) {
      const errorResponse = ServiceResponse.failure(
        "Resource identifier not found.",
        null,
        StatusCodes.BAD_REQUEST
      );
      return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }

    if (resourceUserId !== req.user.id) {
      const errorResponse = ServiceResponse.failure(
        "Access denied. You can only access your own resources.",
        null,
        StatusCodes.FORBIDDEN
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
  };
};

/**
 * Admin-only middleware
 * Requires admin role or system management permission
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure(
      "Authentication required.",
      null,
      StatusCodes.UNAUTHORIZED
    );
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  const isAdmin = req.user.role === "admin" || 
                  req.user.role === "Super Administrator" ||
                  req.user.permissions.includes("system:manage");

  if (!isAdmin) {
    const errorResponse = ServiceResponse.failure(
      "Administrator access required.",
      null,
      StatusCodes.FORBIDDEN
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
};

/**
 * Development-only middleware
 * Only allows access in development environment
 */
export const developmentOnly = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    const errorResponse = ServiceResponse.failure(
      "This endpoint is only available in development mode.",
      null,
      StatusCodes.FORBIDDEN
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
};

/**
 * Combine multiple authentication middleware functions
 */
export const combineAuthMiddleware = (...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let currentIndex = 0;

    const runNextMiddleware = (error?: any) => {
      if (error) {
        return next(error);
      }

      if (currentIndex >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[currentIndex++];
      try {
        middleware(req, res, runNextMiddleware);
      } catch (err) {
        next(err);
      }
    };

    runNextMiddleware();
  };
};

// Utility function to check if user has specific permission
export const hasPermission = (user: AuthUser | undefined, permission: string): boolean => {
  if (!user) return false;
  return PermissionValidator.hasPermission(user.permissions, permission);
};

// Utility function to check if user has any of the specified permissions
export const hasAnyPermission = (user: AuthUser | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  return PermissionValidator.hasAnyPermission(user.permissions, permissions);
};

// Common middleware combinations
export const authRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount);
export const authRequiredWithEmail = combineAuthMiddleware(authenticateJWT, requireActiveAccount, requireEmailVerified);
export const adminRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount, requireAdmin);
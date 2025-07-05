import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "../models/serviceResponse.js";
import { extractTokenFromHeader, verifyAccessToken } from "../auth/jwt.js";
import { AuthUser } from "../auth/strategies.js";
import { PermissionValidator } from "database";

declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}


export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    const errorResponse = ServiceResponse.failure(
      "Authentication required. Please provide a valid token.",
      null,
      StatusCodes.UNAUTHORIZED,
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

  return passport.authenticate("jwt", { session: false }, (err: any, user: AuthUser | false, info: any) => {
    if (err) {
      const errorResponse = ServiceResponse.failure(
        "Authentication error occurred.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }

    if (!user) {
      const errorResponse = ServiceResponse.failure(
        info?.message ?? "Authentication failed.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    req.user = user;
    next();
    
  })(req, res, next);
};


export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    next();
    return;
  }

  const verification = verifyAccessToken(token);

  if (!verification.isValid) {
    next();
    return;
  }

  passport.authenticate("jwt", { session: false }, (err: any, user: AuthUser | false) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};


export const authenticateLocal = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate("local", { session: false }, (err: any, user: AuthUser | false, info: any) => {
    if (err) {
      const errorResponse = ServiceResponse.failure(
        "Authentication error occurred.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }

    if (!user) {
      const errorResponse = ServiceResponse.failure(
        info?.message ?? "Invalid credentials provided.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    req.user = user;
    next();
    
  })(req, res, next);
};


export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED);
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  if (!req.user.isEmailVerified) {
    const errorResponse = ServiceResponse.failure(
      "Email verification required. Please verify your email address.",
      null,
      StatusCodes.FORBIDDEN,
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
  
};


export const requireActiveAccount = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED);
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  if (!req.user.isActive) {
    const errorResponse = ServiceResponse.failure(
      "Account is deactivated. Please contact support.",
      null,
      StatusCodes.FORBIDDEN,
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  if (req.user.isSuspended) {
    const errorResponse = ServiceResponse.failure(
      "Account is suspended. Please contact support.",
      null,
      StatusCodes.FORBIDDEN,
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
  
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const errorResponse = ServiceResponse.failure(
        `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
        null,
        StatusCodes.FORBIDDEN,
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
    
  };
};

export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    const hasPermission = PermissionValidator.hasAllPermissions(req.user.permissions, requiredPermissions);

    if (!hasPermission) {
      const errorResponse = ServiceResponse.failure(
        `Insufficient permissions. Required permissions: ${requiredPermissions.join(", ")}`,
        { requiredPermissions, userPermissions: req.user.permissions },
        StatusCodes.FORBIDDEN,
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
    
  };
};

export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    const hasPermission = PermissionValidator.hasAnyPermission(req.user.permissions, requiredPermissions);

    if (!hasPermission) {
      const errorResponse = ServiceResponse.failure(
        `Insufficient permissions. Required at least one of: ${requiredPermissions.join(", ")}`,
        { requiredPermissions, userPermissions: req.user.permissions },
        StatusCodes.FORBIDDEN,
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
    
  };
};

export const requireOwnershipOrAdmin = (userIdField = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errorResponse = ServiceResponse.failure(
        "Authentication required.",
        null,
        StatusCodes.UNAUTHORIZED,
      );
      return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
    }

    if (req.user.role === "admin" || req.user.role === "Super Administrator") {
      next();
      return;
    }

    const hasManagementPermission = req.user.permissions.some(
      (p) => p.includes(":manage") ?? p.includes("system:manage"),
    );

    if (hasManagementPermission) {
      next();
      return;
    }

    const resourceUserId = req.params[userIdField] ?? req.body[userIdField] ?? req.query[userIdField];

    if (!resourceUserId) {
      const errorResponse = ServiceResponse.failure(
        "Resource identifier not found.",
        null,
        StatusCodes.BAD_REQUEST,
      );
      return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }

    if (resourceUserId !== req.user.id) {
      const errorResponse = ServiceResponse.failure(
        "Access denied. You can only access your own resources.",
        null,
        StatusCodes.FORBIDDEN,
      );
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
    }

    next();
    
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const errorResponse = ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED);
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse);
  }

  const isAdmin =
    req.user.role === "admin" ||
    req.user.role === "Super Administrator" ||
    req.user.permissions.includes("system:manage");

  if (!isAdmin) {
    const errorResponse = ServiceResponse.failure(
      "Administrator access required.",
      null,
      StatusCodes.FORBIDDEN,
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
  
};

export const developmentOnly = (_req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    const errorResponse = ServiceResponse.failure(
      "This endpoint is only available in development mode.",
      null,
      StatusCodes.FORBIDDEN,
    );
    return res.status(StatusCodes.FORBIDDEN).json(errorResponse);
  }

  next();
  
};

export const combineAuthMiddleware = (
  ...middlewares: ((req: Request, res: Response, next: NextFunction) => void)[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let currentIndex = 0;

    const runNextMiddleware = (error?: any) => {
      if (error) {
        next(error);
        return;
      }

      if (currentIndex >= middlewares.length) {
        next();
        return;
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

export const hasPermission = (user: AuthUser | undefined, permission: string): boolean => {
  if (!user) return false;
  return PermissionValidator.hasPermission(user.permissions, permission);
};

export const hasAnyPermission = (user: AuthUser | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  return PermissionValidator.hasAnyPermission(user.permissions, permissions);
};

export const authRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount);
export const authRequiredWithEmail = combineAuthMiddleware(
  authenticateJWT,
  requireActiveAccount,
  requireEmailVerified,
);
export const adminRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount, requireAdmin);

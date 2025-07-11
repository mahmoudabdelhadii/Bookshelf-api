import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "../models/serviceResponse.js";
import { extractTokenFromHeader, verifyAccessToken } from "../auth/jwt.js";
import { AuthUser } from "../auth/strategies.js";
import { PermissionValidator } from "database";

declare global {
  module Express {
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(
        ServiceResponse.failure(
          "Authentication required. Please provide a valid token.",
          null,
          StatusCodes.UNAUTHORIZED,
        ),
      );
    return;
  }

  const verification = verifyAccessToken(token);

  if (!verification.isValid) {
    const status = verification.expired ? StatusCodes.UNAUTHORIZED : StatusCodes.FORBIDDEN;
    const message = verification.expired
      ? "Token has expired. Please refresh your token."
      : "Invalid token provided.";

    res.status(status).json(ServiceResponse.failure(message, null, status));
    return;
  }

  passport.authenticate(
    "jwt",
    { session: false },
    (err: unknown, user: AuthUser | false, info?: { message?: string }): void => {
      if (err instanceof Error) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(
            ServiceResponse.failure(
              "Authentication error occurred.",
              null,
              StatusCodes.INTERNAL_SERVER_ERROR,
            ),
          );
        return;
      }

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            ServiceResponse.failure(
              info?.message ?? "Authentication failed.",
              null,
              StatusCodes.UNAUTHORIZED,
            ),
          );
        return;
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  const verification = verifyAccessToken(token);
  if (!verification.isValid) {
    next();
    return;
  }

  passport.authenticate("jwt", { session: false }, (err: unknown, user: AuthUser | false): void => {
    if (!err && user) req.user = user;
    next();
  })(req, res, next);
};

export const authenticateLocal = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    "local",
    { session: false },
    (err: unknown, user: AuthUser | false, info?: { message?: string }): void => {
      if (err instanceof Error) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(
            ServiceResponse.failure(
              "Authentication error occurred.",
              null,
              StatusCodes.INTERNAL_SERVER_ERROR,
            ),
          );
        return;
      }

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            ServiceResponse.failure(
              info?.message ?? "Invalid credentials provided.",
              null,
              StatusCodes.UNAUTHORIZED,
            ),
          );
        return;
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
    return;
  }
  if (!req.user.isEmailVerified) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ServiceResponse.failure("Email verification required.", null, StatusCodes.FORBIDDEN));
    return;
  }
  next();
};

export const requireActiveAccount = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
    return;
  }
  if (!req.user.isActive) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ServiceResponse.failure("Account is deactivated.", null, StatusCodes.FORBIDDEN));
    return;
  }
  if (req.user.isSuspended) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ServiceResponse.failure("Account is suspended.", null, StatusCodes.FORBIDDEN));
    return;
  }
  next();
};

export const requireRoles =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json(
          ServiceResponse.failure(
            `Insufficient roles. Required: ${allowedRoles.join(", ")}`,
            null,
            StatusCodes.FORBIDDEN,
          ),
        );
      return;
    }
    next();
  };

export const requirePermissions =
  (...requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
      return;
    }
    if (!PermissionValidator.hasAllPermissions(req.user.permissions, requiredPermissions)) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json(
          ServiceResponse.failure(
            `Missing permissions: ${requiredPermissions.join(", ")}`,
            { requiredPermissions, userPermissions: req.user.permissions },
            StatusCodes.FORBIDDEN,
          ),
        );
      return;
    }
    next();
  };

export const requireAnyPermission =
  (...requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
      return;
    }
    if (!PermissionValidator.hasAnyPermission(req.user.permissions, requiredPermissions)) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json(
          ServiceResponse.failure(
            `Requires at least one of: ${requiredPermissions.join(", ")}`,
            { requiredPermissions, userPermissions: req.user.permissions },
            StatusCodes.FORBIDDEN,
          ),
        );
      return;
    }
    next();
  };

export const requireOwnershipOrAdmin =
  (userIdField = "userId") =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
      return;
    }
    if (
      ["admin", "Super Administrator"].includes(req.user.role) ||
      req.user.permissions.some((p) => p.includes(":manage") || p.includes("system:manage"))
    ) {
      next();
      return;
    }

    const id =
      req.params[userIdField] ??
      (req.body as Record<string, unknown>)?.[userIdField] ??
      req.query[userIdField];
    if (!id) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ServiceResponse.failure("Resource ID not provided.", null, StatusCodes.BAD_REQUEST));
      return;
    }

    if (id !== req.user.id) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json(ServiceResponse.failure("Access denied. Not your resource.", null, StatusCodes.FORBIDDEN));
      return;
    }
    next();
  };

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ServiceResponse.failure("Authentication required.", null, StatusCodes.UNAUTHORIZED));
    return;
  }

  const isAdmin =
    ["admin", "Super Administrator"].includes(req.user.role) ||
    req.user.permissions.includes("system:manage");
  if (!isAdmin) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ServiceResponse.failure("Administrator access required.", null, StatusCodes.FORBIDDEN));
    return;
  }
  next();
};

export const developmentOnly = (_req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV !== "development") {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ServiceResponse.failure("Development only endpoint.", null, StatusCodes.FORBIDDEN));
    return;
  }
  next();
};

export const combineAuthMiddleware = (
  ...middlewares: ((req: Request, res: Response, next: NextFunction) => unknown)[]
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      for (const middleware of middlewares) {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err) => {
            err ? reject(err instanceof Error ? err : new Error("Unknown error")) : resolve();
          });
        });
      }
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("Middleware failure"));
    }
  };
};

export const hasPermission = (user: AuthUser | undefined, permission: string): boolean =>
  !!user && PermissionValidator.hasPermission(user.permissions, permission);

export const hasAnyPermission = (user: AuthUser | undefined, permissions: string[]): boolean =>
  !!user && PermissionValidator.hasAnyPermission(user.permissions, permissions);

export const authRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount);
export const authRequiredWithEmail = combineAuthMiddleware(
  authenticateJWT,
  requireActiveAccount,
  requireEmailVerified,
);
export const adminRequired = combineAuthMiddleware(authenticateJWT, requireActiveAccount, requireAdmin);

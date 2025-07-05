import type { DrizzleClient } from "database";
import { schema, eq, and, gte, lte } from "database";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { hashPassword, verifyPassword, generateSecureToken, hashToken } from "../../common/utils/password.js";
import { generateTokenPair, generateSessionId, verifyRefreshToken } from "../../common/auth/jwt.js";
import { env } from "../../common/utils/envConfig.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  UnauthorizedError,
} from "../../errors.js";
import type { AuthUser } from "../../common/auth/strategies.js";

export interface RegisterUserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResult {
  user: Omit<AuthUser, "passwordHash">;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  };
  sessionId: string;
}

export interface PasswordResetRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailVerificationData {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenData {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export const AuthService = {
  /**
   * Register a new user
   */
  async registerUser(drizzle: DrizzleClient, userData: RegisterUserData) {
    try {
      const { username, email, firstName, lastName, password } = userData;

      if (!username.trim()) {
        const error = new ValidationError("Username is required");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (!email.trim()) {
        const error = new ValidationError("Email is required");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (!firstName.trim()) {
        const error = new ValidationError("First name is required");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (!lastName.trim()) {
        const error = new ValidationError("Last name is required");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (!password) {
        const error = new ValidationError("Password is required");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const existingUser = await drizzle.query.user.findFirst({
        where: (user, { or, eq }) => or(eq(user.email, email), eq(user.username, username)),
      });

      if (existingUser) {
        const field = existingUser.email === email ? "email" : "username";
        const error = new ConflictError(`User with this ${field} already exists`);
        return ServiceResponse.failure(error.message, { field }, error.statusCode);
      }

      const passwordHash = await hashPassword(password);

      const result = await drizzle.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.user)
          .values({
            username,
            email,
            firstName,
            lastName,
            role: "user",
          })
          .returning();

        await tx.insert(schema.userAuth).values({
          userId: newUser.id,
          passwordHash,
          isEmailVerified: false,
          isActive: true,
          isSuspended: false,
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
        });

        const readerRole = await tx.query.userRoleType.findFirst({
          where: (userRoleType, { eq }) => eq(userRoleType.name, "Reader"),
        });

        if (readerRole) {
          await tx.insert(schema.userRole).values({
            userId: newUser.id,
            roleId: readerRole.id,
          });
        }

        const verificationToken = generateSecureToken();
        const tokenHash = hashToken(verificationToken);
        const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES);

        await tx.insert(schema.emailVerificationToken).values({
          userId: newUser.id,
          token: tokenHash,
          expiresAt,
        });

        return { user: newUser, verificationToken };
      });

      await this.logSecurityEvent(drizzle, {
        userId: result.user.id,
        action: "user_registered",
        details: JSON.stringify({ email, username }),
        severity: "info",
      });

      return ServiceResponse.success(
        "User registered successfully. Please check your email for verification instructions.",
        {
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
          },
          verificationToken: result.verificationToken,
        },
        201,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to register user: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Authenticate user and generate tokens
   */
  async login(drizzle: DrizzleClient, credentials: LoginCredentials) {
    try {
      const { email, password, ipAddress, userAgent } = credentials;

      const userWithAuth = await drizzle.query.user.findFirst({
        where: (user, { eq }) => eq(user.email, email),
        with: {
          userAuth: true,
          userRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      if (!userWithAuth) {
        await this.logLoginAttempt(drizzle, {
          email,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
          isSuccessful: false,
          failureReason: "invalid_email",
        });

        const error = new UnauthorizedError("Invalid email or password");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const { userAuth, userRoles, ...user } = userWithAuth;

      if (!userAuth) {
        const error = new ValidationError("Account not properly configured");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (!userAuth.isActive) {
        const error = new UnauthorizedError("Account is deactivated");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (userAuth.isSuspended) {
        const error = new UnauthorizedError("Account is suspended");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      if (userAuth.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
        const lockoutExpiry = userAuth.lastFailedLoginAt
          ? new Date(userAuth.lastFailedLoginAt.getTime() + env.LOCKOUT_TIME)
          : new Date();

        if (lockoutExpiry > new Date()) {
          const error = new UnauthorizedError("Account temporarily locked due to too many failed attempts");
          return ServiceResponse.failure(error.message, null, error.statusCode);
        }
      }

      const isValidPassword = await verifyPassword(password, userAuth.passwordHash);

      if (!isValidPassword) {
        await drizzle
          .update(schema.userAuth)
          .set({
            failedLoginAttempts: userAuth.failedLoginAttempts + 1,
            lastFailedLoginAt: new Date(),
          })
          .where(eq(schema.userAuth.userId, user.id));

        await this.logLoginAttempt(drizzle, {
          email,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
          isSuccessful: false,
          failureReason: "invalid_password",
        });

        const error = new UnauthorizedError("Invalid email or password");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const sessionId = generateSessionId();
      const permissions = userRoles.flatMap((ur) => ur.role.permissions || []);

      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions,
        sessionId,
      };

      const tokens = generateTokenPair(tokenPayload);

      const sessionExpiresAt = new Date(Date.now() + tokens.refreshExpiresIn * 1000);

      await drizzle.insert(schema.userSession).values({
        userId: user.id,
        sessionToken: sessionId,
        refreshToken: tokens.refreshToken,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        expiresAt: sessionExpiresAt,
      });

      await drizzle
        .update(schema.userAuth)
        .set({
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
          lastFailedLoginAt: null,
        })
        .where(eq(schema.userAuth.userId, user.id));

      await this.logLoginAttempt(drizzle, {
        email,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        isSuccessful: true,
      });

      await this.logSecurityEvent(drizzle, {
        userId: user.id,
        action: "login",
        details: JSON.stringify({ email, ipAddress, userAgent }),
        ipAddress,
        userAgent,
        severity: "info",
      });

      const authUser: Omit<AuthUser, "passwordHash"> = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions,
        isActive: userAuth.isActive,
        isEmailVerified: userAuth.isEmailVerified,
        isSuspended: userAuth.isSuspended,
      };

      const loginResult: LoginResult = {
        user: authUser,
        tokens,
        sessionId,
      };

      return ServiceResponse.success("Login successful", loginResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to login: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Logout user and invalidate session
   */
  async logout(drizzle: DrizzleClient, sessionId: string, userId: string) {
    try {
      await drizzle
        .update(schema.userSession)
        .set({ isActive: false })
        .where(and(eq(schema.userSession.sessionToken, sessionId), eq(schema.userSession.userId, userId)));

      await this.logSecurityEvent(drizzle, {
        userId,
        action: "logout",
        details: JSON.stringify({ sessionId }),
        severity: "info",
      });

      return ServiceResponse.success("Logout successful", null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to logout: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(drizzle: DrizzleClient, data: RefreshTokenData) {
    try {
      const { refreshToken, ipAddress, userAgent } = data;

      const verification = verifyRefreshToken(refreshToken);
      if (!verification.isValid || !verification.payload) {
        const error = new UnauthorizedError("Invalid or expired refresh token");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const payload = verification.payload;

      const session = await drizzle.query.userSession.findFirst({
        where: (s, { eq, and }) =>
          and(eq(s.refreshToken, refreshToken), eq(s.userId, payload.userId), eq(s.isActive, true)),
      });

      if (!session || session.expiresAt < new Date()) {
        const error = new UnauthorizedError("Session not found or expired");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const userWithRoles = await drizzle.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, payload.userId),
        with: {
          userRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      if (!userWithRoles) {
        const error = new NotFoundError("User", payload.userId);
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const permissions = userWithRoles.userRoles.flatMap((ur) => ur.role.permissions || []);
      const newTokenPayload = {
        userId: userWithRoles.id,
        username: userWithRoles.username,
        email: userWithRoles.email,
        role: userWithRoles.role,
        permissions,
        sessionId: payload.sessionId,
      };

      const newTokens = generateTokenPair(newTokenPayload);

      await drizzle
        .update(schema.userSession)
        .set({
          refreshToken: newTokens.refreshToken,
          lastAccessedAt: new Date(),
        })
        .where(eq(schema.userSession.id, session.id));

      await this.logSecurityEvent(drizzle, {
        userId: payload.userId,
        action: "token_refresh",
        details: JSON.stringify({ sessionId: payload.sessionId }),
        ipAddress,
        userAgent,
        severity: "info",
      });

      return ServiceResponse.success("Token refreshed successfully", {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        refreshExpiresIn: newTokens.refreshExpiresIn,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to refresh token: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(drizzle: DrizzleClient, data: PasswordResetRequest) {
    try {
      const { email, ipAddress, userAgent } = data;

      const user = await drizzle.query.user.findFirst({
        where: (user, { eq }) => eq(user.email, email),
      });

      if (!user) {
        return ServiceResponse.success(
          "If an account with that email exists, password reset instructions have been sent.",
          null,
        );
      }

      const resetToken = generateSecureToken();
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES);

      await drizzle.insert(schema.passwordResetToken).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      await this.logSecurityEvent(drizzle, {
        userId: user.id,
        action: "password_reset_requested",
        details: JSON.stringify({ email }),
        ipAddress,
        userAgent,
        severity: "warning",
      });

      return ServiceResponse.success(
        "If an account with that email exists, password reset instructions have been sent.",
        { resetToken },
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to request password reset: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Reset password using token
   */
  async resetPassword(drizzle: DrizzleClient, data: PasswordResetData) {
    try {
      const { token, newPassword, ipAddress, userAgent } = data;

      const tokenHash = hashToken(token);

      const resetToken = await drizzle.query.passwordResetToken.findFirst({
        where: (t, { eq, and }) => and(eq(t.token, tokenHash), eq(t.isUsed, false)),
        with: {
          user: true,
        },
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        const error = new ValidationError("Invalid or expired reset token");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const passwordHash = await hashPassword(newPassword);

      await drizzle.transaction(async (tx) => {
        await tx
          .update(schema.userAuth)
          .set({
            passwordHash,
            lastPasswordChangeAt: new Date(),
            failedLoginAttempts: 0,
          })
          .where(eq(schema.userAuth.userId, resetToken.userId));

        await tx
          .update(schema.passwordResetToken)
          .set({ isUsed: true })
          .where(eq(schema.passwordResetToken.id, resetToken.id));

        await tx
          .update(schema.userSession)
          .set({ isActive: false })
          .where(eq(schema.userSession.userId, resetToken.userId));
      });

      await this.logSecurityEvent(drizzle, {
        userId: resetToken.userId,
        action: "password_reset_completed",
        details: JSON.stringify({ email: resetToken.user.email }),
        ipAddress,
        userAgent,
        severity: "warning",
      });

      return ServiceResponse.success("Password reset successfully", null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to reset password: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Verify email address
   */
  async verifyEmail(drizzle: DrizzleClient, data: EmailVerificationData) {
    try {
      const { token, ipAddress, userAgent } = data;

      const tokenHash = hashToken(token);

      const verificationToken = await drizzle.query.emailVerificationToken.findFirst({
        where: (t, { eq, and }) => and(eq(t.token, tokenHash), eq(t.isUsed, false)),
      });

      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        const error = new ValidationError("Invalid or expired verification token");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      await drizzle.transaction(async (tx) => {
        await tx
          .update(schema.userAuth)
          .set({
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          })
          .where(eq(schema.userAuth.userId, verificationToken.userId));

        await tx
          .update(schema.emailVerificationToken)
          .set({ isUsed: true })
          .where(eq(schema.emailVerificationToken.id, verificationToken.id));
      });

      await this.logSecurityEvent(drizzle, {
        userId: verificationToken.userId,
        action: "email_verified",
        ipAddress,
        userAgent,
        severity: "info",
      });

      return ServiceResponse.success("Email verified successfully", null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to verify email: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Change user password (requires current password)
   */
  async changePassword(drizzle: DrizzleClient, data: ChangePasswordData) {
    try {
      const { userId, currentPassword, newPassword, ipAddress, userAgent } = data;

      const userAuthData = await drizzle.query.userAuth.findFirst({
        where: (auth, { eq }) => eq(auth.userId, userId),
      });

      if (!userAuthData) {
        const error = new NotFoundError("User authentication data", userId);
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const isValidPassword = await verifyPassword(currentPassword, userAuthData.passwordHash);

      if (!isValidPassword) {
        const error = new UnauthorizedError("Current password is incorrect");
        return ServiceResponse.failure(error.message, null, error.statusCode);
      }

      const passwordHash = await hashPassword(newPassword);

      await drizzle
        .update(schema.userAuth)
        .set({
          passwordHash,
          lastPasswordChangeAt: new Date(),
        })
        .where(eq(schema.userAuth.userId, userId));

      await this.logSecurityEvent(drizzle, {
        userId,
        action: "password_changed",
        ipAddress,
        userAgent,
        severity: "info",
      });

      return ServiceResponse.success("Password changed successfully", null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to change password: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  /**
   * Log security events
   */
  async logSecurityEvent(
    drizzle: DrizzleClient,
    event: {
      userId?: string;
      action: string;
      details?: string;
      ipAddress?: string;
      userAgent?: string;
      severity?: "info" | "warning" | "critical";
    },
  ) {
    try {
      await drizzle.insert(schema.securityAuditLog).values({
        userId: event.userId || null,
        action: event.action,
        details: event.details || null,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        severity: event.severity || "info",
      });
    } catch (err) {
      console.error("Failed to log security event:", err);
    }
  },

  /**
   * Log login attempts
   */
  async logLoginAttempt(
    drizzle: DrizzleClient,
    attempt: {
      email: string;
      ipAddress: string;
      userAgent: string;
      isSuccessful: boolean;
      failureReason?: string;
    },
  ) {
    try {
      await drizzle.insert(schema.loginAttempt).values({
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        isSuccessful: attempt.isSuccessful,
        failureReason: attempt.failureReason || null,
      });
    } catch (err) {
      console.error("Failed to log login attempt:", err);
    }
  },
} as const;

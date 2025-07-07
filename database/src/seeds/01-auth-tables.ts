import { seed, reset } from "drizzle-seed";
import { DrizzleClient } from "../drizzle.js";

// Import referenced tables
import { user } from "../drizzle/user.js";
import { userRoleType } from "../drizzle/role.js";

// Import auth-related tables that depend on users
import { userRole } from "../drizzle/userRole.js";
import { userSession } from "../drizzle/userSession.js";
import { passwordResetToken } from "../drizzle/passwordResetToken.js";
import { emailVerificationToken } from "../drizzle/emailVerificationToken.js";
import { accountLockout } from "../drizzle/accountLockout.js";
import { oauthProfile } from "../drizzle/oauthProfile.js";
import { securityAuditLog } from "../drizzle/securityAuditLog.js";

export async function runSeed(drizzle: DrizzleClient) {
  // Reset auth tables (users and roles should already exist from basic seeder)
  await reset(drizzle, {
    userRole,
    userSession,
    passwordResetToken,
    emailVerificationToken,
    accountLockout,
    oauthProfile,
    securityAuditLog,
  });

  await seed(drizzle, {
    user,
    userRoleType,
    userRole,
    userSession,
    passwordResetToken,
    emailVerificationToken,
    accountLockout,
    oauthProfile,
    securityAuditLog,
  }).refine((funcs) => ({
    userRole: {
      count: 30,
      columns: {
        id: funcs.uuid(),
        assignedAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    userSession: {
      count: 50,
      columns: {
        id: funcs.uuid(),
        sessionToken: funcs.string(),
        refreshToken: funcs.string(),
        ipAddress: funcs.default({ defaultValue: "192.168.1.1" }),
        userAgent: funcs.string(),
        isActive: funcs.boolean(),
        expiresAt: funcs.date({
          minDate: new Date(),
          maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        createdAt: funcs.date(),
        lastAccessedAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    passwordResetToken: {
      count: 10,
      columns: {
        id: funcs.uuid(),
        token: funcs.string(),
        expiresAt: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        isUsed: funcs.boolean(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    emailVerificationToken: {
      count: 8,
      columns: {
        id: funcs.uuid(),
        token: funcs.string(),
        expiresAt: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        isUsed: funcs.boolean(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    accountLockout: {
      count: 3,
      columns: {
        id: funcs.uuid(),
        lockedAt: funcs.date(),
        lockedUntil: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        reason: funcs.valuesFromArray({
          values: [
            "Too many failed login attempts",
            "Suspicious activity",
            "Admin lockout",
            "Security breach",
          ],
        }),
        failedAttempts: funcs.int({ minValue: 3, maxValue: 10 }),
        isActive: funcs.boolean(),
      },
    },

    oauthProfile: {
      count: 15,
      columns: {
        id: funcs.uuid(),
        provider: funcs.valuesFromArray({
          values: ["google", "github", "facebook", "twitter"],
        }),
        providerId: funcs.string(),
        email: funcs.email(),
        profileData: funcs.string(),
        accessToken: funcs.string(),
        refreshToken: funcs.string(),
        tokenExpiresAt: funcs.date({
          minDate: new Date(),
          maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    securityAuditLog: {
      count: 100,
      columns: {
        id: funcs.uuid(),
        action: funcs.valuesFromArray({
          values: [
            "login",
            "logout",
            "password_change",
            "profile_update",
            "role_assignment",
            "data_access",
            "failed_login",
          ],
        }),
        details: funcs.loremIpsum(),
        ipAddress: funcs.default({ defaultValue: "192.168.1.1" }),
        userAgent: funcs.string(),
        timestamp: funcs.date(),
        severity: funcs.valuesFromArray({
          values: ["info", "warning", "error", "critical"],
        }),
      },
    },
  }));
}


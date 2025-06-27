import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { 
  userSession, 
  passwordResetToken, 
  emailVerificationToken,
  loginAttempt,
  role,
  userRole,
  securityAuditLog,
  accountLockout
} from "./auth.js";

// User Session Relations
export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(user, {
    fields: [userSession.userId],
    references: [user.id],
  }),
}));

// Password Reset Token Relations
export const passwordResetTokenRelations = relations(passwordResetToken, ({ one }) => ({
  user: one(user, {
    fields: [passwordResetToken.userId],
    references: [user.id],
  }),
}));

// Email Verification Token Relations
export const emailVerificationTokenRelations = relations(emailVerificationToken, ({ one }) => ({
  user: one(user, {
    fields: [emailVerificationToken.userId],
    references: [user.id],
  }),
}));

// User Role Relations (many-to-many)
export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
  assignedByUser: one(user, {
    fields: [userRole.assignedBy],
    references: [user.id],
  }),
}));

// Role Relations
export const roleRelations = relations(role, ({ many }) => ({
  userRoles: many(userRole),
}));

// Security Audit Log Relations
export const securityAuditLogRelations = relations(securityAuditLog, ({ one }) => ({
  user: one(user, {
    fields: [securityAuditLog.userId],
    references: [user.id],
  }),
}));

// Account Lockout Relations
export const accountLockoutRelations = relations(accountLockout, ({ one }) => ({
  user: one(user, {
    fields: [accountLockout.userId],
    references: [user.id],
  }),
}));

// Enhanced User Relations (to include auth-related relations)
export const userAuthRelations = relations(user, ({ many }) => ({
  sessions: many(userSession),
  passwordResetTokens: many(passwordResetToken),
  emailVerificationTokens: many(emailVerificationToken),
  userRoles: many(userRole),
  assignedRoles: many(userRole), // Roles this user has assigned to others
  auditLogs: many(securityAuditLog),
  accountLockouts: many(accountLockout),
}));
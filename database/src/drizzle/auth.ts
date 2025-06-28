import { text, timestamp, boolean, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";


export const userSession = server.table(
  "user_session",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    refreshToken: text("refresh_token"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").default(true).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_session_token").on(table.sessionToken),
    uniqueIndex("unique_refresh_token").on(table.refreshToken),
    index("idx_user_sessions_user_id").on(table.userId),
    index("idx_user_sessions_expires_at").on(table.expiresAt),
  ]
);


export const passwordResetToken = server.table(
  "password_reset_token",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_password_reset_token").on(table.token),
    index("idx_password_reset_user_id").on(table.userId),
    index("idx_password_reset_expires_at").on(table.expiresAt),
  ]
);


export const emailVerificationToken = server.table(
  "email_verification_token",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_email_verification_token").on(table.token),
    index("idx_email_verification_user_id").on(table.userId),
    index("idx_email_verification_expires_at").on(table.expiresAt),
  ]
);


export const loginAttempt = server.table(
  "login_attempt",
  {
    id: idpk("id"),
    email: text("email").notNull(),
    ipAddress: text("ip_address").notNull(),
    isSuccessful: boolean("is_successful").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    userAgent: text("user_agent"),
    failureReason: text("failure_reason"), 
  },
  (table) => [
    index("idx_login_attempts_email").on(table.email),
    index("idx_login_attempts_ip").on(table.ipAddress),
    index("idx_login_attempts_attempted_at").on(table.attemptedAt),
  ]
);


export const role = server.table(
  "role",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    description: text("description"),
    permissions: text("permissions").array(), 
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_role_name").on(table.name),
  ]
);


export const userRole = server.table(
  "user_role",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id").notNull().references(() => role.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    assignedBy: text("assigned_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("unique_user_role").on(table.userId, table.roleId),
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role_id").on(table.roleId),
  ]
);


export const securityAuditLog = server.table(
  "security_audit_log",
  {
    id: idpk("id"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(), 
    details: text("details"), 
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    severity: text("severity").notNull().default("info"), 
  },
  (table) => [
    index("idx_audit_log_user_id").on(table.userId),
    index("idx_audit_log_action").on(table.action),
    index("idx_audit_log_timestamp").on(table.timestamp),
    index("idx_audit_log_severity").on(table.severity),
  ]
);


export const accountLockout = server.table(
  "account_lockout",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    lockedAt: timestamp("locked_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "date" }).notNull(),
    reason: text("reason").notNull(), 
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("idx_account_lockout_user_id").on(table.userId),
    index("idx_account_lockout_locked_until").on(table.lockedUntil),
  ]
);


export const oauthProfile = server.table(
  "oauth_profile",
  {
    id: idpk("id"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), 
    providerId: text("provider_id").notNull(), 
    email: text("email").notNull(),
    profileData: text("profile_data"), 
    accessToken: text("access_token"), 
    refreshToken: text("refresh_token"), 
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_oauth_provider_user").on(table.provider, table.providerId),
    uniqueIndex("unique_oauth_user_provider").on(table.userId, table.provider),
    index("idx_oauth_profile_user_id").on(table.userId),
    index("idx_oauth_profile_provider").on(table.provider),
    index("idx_oauth_profile_email").on(table.email),
  ]
);

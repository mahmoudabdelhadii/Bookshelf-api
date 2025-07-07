import { text, index, uuid, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { server } from "./_common.js";
import { user } from "./user.js";

export const userAuth = server.table(
  "user_auth",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: "date" }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
    lastPasswordChangeAt: timestamp("last_password_change_at", { withTimezone: true, mode: "date" }),
    isActive: boolean("is_active").default(true).notNull(),
    isSuspended: boolean("is_suspended").default(false).notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
    suspendedBy: uuid("suspended_by").references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    suspensionReason: text("suspension_reason"),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lastFailedLoginAt: timestamp("last_failed_login_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("idx_user_auth_user_id").on(table.userId)],
);

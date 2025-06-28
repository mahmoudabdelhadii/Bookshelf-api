import { text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
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

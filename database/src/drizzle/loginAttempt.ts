import { text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";


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

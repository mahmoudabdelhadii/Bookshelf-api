import { text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";

export const accountLockout = server.table(
  "account_lockout",
  {
    id: idpk("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lockedAt: timestamp("locked_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "date" }).notNull(),
    reason: text("reason").notNull(),
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("idx_account_lockout_user_id").on(table.userId),
    index("idx_account_lockout_locked_until").on(table.lockedUntil),
  ],
);

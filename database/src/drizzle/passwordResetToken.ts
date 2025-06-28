import { text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";


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

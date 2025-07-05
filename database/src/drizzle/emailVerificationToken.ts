import { text, timestamp, boolean, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";

export const emailVerificationToken = server.table(
  "email_verification_token",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_email_verification_token").on(table.token),
    index("idx_email_verification_user_id").on(table.userId),
    index("idx_email_verification_expires_at").on(table.expiresAt),
  ],
);

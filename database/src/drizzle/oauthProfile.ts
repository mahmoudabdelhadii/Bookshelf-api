import { text, timestamp, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";

export const oauthProfile = server.table(
  "oauth_profile",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
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
  ],
);

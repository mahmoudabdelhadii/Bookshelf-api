import { text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const user = server.table(
  "user",
  {
    id: idpk("id"),
    username: text("username").notNull(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex("unique_email").on(table.email),
      usernameIndex: uniqueIndex("unique_username").on(table.username),
    };
  },
);
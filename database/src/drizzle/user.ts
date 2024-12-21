import { text, timestamp, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

const userRole = server.enum("role", ["user", "admin"]);

export const user = server.table(
  "user",
  {
    id: idpk("id"),
    username: text("username").notNull(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: userRole("role").default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex("unique_email").on(table.email),
      usernameIndex: uniqueIndex("unique_username").on(table.username),
    };
  },
);

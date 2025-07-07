import { text, index, uuid } from "drizzle-orm/pg-core";
import { server } from "./_common.js";
import { user } from "./user.js";

export const userAuth = server.table(
  "user_auth",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    hashedPassword: text("hashed_password").notNull(),
  },
  (table) => [index("idx_user_auth_user_id").on(table.userId)],
);


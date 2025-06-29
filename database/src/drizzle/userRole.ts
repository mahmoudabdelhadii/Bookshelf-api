import { text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { role } from "./role.js";

export const userRole = server.table(
  "user_role",
  {
    id: idpk("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    assignedBy: text("assigned_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("unique_user_role").on(table.userId, table.roleId),
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role_id").on(table.roleId),
  ],
);

import { timestamp, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { role } from "./role.js";

export const userRole = server.table(
  "user_role",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "restrict", onUpdate: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    assignedBy: uuid("assigned_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  },
  (table) => [
    uniqueIndex("unique_user_role").on(table.userId, table.roleId),
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role_id").on(table.roleId),
  ],
);

import { timestamp, uuid, boolean, text, uniqueIndex } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { library } from "./library.js";

export const libraryMemberRoleEnum = server.enum("library_member_role", [
  "owner",
  "manager",
  "staff",
  "member",
]);

export const libraryMember = server.table(
  "library_member",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    libraryId: uuid("library_id")
      .notNull()
      .references(() => library.id, { onDelete: "restrict", onUpdate: "cascade" }),
    role: libraryMemberRoleEnum("role").default("member").notNull(),
    permissions: text("permissions").array(),
    joinDate: timestamp("join_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    invitedBy: uuid("invited_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_library_member").on(table.userId, table.libraryId),
  ],
);

import { timestamp, uuid, pgEnum, boolean, text } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { library } from "./library.js";

export const libraryMemberRoleEnum = pgEnum("library_member_role", ["owner", "manager", "staff", "member"]);

export const libraryMember = server.table("library_member", {
  id: idpk("id"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  libraryId: uuid("library_id")
    .notNull()
    .references(() => library.id),
  role: libraryMemberRoleEnum("role").default("member").notNull(),
  permissions: text("permissions").array(),
  joinDate: timestamp("join_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  invitedBy: uuid("invited_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

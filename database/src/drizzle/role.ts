import { text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";


export const role = server.table(
  "role",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    description: text("description"),
    permissions: text("permissions").array(), 
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_role_name").on(table.name),
  ]
);

import { text, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const publisher = server.table(
  "publisher",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_publisher_name").on(table.name)],
);

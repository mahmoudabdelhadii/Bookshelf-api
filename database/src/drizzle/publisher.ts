import { integer, text, uniqueIndex, timestamp, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { sql } from "drizzle-orm";

export const publisher = server.table(
  "publisher",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    publisherNameIndex: uniqueIndex("unique_publisher_name").on(table.name),
  }),
);
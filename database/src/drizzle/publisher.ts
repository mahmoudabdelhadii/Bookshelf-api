import { text, uniqueIndex, timestamp, integer } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const publisher = server.table(
  "publisher",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    address: text("address"),
    website: text("website"),
    foundedYear: integer("founded_year"),
    booksCount: integer("books_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_publisher_name").on(table.name)],
);

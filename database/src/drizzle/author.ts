import { text, uniqueIndex, timestamp, integer } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const author = server.table(
  "author",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    biography: text("biography"),
    birthDate: text("birth_date"),
    nationality: text("nationality"),
    booksCount: integer("books_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_author_name").on(table.name)],
);

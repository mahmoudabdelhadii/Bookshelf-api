import { text, uniqueIndex, timestamp, AnyPgColumn, uuid, integer } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const subject = server.table(
  "subject",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    description: text("description"),
    parent: uuid("parent").references((): AnyPgColumn => subject.id),
    booksCount: integer("books_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_subject_name").on(table.name)],
);

import { uuid, text, integer, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const books = server.table(
  "books",
  {
    id: idpk("id"),
    title: text("title").notNull(),
    author: text("author").notNull(),
    publishedYear: integer("published_year"),
    isbn: text("isbn").unique(),
    genre: text("genre"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      isbnIndex: uniqueIndex("unique_isbn").on(table.isbn),
    };
  },
);
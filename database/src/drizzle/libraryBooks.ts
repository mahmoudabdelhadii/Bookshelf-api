import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import { server, idpk } from "./_common.js";
import { library } from "./library.js";
import { book } from "./book.js";

export const libraryBooks = server.table("library_books", {
  id: idpk("id"),

  libraryId: uuid("library_id")
    .notNull()
    .references(() => library.id, { onDelete: "cascade", onUpdate: "cascade" }),

  bookId: uuid("book_id")
    .notNull()
    .references(() => book.id, { onDelete: "cascade", onUpdate: "cascade" }),

  shelfLocation: text("shelf_location"),
  condition: text("condition"),
  addedAt: timestamp("added_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

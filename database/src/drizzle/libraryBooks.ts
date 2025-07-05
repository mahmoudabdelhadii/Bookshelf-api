import { uuid, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { server, idpk } from "./_common.js";
import { library } from "./library.js";
import { book } from "./book.js";

export const libraryBooks = server.table(
  "library_books",
  {
    id: idpk("id"),

    libraryId: uuid("library_id")
      .notNull()
      .references(() => library.id, { onDelete: "cascade", onUpdate: "cascade" }),

    bookId: uuid("book_id")
      .notNull()
      .references(() => book.id, { onDelete: "cascade", onUpdate: "cascade" }),

    quantity: integer("quantity").default(1).notNull(),
    shelfLocation: text("shelf_location"),
    condition: text("condition"),
    addedAt: timestamp("added_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_library_book").on(table.libraryId, table.bookId),
  ],
);

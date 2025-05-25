import { relations } from "drizzle-orm";
import { library } from "./library.js";
import { libraryBooks } from "./libraryBooks.js";
import { book } from "./book.js";

export const libraryBooksRelations = relations(libraryBooks, ({ one }) => ({
  library: one(library, {
    fields: [libraryBooks.libraryId],
    references: [library.id],
  }),
  book: one(book, {
    fields: [libraryBooks.bookId],
    references: [book.id],
  }),
}));

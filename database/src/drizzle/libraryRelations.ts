// src/drizzle/relations/libraryRelations.ts

import { relations } from "drizzle-orm";
import { library } from "./library.js";
import { libraryBooks } from "./libraryBooks.js";
import { book } from "./book.js";

// One library has many libraryBooks
export const libraryRelations = relations(library, ({ many }) => ({
  books: many(libraryBooks),
}));

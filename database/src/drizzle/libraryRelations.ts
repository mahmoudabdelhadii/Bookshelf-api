import { relations } from "drizzle-orm";
import { library } from "./library.js";
import { libraryBooks } from "./libraryBooks.js";

export const libraryRelations = relations(library, ({ many }) => ({
  books: many(libraryBooks),
}));

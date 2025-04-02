import { relations } from "drizzle-orm";
import { book } from "./book.js";
import { author } from "./author.js";


export const authorRelations = relations(author, ({ many }) => ({
    books: many(book),
  }));
  
import { relations } from "drizzle-orm";
import { book } from "./book.js";
import { publisher } from "./publisher.js";

export const publisherRelations = relations(publisher, ({ many }) => ({
    books: many(book),
  }));
import { relations } from "drizzle-orm";
import { book } from "./book.js";
import { subject } from "./subject.js";

export const subjectRelations = relations(subject, ({ many }) => ({
  books: many(book),
}));

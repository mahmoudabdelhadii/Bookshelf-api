import { relations } from "drizzle-orm";
import { book } from "./book.js";
import { author } from "./author.js";
import { publisher } from "./publisher.js";
import { subject } from "./subject.js";
import { libraryBooks } from "./libraryBooks.js";

export const bookRelations = relations(book, ({ one, many }) => ({
  author: one(author, {
    fields: [book.authorId],
    references: [author.id],
  }),
  publisher: one(publisher, {
    fields: [book.publisherId],
    references: [publisher.id],
  }),
  subject: one(subject, {
    fields: [book.subjectId],
    references: [subject.id],
  }),
  libraries: many(libraryBooks),
}));

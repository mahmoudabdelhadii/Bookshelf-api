import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "../../common/utils/commonValidation.js";

extendZodWithOpenApi(z);

export type LibraryBook = z.infer<typeof libraryBookSchema>;
export type CreateLibraryBook = z.infer<typeof createLibraryBookSchema>;
export type UpdateLibraryBook = z.infer<typeof updateLibraryBookSchema>;

export const libraryBookSchema = z.object({
  id: z.string().uuid().openapi({ description: "The unique identifier of the library book entry" }),
  libraryId: z.string().uuid().openapi({ description: "The library ID where the book is located" }),
  bookId: z.string().uuid().openapi({ description: "The book ID" }),
  shelfLocation: z.string().max(100).nullable().optional().openapi({ description: "The shelf location of the book" }),
  condition: z.string().max(50).nullable().optional().openapi({ description: "The condition of the book" }),
  addedAt: z.date().openapi({ description: "Timestamp when the book was added to the library" }),
});

export const libraryBookWithDetailsSchema = libraryBookSchema.extend({
  book: z.object({
    id: z.string().uuid(),
    title: z.string(),
    author: z.string(),
    isbn: z.string().optional(),
    genre: z.string().optional(),
    publishedYear: z.number().optional(),
    language: z.enum(["en", "ar", "other"]),
  }).openapi({ description: "Book details" }),
  library: z.object({
    id: z.string().uuid(),
    name: z.string(),
    location: z.string().optional(),
  }).openapi({ description: "Library details" }),
});

export const createLibraryBookSchema = z.object({
  libraryId: z.string().uuid().openapi({ description: "The library ID where the book will be added" }),
  bookId: z.string().uuid().openapi({ description: "The book ID to add to the library" }),
  shelfLocation: z.string().max(100).optional().openapi({ description: "The shelf location of the book" }),
  condition: z.string().max(50).optional().openapi({ description: "The condition of the book" }),
});

export const updateLibraryBookSchema = z.object({
  shelfLocation: z.string().max(100).optional().openapi({ description: "The shelf location of the book" }),
  condition: z.string().max(50).optional().openapi({ description: "The condition of the book" }),
});

export const getLibraryBookSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const getLibraryBooksSchema = z.object({
  params: z.object({ libraryId: commonValidations.id }),
});
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

const titleSchema = z
  .string()
  .min(2, "Title must be at least 2 characters long")
  .max(200, "Title cannot exceed 200 characters")
  .openapi({ description: "The title of the book" });

const isbnSchema = z
  .string()
  .regex(/^(97(8|9))?\d{9}(\d|X)$/, "Invalid ISBN format")
  .max(20, "ISBN cannot exceed 20 characters")
  .openapi({ description: "The ISBN of the book" });

const genreSchema = z
  .string()
  .min(2, "Genre must be at least 2 characters")
  .max(50, "Genre cannot exceed 50 characters")
  .openapi({ description: "The genre of the book" });

const publishedYearSchema = z
  .number()
  .int("publishedYear must be an integer")
  .min(0, "publishedYear cannot be negative")
  .max(new Date().getFullYear(), "publishedYear cannot be in the future")
  .optional()
  .openapi({ description: "The year the book was published" });

export const bookSchema = z
  .object({
    id: idSchema,
    title: z
      .string()
      .min(2, "Title must be at least 2 characters long")
      .max(200, "Title cannot exceed 200 characters")
      .openapi({ description: "Book title" }),
    titleLong: z.string().nullable().optional().openapi({ description: "Extended book title" }),
    isbn: z.string().nullable().optional().openapi({ description: "ISBN number" }),
    isbn13: z.string().nullable().optional().openapi({ description: "ISBN-13 number" }),
    deweyDecimal: z.string().nullable().optional().openapi({ description: "Dewey decimal classification" }),
    binding: z.string().nullable().optional().openapi({ description: "Book binding type" }),
    language: z.enum(["en", "ar", "other"]).default("other").openapi({ description: "Book language" }),
    authorId: idSchema.openapi({ description: "Author ID" }),
    publisherId: idSchema.openapi({ description: "Publisher ID" }),
    subjectId: idSchema.nullable().optional().openapi({ description: "Subject ID" }),
    genre: z.string().nullable().optional().openapi({ description: "Book genre" }),
    publishedYear: z
      .number()
      .int()
      .min(0)
      .max(new Date().getFullYear())
      .nullable()
      .optional()
      .openapi({ description: "Year the book was published" }),
    edition: z.string().nullable().optional().openapi({ description: "Book edition" }),
    pages: z.number().int().min(0).nullable().optional().openapi({ description: "Number of pages" }),
    overview: z.string().nullable().optional().openapi({ description: "Book overview" }),
    image: z.string().nullable().optional().openapi({ description: "Book cover image URL" }),
    excerpt: z.string().nullable().optional().openapi({ description: "Book excerpt" }),
    synopsis: z.string().nullable().optional().openapi({ description: "Book synopsis" }),
    createdAt: z.date().openapi({ description: "Timestamp when the book was created" }),
  })
  .openapi({ description: "Complete book information" });

export const getBookSchema = z
  .object({
    params: z.object({
      id: idSchema,
    }),
  })
  .openapi({ description: "Get book by ID parameters" });

export const createBookSchema = z
  .object({
    title: titleSchema,
    author: z
      .string()
      .min(2, "Author name must be at least 2 characters long")
      .max(100, "Author name cannot exceed 100 characters")
      .openapi({ description: "Author name (will be linked to existing author or create new)" }),
    publisher: z
      .string()
      .min(1, "Publisher name is required")
      .max(100, "Publisher name cannot exceed 100 characters")
      .openapi({ description: "Publisher name (will be linked to existing publisher or create new)" }),
    isbn: isbnSchema.optional(),
    genre: genreSchema.optional(),
    publishedYear: publishedYearSchema,
    language: z.enum(["en", "ar", "other"]).openapi({ description: "The language of the book" }),
  })
  .openapi({ description: "Book creation data" });

export const createBookWithIdsSchema = z
  .object({
    title: z
      .string()
      .min(2, "Title must be at least 2 characters long")
      .max(200, "Title cannot exceed 200 characters")
      .openapi({ description: "Book title" }),
    titleLong: z.string().optional().openapi({ description: "Extended book title" }),
    isbn: z.string().optional().openapi({ description: "ISBN number" }),
    isbn13: z.string().optional().openapi({ description: "ISBN-13 number" }),
    deweyDecimal: z.string().optional().openapi({ description: "Dewey decimal classification" }),
    binding: z.string().optional().openapi({ description: "Book binding type" }),
    language: z.enum(["en", "ar", "other"]).default("other").openapi({ description: "Book language" }),
    authorId: idSchema.openapi({ description: "Author ID" }),
    publisherId: idSchema.openapi({ description: "Publisher ID" }),
    subjectId: idSchema.optional().openapi({ description: "Subject ID" }),
    genre: z.string().optional().openapi({ description: "Book genre" }),
    publishedYear: z
      .number()
      .int()
      .min(0)
      .max(new Date().getFullYear())
      .optional()
      .openapi({ description: "Year the book was published" }),
    edition: z.string().optional().openapi({ description: "Book edition" }),
    pages: z.number().int().min(0).optional().openapi({ description: "Number of pages" }),
    overview: z.string().optional().openapi({ description: "Book overview" }),
    image: z.string().optional().openapi({ description: "Book cover image URL" }),
    excerpt: z.string().optional().openapi({ description: "Book excerpt" }),
    synopsis: z.string().optional().openapi({ description: "Book synopsis" }),
  })
  .openapi({ description: "Book creation with existing entity IDs" });

export const updateBookSchema = createBookSchema.partial().openapi({ description: "Book update data" });

export const createBooksBulkSchema = z
  .array(createBookWithIdsSchema)
  .min(1)
  .max(100)
  .openapi({ description: "Array of books for bulk creation" });

export const bookWithRelationsSchema = bookSchema
  .extend({
    author: z
      .object({
        id: idSchema,
        name: z.string(),
        nationality: z.string().nullable().optional(),
      })
      .openapi({ description: "Author information" }),
    publisher: z
      .object({
        id: idSchema,
        name: z.string(),
        foundedYear: z.number().int().nullable().optional(),
      })
      .openapi({ description: "Publisher information" }),
    subject: z
      .object({
        id: idSchema,
        name: z.string(),
        description: z.string().nullable().optional(),
      })
      .nullable()
      .optional()
      .openapi({ description: "Subject information" }),
  })
  .openapi({ description: "Book with related entity details" });

export const bookWithStatsSchema = bookWithRelationsSchema
  .extend({
    totalCopies: z.number().int().min(0).openapi({ description: "Total copies across all libraries" }),
    availableCopies: z.number().int().min(0).openapi({ description: "Currently available copies" }),
    borrowedCopies: z.number().int().min(0).openapi({ description: "Currently borrowed copies" }),
    totalBorrows: z.number().int().min(0).openapi({ description: "Total number of times borrowed" }),
    averageRating: z
      .number()
      .min(0)
      .max(5)
      .nullable()
      .optional()
      .openapi({ description: "Average user rating" }),
    popularInLibraries: z
      .array(
        z.object({
          libraryId: idSchema,
          libraryName: z.string(),
          borrowCount: z.number().int().min(0),
        }),
      )
      .optional()
      .openapi({ description: "Libraries where this book is most popular" }),
  })
  .openapi({ description: "Book with computed statistics" });

export type Book = z.infer<typeof bookSchema>;
export type CreateBook = z.infer<typeof createBookSchema>;
export type CreateBookWithIds = z.infer<typeof createBookWithIdsSchema>;
export type UpdateBook = z.infer<typeof updateBookSchema>;
export type BookWithRelations = z.infer<typeof bookWithRelationsSchema>;
export type BookWithStats = z.infer<typeof bookWithStatsSchema>;

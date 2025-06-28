import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

const languageSchema = z.enum(["en", "ar", "other"]).describe("The language of the book.");

const titleSchema = z
  .string()
  .min(2, "Title must be at least 2 characters long")
  .max(200, "Title cannot exceed 200 characters")
  .describe("The title of the book.");

const authorSchema = z
  .string()
  .min(2, "Author name must be at least 2 characters long")
  .max(100, "Author name cannot exceed 100 characters")
  .describe("The author of the book.");

const isbnSchema = z
  .string()
  .regex(/^(97(8|9))?\d{9}(\d|X)$/, "Invalid ISBN format")
  .max(20, "ISBN cannot exceed 20 characters")
  .describe("The ISBN of the book.");

const genreSchema = z
  .string()
  .min(2, "Genre must be at least 2 characters")
  .max(50, "Genre cannot exceed 50 characters")
  .describe("The genre of the book.");

const publishedYearSchema = z
  .number()
  .int("publishedYear must be an integer")
  .min(0, "publishedYear cannot be negative")
  .max(new Date().getFullYear(), "publishedYear cannot be in the future")
  .optional()
  .describe("The year the book was published.");

export const bookSchema = z.object({
  id: idSchema,
  title: titleSchema,
  titleLong: z.string().nullable().optional().describe("The full title of the book."),
  isbn: z.string().nullable().optional().describe("The ISBN of the book."),
  isbn13: z.string().nullable().optional().describe("The ISBN-13 of the book."),
  deweyDecimal: z.string().nullable().optional().describe("The Dewey Decimal classification."),
  binding: z.string().nullable().optional().describe("The binding type of the book."),
  language: languageSchema,
  authorId: idSchema.describe("The UUID of the author."),
  publisherId: idSchema.describe("The UUID of the publisher."),
  subjectId: idSchema.nullable().optional().describe("The UUID of the subject."),
  genre: z.string().nullable().optional().describe("The genre of the book."),
  datePublished: z.date().max(new Date(), "Publication date cannot be in the future").nullable().optional().describe("The publication date."),
  edition: z.string().nullable().optional().describe("The edition of the book."),
  pages: z.number().nullable().optional().describe("The number of pages."),
  overview: z.string().nullable().optional().describe("An overview of the book."),
  image: z.string().nullable().optional().describe("URL to the book's cover image."),
  excerpt: z.string().nullable().optional().describe("An excerpt from the book."),
  synopsis: z.string().nullable().optional().describe("A synopsis of the book."),
  createdAt: z.date().describe("Timestamp when the book was created."),
});

export type Book = z.infer<typeof bookSchema>;

export const getBookSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});


export const createBookSchema = z.object({
  title: titleSchema,
  author: authorSchema,
  publisher: authorSchema.describe("The publisher of the book."),
  isbn: isbnSchema,
  genre: genreSchema,
  publishedYear: publishedYearSchema.optional(),
  language: languageSchema,
});


export const updateBookSchema = z.object({
  title: titleSchema.optional(),
  author: authorSchema.optional(),
  publisher: authorSchema.describe("The publisher of the book.").optional(),
  isbn: isbnSchema.optional(),
  genre: genreSchema.optional(),
  publishedYear: publishedYearSchema.optional(),
  language: languageSchema.optional(),
});


export const createBooksBulkSchema = z.array(
  z.object({
    title: titleSchema,
    authorId: idSchema.describe("The UUID of an existing author."),
    publisherId: idSchema.describe("The UUID of an existing publisher."),
    isbn: isbnSchema,
    genre: genreSchema,
    publishedYear: publishedYearSchema.optional(),
  }),
);

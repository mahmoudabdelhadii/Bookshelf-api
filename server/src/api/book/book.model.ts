import { z } from "zod";
import { idSchema } from "../../types.js";

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
  author: authorSchema,
  publishedYear: publishedYearSchema,
  isbn: isbnSchema.optional(),
  genre: genreSchema.optional(),
  createdAt: z.date().describe("Timestamp when the book was created."),
  language: languageSchema, // Add language here
});

export const getBookSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createBookSchema = z.object({
  title: titleSchema,
  author: authorSchema,
  isbn: isbnSchema.optional(),
  genre: genreSchema.optional(),
  publishedYear: publishedYearSchema.optional(),
  language: languageSchema, // Add language to create schema
});

export const updateBookSchema = z.object({
  title: titleSchema.optional(),
  author: authorSchema.optional(),
  isbn: isbnSchema.optional(),
  genre: genreSchema.optional(),
  publishedYear: publishedYearSchema.optional(),
  language: languageSchema.optional(), // Add language to update schema
});

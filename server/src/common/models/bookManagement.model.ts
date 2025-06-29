import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

export const bookConditionEnum = z.enum([
  "new",
  "excellent", 
  "good",
  "fair",
  "poor"
]).openapi({ description: "Physical condition of the book" });

export const createBookRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters").openapi({ description: "Book title" }),
  titleLong: z.string().max(500).optional().openapi({ description: "Extended book title" }),
  authorName: z.string().min(1, "Author name is required").max(100, "Author name cannot exceed 100 characters").openapi({ description: "Author name (will be linked to Author entity)" }),
  publisherName: z.string().min(1, "Publisher name is required").max(100, "Publisher name cannot exceed 100 characters").openapi({ description: "Publisher name (will be linked to Publisher entity)" }),
  subjectName: z.string().max(100).optional().openapi({ description: "Subject name (will be linked to Subject entity)" }),
  isbn: z.string().max(20).optional().openapi({ description: "ISBN of the book" }),
  isbn13: z.string().max(20).optional().openapi({ description: "ISBN-13 of the book" }),
  genre: z.string().max(50).optional().openapi({ description: "Book genre" }),
  language: z.enum(["en", "ar", "other"]).openapi({ description: "Book language" }),
  publishedYear: z.number().int().min(0).max(new Date().getFullYear()).optional().openapi({ description: "Year the book was published" }),
  pages: z.number().int().min(1).optional().openapi({ description: "Number of pages" }),
  edition: z.string().max(50).optional().openapi({ description: "Book edition" }),
  binding: z.string().max(50).optional().openapi({ description: "Book binding type" }),
  description: z.string().max(2000).optional().openapi({ description: "Book description/overview" }),
  image: z.string().url().optional().openapi({ description: "URL to book cover image" }),
  deweyDecimal: z.string().max(20).optional().openapi({ description: "Dewey Decimal classification" }),
}).openapi({ description: "Comprehensive book creation request" });

export const addBookToLibraryRequestSchema = z.object({
  bookId: idSchema.openapi({ description: "ID of the book to add to library" }),
  libraryId: idSchema.openapi({ description: "ID of the library" }),
  quantity: z.number().int().min(1).max(1000).default(1).openapi({ description: "Number of copies to add" }),
  shelfLocation: z.string().max(100).optional().openapi({ description: "Shelf location in the library" }),
  condition: bookConditionEnum.default("good"),
  notes: z.string().max(500).optional().openapi({ description: "Additional notes about the book copies" }),
}).openapi({ description: "Request to add book copies to a library" });

export const removeBookFromLibraryRequestSchema = z.object({
  libraryBookId: idSchema.openapi({ description: "ID of the library book entry to remove" }),
  reason: z.string().max(200).optional().openapi({ description: "Reason for removal" }),
}).openapi({ description: "Request to remove a book from library" });

export const updateLibraryBookRequestSchema = z.object({
  shelfLocation: z.string().max(100).optional().openapi({ description: "Update shelf location" }),
  condition: bookConditionEnum.optional(),
  notes: z.string().max(500).optional().openapi({ description: "Update notes" }),
}).openapi({ description: "Request to update library book information" });

export const bulkAddBooksToLibraryRequestSchema = z.object({
  libraryId: idSchema.openapi({ description: "ID of the library" }),
  books: z.array(
    z.object({
      bookId: idSchema.openapi({ description: "ID of the book" }),
      quantity: z.number().int().min(1).max(100).default(1).openapi({ description: "Number of copies" }),
      shelfLocation: z.string().max(100).optional().openapi({ description: "Shelf location" }),
      condition: bookConditionEnum.default("good"),
      notes: z.string().max(500).optional().openapi({ description: "Notes" }),
    })
  ).min(1).max(100).openapi({ description: "List of books to add" }),
}).openapi({ description: "Bulk add multiple books to library" });

export const transferBookRequestSchema = z.object({
  libraryBookId: idSchema.openapi({ description: "ID of the library book to transfer" }),
  fromLibraryId: idSchema.openapi({ description: "Source library ID" }),
  toLibraryId: idSchema.openapi({ description: "Destination library ID" }),
  quantity: z.number().int().min(1).default(1).openapi({ description: "Number of copies to transfer" }),
  reason: z.string().max(200).optional().openapi({ description: "Reason for transfer" }),
}).openapi({ description: "Request to transfer book between libraries" });

export const bookImportRequestSchema = z.object({
  libraryId: idSchema.openapi({ description: "ID of the library to import books into" }),
  source: z.enum(["isbn", "csv", "json"]).openapi({ description: "Import source type" }),
  data: z.union([
    z.object({
      type: z.literal("isbn"),
      isbns: z.array(z.string()).min(1).max(100).openapi({ description: "List of ISBNs to import" }),
    }),
    z.object({
      type: z.literal("csv"),
      csvData: z.string().openapi({ description: "CSV data with book information" }),
    }),
    z.object({
      type: z.literal("json"),
      books: z.array(createBookRequestSchema).min(1).max(100).openapi({ description: "Array of book objects" }),
    })
  ]).openapi({ description: "Import data based on source type" }),
  defaultCondition: bookConditionEnum.default("good"),
  defaultShelfLocation: z.string().max(100).optional().openapi({ description: "Default shelf location for imported books" }),
}).openapi({ description: "Request to import books from various sources" });

export type CreateBookRequest = z.infer<typeof createBookRequestSchema>;
export type AddBookToLibraryRequest = z.infer<typeof addBookToLibraryRequestSchema>;
export type RemoveBookFromLibraryRequest = z.infer<typeof removeBookFromLibraryRequestSchema>;
export type UpdateLibraryBookRequest = z.infer<typeof updateLibraryBookRequestSchema>;
export type BulkAddBooksToLibraryRequest = z.infer<typeof bulkAddBooksToLibraryRequestSchema>;
export type TransferBookRequest = z.infer<typeof transferBookRequestSchema>;
export type BookImportRequest = z.infer<typeof bookImportRequestSchema>;
export type BookCondition = z.infer<typeof bookConditionEnum>;
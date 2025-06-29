import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const bookSearchRequestSchema = z.object({
  title: z.string().optional().openapi({ description: "Search by book title" }),
  author: z.string().optional().openapi({ description: "Search by author name" }),
  isbn: z.string().optional().openapi({ description: "Search by ISBN" }),
  genre: z.string().optional().openapi({ description: "Search by genre" }),
  language: z.enum(["en", "ar", "other"]).optional().openapi({ description: "Filter by language" }),
  publishedYear: z.number().int().optional().openapi({ description: "Filter by published year" }),
  publisherName: z.string().optional().openapi({ description: "Search by publisher name" }),
  subjectName: z.string().optional().openapi({ description: "Search by subject name" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "Book search parameters" });

export const librarySearchRequestSchema = z.object({
  name: z.string().optional().openapi({ description: "Search by library name" }),
  location: z.string().optional().openapi({ description: "Search by library location" }),
  city: z.string().optional().openapi({ description: "Search by library city" }),
  hasBook: z.string().optional().openapi({ description: "Search libraries that have a specific book (by title or ISBN)" }),
  ownerId: z.string().uuid().optional().openapi({ description: "Filter by library owner ID" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "Library search parameters" });

export const authorSearchRequestSchema = z.object({
  name: z.string().optional().openapi({ description: "Search by author name" }),
  nationality: z.string().optional().openapi({ description: "Filter by nationality" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "Author search parameters" });

export const publisherSearchRequestSchema = z.object({
  name: z.string().optional().openapi({ description: "Search by publisher name" }),
  foundedYear: z.number().int().optional().openapi({ description: "Filter by founded year" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "Publisher search parameters" });

export const borrowRequestSearchRequestSchema = z.object({
  userId: z.string().uuid().optional().openapi({ description: "Filter by user ID" }),
  libraryId: z.string().uuid().optional().openapi({ description: "Filter by library ID" }),
  status: z.enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"]).optional().openapi({ description: "Filter by status" }),
  startDate: z.date().optional().openapi({ description: "Filter requests from this date" }),
  endDate: z.date().optional().openapi({ description: "Filter requests until this date" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "Borrow request search parameters" });

export const generalSearchRequestSchema = z.object({
  query: z.string().min(1).openapi({ description: "General search query" }),
  type: z.enum(["books", "authors", "publishers", "libraries", "all"]).default("all").openapi({ description: "Type of entity to search" }),
  limit: z.number().int().min(1).max(100).default(20).openapi({ description: "Number of results to return (max 100)" }),
  offset: z.number().int().min(0).default(0).openapi({ description: "Number of results to skip" }),
}).openapi({ description: "General search parameters" });

export type BookSearchRequest = z.infer<typeof bookSearchRequestSchema>;
export type LibrarySearchRequest = z.infer<typeof librarySearchRequestSchema>;
export type AuthorSearchRequest = z.infer<typeof authorSearchRequestSchema>;
export type PublisherSearchRequest = z.infer<typeof publisherSearchRequestSchema>;
export type BorrowRequestSearchRequest = z.infer<typeof borrowRequestSearchRequestSchema>;
export type GeneralSearchRequest = z.infer<typeof generalSearchRequestSchema>;
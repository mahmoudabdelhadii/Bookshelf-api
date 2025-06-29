import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

// Author schema based on database schema
export const authorSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "Author name is required").max(100, "Author name cannot exceed 100 characters").openapi({ description: "Author's full name" }),
  biography: z.string().max(2000, "Biography cannot exceed 2000 characters").nullable().optional().openapi({ description: "Author biography" }),
  nationality: z.string().max(50, "Nationality cannot exceed 50 characters").nullable().optional().openapi({ description: "Author's nationality" }),
  birthDate: z.date().max(new Date(), "Birth date cannot be in the future").nullable().optional().openapi({ description: "Author's birth date" }),
  booksCount: z.number().int().min(0).default(0).openapi({ description: "Number of books by this author" }),
  createdAt: z.date().openapi({ description: "Timestamp when the author was created" }),
  updatedAt: z.date().openapi({ description: "Timestamp when the author was last updated" }),
}).openapi({ description: "Author entity information" });

export const createAuthorSchema = z.object({
  name: z.string().min(1, "Author name is required").max(100, "Author name cannot exceed 100 characters").openapi({ description: "Author's full name" }),
  biography: z.string().max(2000, "Biography cannot exceed 2000 characters").optional().openapi({ description: "Author biography" }),
  nationality: z.string().max(50, "Nationality cannot exceed 50 characters").optional().openapi({ description: "Author's nationality" }),
  birthDate: z.date().max(new Date(), "Birth date cannot be in the future").optional().openapi({ description: "Author's birth date" }),
}).openapi({ description: "Author creation data" });

export const updateAuthorSchema = createAuthorSchema.partial().openapi({ description: "Author update data" });

// API-specific schemas for requests
export const getAuthorSchema = z.object({
  params: z.object({ 
    id: idSchema.openapi({ description: "Author ID" }) 
  }),
}).openapi({ description: "Get author by ID parameters" });

export const searchAuthorSchema = z.object({
  params: z.object({ 
    name: z.string().min(1, "Author name is required").openapi({ description: "Author name to search for" })
  }),
}).openapi({ description: "Search author by name parameters" });

export const searchAuthorsSchema = z.object({
  params: z.object({ 
    query: z.string().min(1, "Search query is required").openapi({ description: "Search query for authors" })
  }),
}).openapi({ description: "Search authors parameters" });

// Response schemas
export const authorArraySchema = z.array(authorSchema).openapi({ description: "Array of authors" });

// Author with computed statistics (business logic layer)
export const authorWithStatsSchema = authorSchema.extend({
  averageRating: z.number().min(0).max(5).nullable().optional().openapi({ description: "Average rating of author's books" }),
  totalBorrows: z.number().int().min(0).optional().openapi({ description: "Total times author's books have been borrowed" }),
  popularBooks: z.array(z.object({
    id: idSchema,
    title: z.string(),
    borrowCount: z.number().int().min(0),
  })).optional().openapi({ description: "Author's most popular books" }),
}).openapi({ description: "Author with computed statistics" });

// TypeScript types derived from schemas
export type Author = z.infer<typeof authorSchema>;
export type CreateAuthor = z.infer<typeof createAuthorSchema>;
export type UpdateAuthor = z.infer<typeof updateAuthorSchema>;
export type AuthorWithStats = z.infer<typeof authorWithStatsSchema>;
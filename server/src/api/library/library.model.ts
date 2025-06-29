import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "../../common/utils/commonValidation.js";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

// Library schema based on database schema
export const librarySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100).openapi({ description: "Library name" }),
  description: z.string().max(500).nullable().optional().openapi({ description: "Library description" }),
  address: z.string().max(200).nullable().optional().openapi({ description: "Library address" }),
  city: z.string().max(100).nullable().optional().openapi({ description: "Library city" }),
  phone: z.string().max(20).nullable().optional().openapi({ description: "Library phone number" }),
  email: z.string().email().nullable().optional().openapi({ description: "Library email" }),
  website: z.string().url().nullable().optional().openapi({ description: "Library website" }),
  hours: z.string().max(200).nullable().optional().openapi({ description: "Library hours" }),
  image: z.string().nullable().optional().openapi({ description: "Library image URL" }),
  rating: z.number().min(0).max(5).nullable().optional().openapi({ description: "Library rating" }),
  ownerId: idSchema.openapi({ description: "ID of the library owner" }),
  location: z.string().max(200).nullable().optional().openapi({ description: "Library location" }),
  createdAt: z.date().openapi({ description: "Timestamp when the library was created" }),
  updatedAt: z.date().openapi({ description: "Timestamp when the library was last updated" }),
}).openapi({ description: "Library entity information" });

export const createLibrarySchema = z.object({
  name: z.string().min(1).max(100).openapi({ description: "Library name" }),
  description: z.string().max(500).optional().openapi({ description: "Library description" }),
  address: z.string().max(200).optional().openapi({ description: "Library address" }),
  city: z.string().max(100).optional().openapi({ description: "Library city" }),
  phone: z.string().max(20).optional().openapi({ description: "Library phone number" }),
  email: z.string().email().optional().openapi({ description: "Library email" }),
  website: z.string().url().optional().openapi({ description: "Library website" }),
  hours: z.string().max(200).optional().openapi({ description: "Library hours" }),
  image: z.string().optional().openapi({ description: "Library image URL" }),
  location: z.string().max(200).optional().openapi({ description: "Library location" }),
}).openapi({ description: "Library creation data" });

export const updateLibrarySchema = createLibrarySchema.partial().openapi({ description: "Library update data" });

export const getLibrarySchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const libraryArraySchema = z.array(librarySchema);

// Library with owner details (business logic layer)
export const libraryWithOwnerSchema = librarySchema.extend({
  owner: z.object({
    id: idSchema,
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).openapi({ description: "Library owner information" }),
}).openapi({ description: "Library with owner details" });

// Library with computed statistics (business logic layer)
export const libraryWithStatsSchema = libraryWithOwnerSchema.extend({
  totalBooks: z.number().int().min(0).openapi({ description: "Total number of books in library" }),
  availableBooks: z.number().int().min(0).openapi({ description: "Number of available books" }),
  borrowedBooks: z.number().int().min(0).openapi({ description: "Number of borrowed books" }),
  memberCount: z.number().int().min(0).openapi({ description: "Number of library members" }),
  pendingRequests: z.number().int().min(0).openapi({ description: "Number of pending borrow requests" }),
  popularBooks: z.array(z.object({
    id: idSchema,
    title: z.string(),
    borrowCount: z.number().int().min(0),
  })).optional().openapi({ description: "Most popular books in the library" }),
  recentActivity: z.array(z.object({
    type: z.enum(["borrow", "return", "request"]),
    bookTitle: z.string(),
    userName: z.string(),
    timestamp: z.date(),
  })).optional().openapi({ description: "Recent library activity" }),
}).openapi({ description: "Library with comprehensive statistics" });

// Enhanced library response for detailed views
export const libraryDetailedSchema = libraryWithStatsSchema.extend({
  members: z.array(z.object({
    id: idSchema,
    userId: idSchema,
    role: z.enum(["owner", "manager", "staff", "member"]),
    userName: z.string(),
    joinDate: z.date(),
  })).optional().openapi({ description: "Library members" }),
  topGenres: z.array(z.object({
    genre: z.string(),
    count: z.number().int().min(0),
  })).optional().openapi({ description: "Most common genres in library" }),
}).openapi({ description: "Detailed library information" });

// TypeScript types derived from schemas
export type Library = z.infer<typeof librarySchema>;
export type CreateLibrary = z.infer<typeof createLibrarySchema>;
export type UpdateLibrary = z.infer<typeof updateLibrarySchema>;
export type LibraryWithOwner = z.infer<typeof libraryWithOwnerSchema>;
export type LibraryWithStats = z.infer<typeof libraryWithStatsSchema>;
export type LibraryDetailed = z.infer<typeof libraryDetailedSchema>;

export const errorMessageSchema = z.object({
  message: z.string(),
});

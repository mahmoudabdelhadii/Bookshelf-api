import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);


export const publisherSchema = z
  .object({
    id: idSchema,
    name: z
      .string()
      .min(1, "Publisher name is required")
      .max(100, "Publisher name cannot exceed 100 characters")
      .openapi({ description: "Publisher name" }),
    address: z
      .string()
      .max(200, "Address cannot exceed 200 characters")
      .nullable()
      .optional()
      .openapi({ description: "Publisher address" }),
    website: z
      .string()
      .url("Invalid website URL")
      .nullable()
      .optional()
      .openapi({ description: "Publisher website" }),
    foundedYear: z
      .number()
      .int()
      .min(1000)
      .max(new Date().getFullYear())
      .nullable()
      .optional()
      .openapi({ description: "Year the publisher was founded" }),
    booksCount: z
      .number()
      .int()
      .min(0)
      .default(0)
      .nullable()
      .optional()
      .openapi({ description: "Number of books by this publisher" }),
    createdAt: z.date().openapi({ description: "Timestamp when the publisher was created" }),
    updatedAt: z.date().openapi({ description: "Timestamp when the publisher was last updated" }),
  })
  .openapi({ description: "Publisher entity information" });

export const createPublisherSchema = z
  .object({
    name: z
      .string()
      .min(1, "Publisher name is required")
      .max(100, "Publisher name cannot exceed 100 characters")
      .openapi({ description: "Publisher name" }),
    address: z
      .string()
      .max(200, "Address cannot exceed 200 characters")
      .optional()
      .openapi({ description: "Publisher address" }),
    website: z.string().url("Invalid website URL").optional().openapi({ description: "Publisher website" }),
    foundedYear: z
      .number()
      .int()
      .min(1000)
      .max(new Date().getFullYear())
      .optional()
      .openapi({ description: "Year the publisher was founded" }),
  })
  .openapi({ description: "Publisher creation data" });

export const updatePublisherSchema = createPublisherSchema
  .partial()
  .openapi({ description: "Publisher update data" });


export const getPublisherSchema = z
  .object({
    params: z.object({
      id: idSchema.openapi({ description: "Publisher ID" }),
    }),
  })
  .openapi({ description: "Get publisher by ID parameters" });

export const searchPublisherSchema = z
  .object({
    params: z.object({
      name: z
        .string()
        .min(1, "Publisher name is required")
        .openapi({ description: "Publisher name to search for" }),
    }),
  })
  .openapi({ description: "Search publisher by name parameters" });

export const searchPublishersSchema = z
  .object({
    params: z.object({
      query: z
        .string()
        .min(1, "Search query is required")
        .openapi({ description: "Search query for publishers" }),
    }),
  })
  .openapi({ description: "Search publishers parameters" });


export const publisherArraySchema = z.array(publisherSchema).openapi({ description: "Array of publishers" });


export const publisherWithStatsSchema = publisherSchema
  .extend({
    averageRating: z
      .number()
      .min(0)
      .max(5)
      .nullable()
      .optional()
      .openapi({ description: "Average rating of publisher's books" }),
    totalBorrows: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "Total times publisher's books have been borrowed" }),
    popularBooks: z
      .array(
        z.object({
          id: idSchema,
          title: z.string(),
          borrowCount: z.number().int().min(0),
        }),
      )
      .optional()
      .openapi({ description: "Publisher's most popular books" }),
    recentBooks: z
      .array(
        z.object({
          id: idSchema,
          title: z.string(),
          publishedYear: z.number().int().optional(),
        }),
      )
      .optional()
      .openapi({ description: "Publisher's most recent books" }),
  })
  .openapi({ description: "Publisher with computed statistics" });


export type Publisher = z.infer<typeof publisherSchema>;
export type CreatePublisher = z.infer<typeof createPublisherSchema>;
export type UpdatePublisher = z.infer<typeof updatePublisherSchema>;
export type PublisherWithStats = z.infer<typeof publisherWithStatsSchema>;

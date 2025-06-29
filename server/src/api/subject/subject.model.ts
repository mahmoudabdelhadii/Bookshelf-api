import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);

// Subject schema based on database schema
export const subjectSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "Subject name is required").max(100, "Subject name cannot exceed 100 characters").openapi({ description: "Subject name" }),
  description: z.string().max(500, "Description cannot exceed 500 characters").nullable().optional().openapi({ description: "Subject description" }),
  parent: idSchema.nullable().optional().openapi({ description: "Parent subject ID for hierarchical structure" }),
  booksCount: z.number().int().min(0).default(0).nullable().optional().openapi({ description: "Number of books in this subject" }),
  createdAt: z.date().openapi({ description: "Timestamp when the subject was created" }),
  updatedAt: z.date().openapi({ description: "Timestamp when the subject was last updated" }),
}).openapi({ description: "Subject/Category entity information" });

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100, "Subject name cannot exceed 100 characters").openapi({ description: "Subject name" }),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().openapi({ description: "Subject description" }),
  parent: idSchema.optional().openapi({ description: "Parent subject ID for hierarchical structure" }),
}).openapi({ description: "Subject creation data" });

export const updateSubjectSchema = createSubjectSchema.partial().openapi({ description: "Subject update data" });

// API-specific schemas for requests
export const getSubjectSchema = z.object({
  params: z.object({ 
    id: idSchema.openapi({ description: "Subject ID" }) 
  }),
}).openapi({ description: "Get subject by ID parameters" });

// Response schemas
export const subjectArraySchema = z.array(subjectSchema).openapi({ description: "Array of subjects" });

// Subject with hierarchical structure (business logic layer)
// Note: Simplified to avoid z.lazy() which causes OpenAPI generation issues
export const subjectWithChildrenSchema = subjectSchema.extend({
  children: z.array(subjectSchema).optional().openapi({ description: "Child subjects (limited to one level for OpenAPI)" }),
  totalBooksIncludingChildren: z.number().int().min(0).optional().openapi({ description: "Total books including all child subjects" }),
  depth: z.number().int().min(0).optional().openapi({ description: "Depth level in hierarchy" }),
  path: z.array(z.string()).optional().openapi({ description: "Path from root to this subject" }),
}).openapi({ description: "Subject with nested children" });

// Subject with computed statistics (business logic layer)
export const subjectWithStatsSchema = subjectSchema.extend({
  totalBooksIncludingChildren: z.number().int().min(0).optional().openapi({ description: "Total books including all child subjects" }),
  popularBooks: z.array(z.object({
    id: idSchema,
    title: z.string(),
    borrowCount: z.number().int().min(0),
  })).optional().openapi({ description: "Most popular books in this subject" }),
  parentSubject: subjectSchema.nullable().optional().openapi({ description: "Parent subject information" }),
  childrenCount: z.number().int().min(0).optional().openapi({ description: "Number of child subjects" }),
}).openapi({ description: "Subject with computed statistics" });

// TypeScript types derived from schemas
export type Subject = z.infer<typeof subjectSchema>;
export type CreateSubject = z.infer<typeof createSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;
export type SubjectWithChildren = z.infer<typeof subjectWithChildrenSchema>;
export type SubjectWithStats = z.infer<typeof subjectWithStatsSchema>;
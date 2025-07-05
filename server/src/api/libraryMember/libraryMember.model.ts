import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);


export const libraryMemberSchema = z
  .object({
    id: idSchema,
    userId: idSchema.openapi({ description: "ID of the user" }),
    libraryId: idSchema.openapi({ description: "ID of the library" }),
    role: z
      .enum(["owner", "manager", "staff", "member"])
      .default("member")
      .openapi({ description: "Role of the member in the library" }),
    permissions: z
      .array(z.string())
      .nullable()
      .optional()
      .openapi({ description: "Array of permission strings" }),
    joinDate: z.date().openapi({ description: "Date when the user joined the library" }),
    isActive: z.boolean().default(true).openapi({ description: "Whether the membership is active" }),
    invitedBy: idSchema
      .nullable()
      .optional()
      .openapi({ description: "ID of the user who invited this member" }),
    createdAt: z.date().openapi({ description: "Timestamp when the membership was created" }),
    updatedAt: z.date().openapi({ description: "Timestamp when the membership was last updated" }),
  })
  .openapi({ description: "Library member entity information" });

export const createLibraryMemberSchema = z
  .object({
    userId: idSchema.openapi({ description: "ID of the user" }),
    libraryId: idSchema.openapi({ description: "ID of the library" }),
    role: z
      .enum(["owner", "manager", "staff", "member"])
      .default("member")
      .openapi({ description: "Role of the member in the library" }),
    permissions: z.array(z.string()).optional().openapi({ description: "Array of permission strings" }),
    invitedBy: idSchema.optional().openapi({ description: "ID of the user who invited this member" }),
  })
  .openapi({ description: "Library member creation data" });

export const updateLibraryMemberSchema = z
  .object({
    role: z.enum(["owner", "manager", "staff", "member"]).optional(),
    permissions: z.array(z.string()).optional().openapi({ description: "Array of permission strings" }),
    isActive: z.boolean().optional().openapi({ description: "Whether the membership is active" }),
  })
  .openapi({ description: "Library member update data" });


export const getLibraryMemberSchema = z
  .object({
    params: z.object({
      id: idSchema.openapi({ description: "Library member ID" }),
    }),
  })
  .openapi({ description: "Get library member by ID parameters" });

export const getLibraryMembersSchema = z
  .object({
    params: z.object({
      libraryId: idSchema.openapi({ description: "Library ID" }),
    }),
  })
  .openapi({ description: "Get library members by library ID parameters" });


export const libraryMemberArraySchema = z
  .array(libraryMemberSchema)
  .openapi({ description: "Array of library members" });


export const libraryMemberWithDetailsSchema = libraryMemberSchema
  .extend({
    user: z
      .object({
        id: idSchema,
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
      .openapi({ description: "User details" }),
    library: z
      .object({
        id: idSchema,
        name: z.string(),
        location: z.string().nullable().optional(),
      })
      .openapi({ description: "Library details" }),
    inviter: z
      .object({
        id: idSchema,
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .nullable()
      .optional()
      .openapi({ description: "User who invited this member" }),
  })
  .openapi({ description: "Library member with detailed information" });


export const libraryMemberWithStatsSchema = libraryMemberWithDetailsSchema
  .extend({
    borrowsCount: z.number().int().min(0).openapi({ description: "Number of books borrowed by this member" }),
    activeBorrows: z.number().int().min(0).openapi({ description: "Number of currently active borrows" }),
    overdueBorrows: z.number().int().min(0).openapi({ description: "Number of overdue borrows" }),
    averageBorrowDuration: z
      .number()
      .min(0)
      .optional()
      .openapi({ description: "Average borrow duration in days" }),
    lastActivity: z.date().nullable().optional().openapi({ description: "Last activity timestamp" }),
  })
  .openapi({ description: "Library member with activity statistics" });


export type LibraryMember = z.infer<typeof libraryMemberSchema>;
export type CreateLibraryMember = z.infer<typeof createLibraryMemberSchema>;
export type UpdateLibraryMember = z.infer<typeof updateLibraryMemberSchema>;
export type LibraryMemberWithDetails = z.infer<typeof libraryMemberWithDetailsSchema>;
export type LibraryMemberWithStats = z.infer<typeof libraryMemberWithStatsSchema>;
export type LibraryMemberRole = z.infer<typeof libraryMemberSchema>["role"];

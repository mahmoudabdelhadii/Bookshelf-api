import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);


export const borrowRequestSchema = z
  .object({
    id: idSchema,
    userId: idSchema.openapi({ description: "ID of the user making the request" }),
    libraryBookId: idSchema.openapi({ description: "ID of the library book being requested" }),
    requestDate: z.date().openapi({ description: "Date when the request was made" }),
    dueDate: z.date().openapi({ description: "Due date for returning the book" }),
    returnDate: z.date().nullable().optional().openapi({ description: "Actual return date" }),
    approvedBy: idSchema
      .nullable()
      .optional()
      .openapi({ description: "ID of the user who approved the request" }),
    rejectedBy: idSchema
      .nullable()
      .optional()
      .openapi({ description: "ID of the user who rejected the request" }),
    returnedBy: idSchema
      .nullable()
      .optional()
      .openapi({ description: "ID of the user who processed the return" }),
    status: z
      .enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"])
      .default("pending")
      .openapi({ description: "Status of the borrow request" }),
    notes: z.string().nullable().optional().openapi({ description: "Additional notes" }),
    createdAt: z.date().openapi({ description: "Timestamp when the request was created" }),
    updatedAt: z.date().openapi({ description: "Timestamp when the request was last updated" }),
  })
  .openapi({ description: "Borrow request entity information" });

export const createBorrowRequestSchema = z
  .object({
    libraryBookId: idSchema.openapi({ description: "ID of the library book being requested" }),
    notes: z.string().optional().openapi({ description: "Additional notes" }),
  })
  .openapi({ description: "Borrow request creation data" });

export const updateBorrowRequestSchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"]).optional(),
    dueDate: z.date().optional().openapi({ description: "Due date for returning the book" }),
    returnDate: z.date().optional().openapi({ description: "Actual return date" }),
    approvedBy: idSchema.optional().openapi({ description: "ID of the user approving the request" }),
    rejectedBy: idSchema.optional().openapi({ description: "ID of the user rejecting the request" }),
    returnedBy: idSchema.optional().openapi({ description: "ID of the user processing the return" }),
    notes: z.string().optional().openapi({ description: "Additional notes" }),
  })
  .openapi({ description: "Borrow request update data" });


export const getBorrowRequestSchema = z
  .object({
    params: z.object({
      id: idSchema.openapi({ description: "Borrow request ID" }),
    }),
  })
  .openapi({ description: "Get borrow request by ID parameters" });


export const borrowRequestArraySchema = z
  .array(borrowRequestSchema)
  .openapi({ description: "Array of borrow requests" });


export const borrowRequestWithDetailsSchema = borrowRequestSchema
  .extend({
    user: z
      .object({
        id: idSchema,
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
      .openapi({ description: "User who made the request" }),
    libraryBook: z
      .object({
        id: idSchema,
        shelfLocation: z.string().nullable().optional(),
        condition: z.string().nullable().optional(),
        book: z
          .object({
            id: idSchema,
            title: z.string(),
            author: z.object({
              id: idSchema,
              name: z.string(),
            }),
            isbn: z.string().nullable().optional(),
          })
          .openapi({ description: "Book details" }),
        library: z
          .object({
            id: idSchema,
            name: z.string(),
            location: z.string().nullable().optional(),
          })
          .openapi({ description: "Library details" }),
      })
      .openapi({ description: "Library book details" }),
    approver: z
      .object({
        id: idSchema,
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .nullable()
      .optional()
      .openapi({ description: "User who approved the request" }),
  })
  .openapi({ description: "Borrow request with detailed information" });
export const borrowRequestWithDetailsArraySchema = z
  .array(borrowRequestWithDetailsSchema)
  .openapi({ description: "Array of borrow requests with details" });


export type BorrowRequest = z.infer<typeof borrowRequestSchema>;
export type CreateBorrowRequest = z.infer<typeof createBorrowRequestSchema>;
export type UpdateBorrowRequest = z.infer<typeof updateBorrowRequestSchema>;
export type BorrowRequestWithDetails = z.infer<typeof borrowRequestWithDetailsSchema>;
export type BorrowRequestStatus = z.infer<typeof borrowRequestSchema>["status"];

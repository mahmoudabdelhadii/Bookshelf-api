import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.boolean().openapi({ description: "Whether the request was successful" }),
      message: z.string().openapi({ description: "Response message" }),
      responseObject: dataSchema.optional().openapi({ description: "Response data" }),
      statusCode: z.number().int().min(100).max(599).openapi({ description: "HTTP status code" }),
    })
    .openapi({ description: "Standard API response wrapper" });

export const errorResponseSchema = z
  .object({
    success: z.literal(false).openapi({ description: "Always false for error responses" }),
    message: z.string().openapi({ description: "Error message" }),
    statusCode: z.number().int().min(400).max(599).openapi({ description: "HTTP error status code" }),
    error: z.string().optional().openapi({ description: "Error type" }),
    details: z.array(z.string()).optional().openapi({ description: "Detailed error information" }),
  })
  .openapi({ description: "Error response format" });

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.literal(true).openapi({ description: "Always true for success responses" }),
      message: z.string().openapi({ description: "Success message" }),
      responseObject: dataSchema.openapi({ description: "Response data" }),
      statusCode: z.number().int().min(200).max(299).openapi({ description: "HTTP success status code" }),
    })
    .openapi({ description: "Success response format" });

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.literal(true).openapi({ description: "Always true for success responses" }),
      message: z.string().openapi({ description: "Success message" }),
      responseObject: z
        .object({
          data: z.array(dataSchema).openapi({ description: "Array of items" }),
          pagination: z
            .object({
              page: z.number().int().min(1).openapi({ description: "Current page number" }),
              limit: z.number().int().min(1).openapi({ description: "Items per page" }),
              total: z.number().int().min(0).openapi({ description: "Total number of items" }),
              totalPages: z.number().int().min(0).openapi({ description: "Total number of pages" }),
              hasNextPage: z.boolean().openapi({ description: "Whether there are more pages" }),
              hasPrevPage: z.boolean().openapi({ description: "Whether there are previous pages" }),
            })
            .openapi({ description: "Pagination information" }),
        })
        .openapi({ description: "Paginated response data" }),
      statusCode: z.number().int().min(200).max(299).openapi({ description: "HTTP success status code" }),
    })
    .openapi({ description: "Paginated response format" });

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  responseObject?: T;
  statusCode: number;
};

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse<T> = {
  success: true;
  message: string;
  responseObject: T;
  statusCode: number;
};

export type PaginatedResponse<T> = {
  success: true;
  message: string;
  responseObject: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  statusCode: number;
};

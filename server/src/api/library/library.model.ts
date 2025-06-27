import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "../../common/utils/commonValidation.js";

extendZodWithOpenApi(z);

export type Library = z.infer<typeof librarySchema>;
export type CreateLibrary = z.infer<typeof createLibrarySchema>;
export type UpdateLibrary = z.infer<typeof updateLibrarySchema>;

export const librarySchema = z.object({
  id: z.string().uuid().openapi({ description: "The unique identifier of the library" }),
  name: z.string().min(1).max(100).openapi({ description: "The name of the library" }),
  location: z.string().max(200).nullable().optional().openapi({ description: "The location of the library" }),
  createdAt: z.date().openapi({ description: "Timestamp when the library was created" }),
});

export const createLibrarySchema = z.object({
  name: z.string().min(1).max(100).openapi({ description: "The name of the library" }),
  location: z.string().max(200).optional().openapi({ description: "The location of the library" }),
});

export const updateLibrarySchema = createLibrarySchema.partial();

export const getLibrarySchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
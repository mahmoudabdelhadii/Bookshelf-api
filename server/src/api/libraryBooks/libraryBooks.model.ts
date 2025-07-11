import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "../../common/utils/commonValidation.js";
import { idSchema } from "../../types.js";

extendZodWithOpenApi(z);


export const libraryBookSchema = z
  .object({
    id: idSchema,
    libraryId: idSchema.openapi({ description: "ID of the library" }),
    bookId: idSchema.openapi({ description: "ID of the book" }),
    quantity: z.number().int().min(1).default(1).openapi({ description: "Number of copies" }),
    shelfLocation: z
      .string()
      .max(100)
      .nullable()
      .optional()
      .openapi({ description: "Location of the book on shelf" }),
    condition: z.string().max(50).nullable().optional().openapi({ description: "Condition of the book" }),
    addedAt: z.date().openapi({ description: "Timestamp when the book was added to library" }),
    updatedAt: z.date().openapi({ description: "Timestamp when the book entry was last updated" }),
  })
  .openapi({ description: "Library book entry information" });

export const libraryBookWithDetailsSchema = libraryBookSchema.extend({
  book: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      author: z.string(),
      isbn: z.string().optional(),
      genre: z.string().optional(),
      publishedYear: z.number().optional(),
      language: z.enum(["en", "ar", "other"]),
    })
    .openapi({ description: "Book details" }),
  library: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      location: z.string().optional(),
    })
    .openapi({ description: "Library details" }),
});

export const createLibraryBookSchema = z
  .object({
    libraryId: idSchema.openapi({ description: "ID of the library" }),
    bookId: idSchema.openapi({ description: "ID of the book" }),
    quantity: z.number().int().min(1).default(1).optional().openapi({ description: "Number of copies" }),
    shelfLocation: z.string().max(100).optional().openapi({ description: "Location of the book on shelf" }),
    condition: z.string().max(50).optional().openapi({ description: "Condition of the book" }),
  })
  .openapi({ description: "Library book creation data" });

export const updateLibraryBookSchema = z.object({
  quantity: z.number().int().min(1).optional().openapi({ description: "Number of copies" }),
  shelfLocation: z.string().max(100).optional().openapi({ description: "The shelf location of the book" }),
  condition: z.string().max(50).optional().openapi({ description: "The condition of the book" }),
});

export const getLibraryBookSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const getLibraryBooksSchema = z.object({
  params: z.object({ libraryId: commonValidations.id }),
});

export const libraryBookWithDetailsArraySchema = z.array(libraryBookWithDetailsSchema);

export const errorMessageSchema = z.object({
  message: z.string(),
});


export type LibraryBook = z.infer<typeof libraryBookSchema>;
export type CreateLibraryBook = z.infer<typeof createLibraryBookSchema>;
export type UpdateLibraryBook = z.infer<typeof updateLibraryBookSchema>;

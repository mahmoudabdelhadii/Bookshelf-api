import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { libraryBooksController } from "./libraryBooks.controller.js";
import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { 
  libraryBookSchema, 
  libraryBookWithDetailsSchema,
  getLibraryBookSchema, 
  getLibraryBooksSchema,
  createLibraryBookSchema, 
  updateLibraryBookSchema 
} from "./libraryBooks.model.js";

export const libraryBooksRouter = Router();
export const libraryBooksRegistry = new OpenAPIRegistry();

libraryBooksRegistry.register("LibraryBook", libraryBookSchema.openapi("LibraryBook"));
libraryBooksRegistry.register("LibraryBookWithDetails", libraryBookWithDetailsSchema.openapi("LibraryBookWithDetails"));

// Get all library books (with pagination support)
libraryBooksRegistry.registerPath({
  method: "get",
  path: "/library-books",
  tags: ["Library Books"],
  responses: createApiResponse(z.array(libraryBookWithDetailsSchema), "All library books retrieved successfully"),
});
libraryBooksRouter.get("/", libraryBooksController.getAllLibraryBooks);

// Get books in a specific library
libraryBooksRegistry.registerPath({
  method: "get",
  path: "/libraries/{libraryId}/books",
  tags: ["Library Books"],
  request: {
    params: getLibraryBooksSchema.shape.params,
  },
  responses: createApiResponse(z.array(libraryBookWithDetailsSchema), "Library books retrieved successfully"),
});
libraryBooksRouter.get("/libraries/:libraryId/books", libraryBooksController.getLibraryBooks);

// Get specific library book entry
libraryBooksRegistry.registerPath({
  method: "get",
  path: "/library-books/{id}",
  tags: ["Library Books"],
  request: {
    params: getLibraryBookSchema.shape.params,
  },
  responses: createApiResponse(libraryBookWithDetailsSchema, "Library book retrieved successfully"),
});
libraryBooksRouter.get("/:id", libraryBooksController.getLibraryBook);

// Add book to library
libraryBooksRegistry.registerPath({
  method: "post",
  path: "/library-books",
  tags: ["Library Books"],
  request: {
    body: {
      description: "Add a book to a library",
      required: true,
      content: {
        "application/json": {
          schema: createLibraryBookSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(libraryBookSchema, "Book added to library successfully", 201),
    409: {
      description: "Book already exists in this library",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
libraryBooksRouter.post("/", libraryBooksController.addBookToLibrary);

// Update library book details
libraryBooksRegistry.registerPath({
  method: "patch",
  path: "/library-books/{id}",
  tags: ["Library Books"],
  request: {
    params: getLibraryBookSchema.shape.params,
    body: {
      description: "Update library book details",
      required: true,
      content: {
        "application/json": {
          schema: updateLibraryBookSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(libraryBookSchema, "Library book updated successfully"),
  },
});
libraryBooksRouter.patch("/:id", libraryBooksController.updateLibraryBook);

// Remove book from library
libraryBooksRegistry.registerPath({
  method: "delete",
  path: "/library-books/{id}",
  tags: ["Library Books"],
  request: { params: getLibraryBookSchema.shape.params },
  responses: {
    204: {
      description: "Book removed from library successfully",
    },
    404: {
      description: "Library book entry not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
libraryBooksRouter.delete("/:id", libraryBooksController.removeBookFromLibrary);
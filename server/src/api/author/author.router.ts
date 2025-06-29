import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { authorController } from "./author.controller.js";
import {
  authorSchema,
  createAuthorSchema,
  updateAuthorSchema,
  getAuthorSchema,
  searchAuthorSchema,
  searchAuthorsSchema,
  authorArraySchema,
} from "./author.model.js";

export const authorRegistry = new OpenAPIRegistry();
export const authorRouter: Router = express.Router();

// Register schemas
authorRegistry.register("Author", authorSchema);
authorRegistry.register("CreateAuthor", createAuthorSchema);
authorRegistry.register("UpdateAuthor", updateAuthorSchema);

// GET /authors - Get all authors
authorRegistry.registerPath({
  method: "get",
  path: "/authors",
  tags: ["Author"],
  responses: createApiResponse(authorArraySchema, "Authors retrieved successfully"),
});
authorRouter.get("/", authorController.getAuthors);

// POST /authors - Create author
authorRegistry.registerPath({
  method: "post",
  path: "/authors",
  tags: ["Author"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createAuthorSchema,
        },
      },
    },
  },
  responses: createApiResponse(authorSchema, "Author created successfully"),
});
authorRouter.post("/", authorController.createAuthor);

// GET /authors/:id - Get author by ID
authorRegistry.registerPath({
  method: "get",
  path: "/authors/{id}",
  tags: ["Author"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Author ID" }),
    }),
  },
  responses: createApiResponse(authorSchema, "Author retrieved successfully"),
});
authorRouter.get("/:id", authorController.getAuthor);

// PATCH /authors/:id - Update author
authorRegistry.registerPath({
  method: "patch",
  path: "/authors/{id}",
  tags: ["Author"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Author ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateAuthorSchema,
        },
      },
    },
  },
  responses: createApiResponse(authorSchema, "Author updated successfully"),
});
authorRouter.patch("/:id", authorController.updateAuthor);

// DELETE /authors/:id - Delete author
authorRegistry.registerPath({
  method: "delete",
  path: "/authors/{id}",
  tags: ["Author"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Author ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Author deleted successfully"),
});
authorRouter.delete("/:id", authorController.deleteAuthor);

// GET /author/:name - Get author by name (legacy endpoint)
authorRegistry.registerPath({
  method: "get",
  path: "/author/{name}",
  tags: ["Author"],
  request: {
    params: z.object({
      name: z.string().openapi({ description: "Author name" }),
    }),
  },
  responses: createApiResponse(authorSchema, "Author retrieved successfully"),
});
authorRouter.get("/by-name/:name", authorController.getAuthorByName);

// GET /authors/search/:query - Search authors
authorRegistry.registerPath({
  method: "get",
  path: "/authors/search/{query}",
  tags: ["Author"],
  request: {
    params: z.object({
      query: z.string().openapi({ description: "Search query" }),
    }),
    query: z.object({
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(authorArraySchema, "Authors search completed"),
});
authorRouter.get("/search/:query", authorController.searchAuthors);
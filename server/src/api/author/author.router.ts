import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { authorController } from "./author.controller.js";
import { authorSchema, createAuthorSchema, updateAuthorSchema, authorArraySchema } from "./author.model.js";

export const authorRegistry = new OpenAPIRegistry();
export const authorRouter: Router = Router();


authorRegistry.register("Author", authorSchema);
authorRegistry.register("CreateAuthor", createAuthorSchema);
authorRegistry.register("UpdateAuthor", updateAuthorSchema);


authorRegistry.registerPath({
  method: "get",
  path: "/authors",
  tags: ["Author"],
  responses: createApiResponse(authorArraySchema, "Authors retrieved successfully"),
});
authorRouter.get("/", authorController.getAuthors);


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


authorRegistry.registerPath({
  method: "get",
  path: "/authors/by-name/{name}",
  tags: ["Author"],
  request: {
    params: z.object({
      name: z.string().openapi({ description: "Author name" }),
    }),
  },
  responses: createApiResponse(authorSchema, "Author retrieved successfully"),
});
authorRouter.get("/by-name/:name", authorController.getAuthorByName);


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

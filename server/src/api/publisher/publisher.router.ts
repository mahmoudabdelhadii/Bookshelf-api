import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { publisherController } from "./publisher.controller.js";
import {
  publisherSchema,
  createPublisherSchema,
  updatePublisherSchema,
  publisherArraySchema,
} from "./publisher.model.js";

export const publisherRegistry = new OpenAPIRegistry();
export const publisherRouter: Router = express.Router();

// Register schemas
publisherRegistry.register("Publisher", publisherSchema);
publisherRegistry.register("CreatePublisher", createPublisherSchema);
publisherRegistry.register("UpdatePublisher", updatePublisherSchema);

// GET /publishers - Get all publishers
publisherRegistry.registerPath({
  method: "get",
  path: "/publishers",
  tags: ["Publisher"],
  responses: createApiResponse(publisherArraySchema, "Publishers retrieved successfully"),
});
publisherRouter.get("/", publisherController.getPublishers);

// POST /publishers - Create publisher
publisherRegistry.registerPath({
  method: "post",
  path: "/publishers",
  tags: ["Publisher"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPublisherSchema,
        },
      },
    },
  },
  responses: createApiResponse(publisherSchema, "Publisher created successfully"),
});
publisherRouter.post("/", publisherController.createPublisher);

// GET /publishers/:id - Get publisher by ID
publisherRegistry.registerPath({
  method: "get",
  path: "/publishers/{id}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Publisher ID" }),
    }),
  },
  responses: createApiResponse(publisherSchema, "Publisher retrieved successfully"),
});
publisherRouter.get("/:id", publisherController.getPublisher);

// PATCH /publishers/:id - Update publisher
publisherRegistry.registerPath({
  method: "patch",
  path: "/publishers/{id}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Publisher ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updatePublisherSchema,
        },
      },
    },
  },
  responses: createApiResponse(publisherSchema, "Publisher updated successfully"),
});
publisherRouter.patch("/:id", publisherController.updatePublisher);

// DELETE /publishers/:id - Delete publisher
publisherRegistry.registerPath({
  method: "delete",
  path: "/publishers/{id}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Publisher ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Publisher deleted successfully"),
});
publisherRouter.delete("/:id", publisherController.deletePublisher);

// GET /publisher/:name - Get publisher by name (legacy endpoint)
publisherRegistry.registerPath({
  method: "get",
  path: "/publisher/{name}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      name: z.string().openapi({ description: "Publisher name" }),
    }),
  },
  responses: createApiResponse(publisherSchema, "Publisher retrieved successfully"),
});
publisherRouter.get("/by-name/:name", publisherController.getPublisherByName);

// GET /publishers/search/:query - Search publishers
publisherRegistry.registerPath({
  method: "get",
  path: "/publishers/search/{query}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      query: z.string().openapi({ description: "Search query" }),
    }),
    query: z.object({
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(publisherArraySchema, "Publishers search completed"),
});
publisherRouter.get("/search/:query", publisherController.searchPublishers);

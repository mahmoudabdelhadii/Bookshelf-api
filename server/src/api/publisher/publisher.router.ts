import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
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
export const publisherRouter: Router = Router();


publisherRegistry.register("Publisher", publisherSchema);
publisherRegistry.register("CreatePublisher", createPublisherSchema);
publisherRegistry.register("UpdatePublisher", updatePublisherSchema);


publisherRegistry.registerPath({
  method: "get",
  path: "/publishers",
  tags: ["Publisher"],
  responses: createApiResponse(publisherArraySchema, "Publishers retrieved successfully"),
});
publisherRouter.get("/", publisherController.getPublishers);


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


publisherRegistry.registerPath({
  method: "get",
  path: "/publishers/by-name/{name}",
  tags: ["Publisher"],
  request: {
    params: z.object({
      name: z.string().openapi({ description: "Publisher name" }),
    }),
  },
  responses: createApiResponse(publisherSchema, "Publisher retrieved successfully"),
});
publisherRouter.get("/by-name/:name", publisherController.getPublisherByName);


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

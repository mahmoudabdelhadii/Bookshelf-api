import { Router } from "express";

import { libraryController } from "./library.controller.js";
import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import {
  librarySchema,
  getLibrarySchema,
  createLibrarySchema,
  updateLibrarySchema,
  libraryArraySchema,
  errorMessageSchema,
} from "./library.model.js";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
export const libraryRegistry = new OpenAPIRegistry();

export const libraryRouter = Router();

libraryRegistry.register("Library", librarySchema.openapi("Library"));

libraryRegistry.registerPath({
  method: "get",
  path: "/libraries",
  tags: ["Library"],
  responses: createApiResponse(libraryArraySchema, "Libraries retrieved successfully"),
});
libraryRouter.get("/", libraryController.getLibraries);

libraryRegistry.registerPath({
  method: "get",
  path: "/libraries/{id}",
  tags: ["Library"],
  request: {
    params: getLibrarySchema.shape.params,
  },
  responses: createApiResponse(librarySchema, "Library retrieved successfully"),
});
libraryRouter.get("/:id", libraryController.getLibrary);

libraryRegistry.registerPath({
  method: "post",
  path: "/libraries",
  tags: ["Library"],
  request: {
    body: {
      description: "Create a new library",
      required: true,
      content: {
        "application/json": {
          schema: createLibrarySchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(librarySchema, "Library created successfully", 201),
  },
});
libraryRouter.post("/", libraryController.createLibrary);

libraryRegistry.registerPath({
  method: "patch",
  path: "/libraries/{id}",
  tags: ["Library"],
  request: {
    params: getLibrarySchema.shape.params,
    body: {
      description: "Update library details",
      required: true,
      content: {
        "application/json": {
          schema: updateLibrarySchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(librarySchema, "Library updated successfully"),
  },
});
libraryRouter.patch("/:id", libraryController.updateLibrary);

libraryRegistry.registerPath({
  method: "delete",
  path: "/libraries/{id}",
  tags: ["Library"],
  request: { params: getLibrarySchema.shape.params },
  responses: {
    204: {
      description: "Library deleted successfully",
    },
    404: {
      description: "Library not found",
      content: {
        "application/json": {
          schema: errorMessageSchema,
        },
      },
    },
  },
});

libraryRouter.delete("/:id", libraryController.deleteLibrary);

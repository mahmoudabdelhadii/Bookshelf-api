import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { subjectController } from "./subject.controller.js";
import {
  subjectSchema,
  createSubjectSchema,
  updateSubjectSchema,
  getSubjectSchema,
  subjectArraySchema,
  subjectWithChildrenSchema,
} from "./subject.model.js";

export const subjectRegistry = new OpenAPIRegistry();
export const subjectRouter: Router = express.Router();

// Register schemas
subjectRegistry.register("Subject", subjectSchema);
subjectRegistry.register("CreateSubject", createSubjectSchema);
subjectRegistry.register("UpdateSubject", updateSubjectSchema);
subjectRegistry.register("SubjectWithChildren", subjectWithChildrenSchema);

// GET /subjects - Get all subjects
subjectRegistry.registerPath({
  method: "get",
  path: "/subjects",
  tags: ["Subject"],
  responses: createApiResponse(subjectArraySchema, "Subjects retrieved successfully"),
});
subjectRouter.get("/", subjectController.getSubjects);

// GET /subjects/hierarchy - Get subject hierarchy
subjectRegistry.registerPath({
  method: "get",
  path: "/subjects/hierarchy",
  tags: ["Subject"],
  responses: createApiResponse(z.array(subjectWithChildrenSchema), "Subject hierarchy retrieved successfully"),
});
subjectRouter.get("/hierarchy", subjectController.getSubjectHierarchy);

// POST /subjects - Create subject
subjectRegistry.registerPath({
  method: "post",
  path: "/subjects",
  tags: ["Subject"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createSubjectSchema,
        },
      },
    },
  },
  responses: createApiResponse(subjectSchema, "Subject created successfully"),
});
subjectRouter.post("/", subjectController.createSubject);

// GET /subjects/:id - Get subject by ID
subjectRegistry.registerPath({
  method: "get",
  path: "/subjects/{id}",
  tags: ["Subject"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Subject ID" }),
    }),
  },
  responses: createApiResponse(subjectSchema, "Subject retrieved successfully"),
});
subjectRouter.get("/:id", subjectController.getSubject);

// PATCH /subjects/:id - Update subject
subjectRegistry.registerPath({
  method: "patch",
  path: "/subjects/{id}",
  tags: ["Subject"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Subject ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateSubjectSchema,
        },
      },
    },
  },
  responses: createApiResponse(subjectSchema, "Subject updated successfully"),
});
subjectRouter.patch("/:id", subjectController.updateSubject);

// DELETE /subjects/:id - Delete subject
subjectRegistry.registerPath({
  method: "delete",
  path: "/subjects/{id}",
  tags: ["Subject"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Subject ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Subject deleted successfully"),
});
subjectRouter.delete("/:id", subjectController.deleteSubject);
import { Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { GetUserSchema, userSchema, createUserSchema, updateUserSchema } from "./user.model.js";
import { userController } from "./user.controller.js";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
export const userRegistry = new OpenAPIRegistry();

export const userRouter = Router();

userRegistry.register("User", userSchema.openapi("User"));

userRegistry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  security: [{ bearerAuth: [] }], // Requires JWT authentication
  responses: {
    ...createApiResponse(z.array(userSchema), "Users retrieved successfully"),
    401: {
      description: "Unauthorized - Invalid or missing token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Unauthorized" },
              statusCode: { type: "number", example: 401 },
            },
          },
        },
      },
    },
  },
});
userRouter.get("/", userController.getUsers);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(userSchema, "User retrieved successfully"),
});
userRouter.get("/:id", userController.getUser);

userRegistry.registerPath({
  method: "post",
  path: "/users",
  tags: ["User"],
  request: {
    body: {
      description: "Create a new user",
      required: true,
      content: {
        "application/json": {
          schema: createUserSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(userSchema, "User created successfully", 201),
    409: {
      description: "User already exists",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
userRouter.post("/", userController.createUser);

userRegistry.registerPath({
  method: "patch",
  path: "/users/{id}",
  tags: ["User"],
  request: {
    params: GetUserSchema.shape.params,
    body: {
      description: "Update user details",
      required: true,
      content: {
        "application/json": {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(userSchema, "User updated successfully"),
  },
});
userRouter.patch("/:id", userController.updateUser);

userRegistry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: {
    204: {
      description: "User deleted successfully",
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
userRouter.delete("/:id", userController.deleteUser);

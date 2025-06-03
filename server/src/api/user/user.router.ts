import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { GetUserSchema, userSchema } from "./user.model.js";
import { userController } from "./user.controller.js";

export const userRegistry = new OpenAPIRegistry();
export const userRouter = Router();

userRegistry.register("User", userSchema);

userRegistry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  responses: createApiResponse(z.array(userSchema), "Success"),
});

userRouter.get("/", userController.getUsers);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(userSchema, "Success"),
});

userRouter.get("/:id", userController.getUser);

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema, emailSchema, nameSchema } from "../../types.js";

extendZodWithOpenApi(z);

export type User = z.infer<typeof userSchema>;

const usernameSchema = z.string().min(2, "Username must be at least 2 characters").max(50);

export const userSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetUserSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createUserSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});

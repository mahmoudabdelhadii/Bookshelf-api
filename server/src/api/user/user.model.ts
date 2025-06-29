import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { idSchema, emailSchema, nameSchema } from "../../types.js";

extendZodWithOpenApi(z);

const usernameSchema = z.string().min(2, "Username must be at least 2 characters").max(50).openapi({ description: "User's unique username" });

// User schema based on database schema
export const userSchema = z.object({
  id: idSchema,
  username: z.string().min(2, "Username must be at least 2 characters").max(50).openapi({ description: "User's unique username" }),
  email: z.string().email().openapi({ description: "User's email address" }),
  firstName: z.string().openapi({ description: "User's first name" }),
  lastName: z.string().openapi({ description: "User's last name" }),
  role: z.enum(["user", "admin"]).default("user").openapi({ description: "User's role in the system" }),
  createdAt: z.date().openapi({ description: "Timestamp when the user was created" }),
  updatedAt: z.date().openapi({ description: "Timestamp when the user was last updated" }),
}).openapi({ description: "User profile information" });

export const GetUserSchema = z.object({
  params: z.object({ id: idSchema }),
}).openapi({ description: "Get user by ID parameters" });

export const createUserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50).openapi({ description: "User's unique username" }),
  email: z.string().email().openapi({ description: "User's email address" }),
  firstName: z.string().openapi({ description: "User's first name" }),
  lastName: z.string().openapi({ description: "User's last name" }),
}).openapi({ description: "User creation data" });

export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
}).openapi({ description: "User update data" });

// TypeScript types derived from schemas
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;

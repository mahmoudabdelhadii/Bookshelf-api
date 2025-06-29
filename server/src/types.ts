import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const idSchema = z.string().uuid("Invalid UUID format").openapi({ description: "Unique identifier (UUID)" });

export const emailSchema = z.string().email("Invalid email address").openapi({ description: "Valid email address" });

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name cannot exceed 50 characters")
  .openapi({ description: "Person's name" });

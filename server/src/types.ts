import { z } from "zod";


export const idSchema = z.string().uuid("Invalid UUID format");


export const emailSchema = z.string().email("Invalid email address");


export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name cannot exceed 50 characters");

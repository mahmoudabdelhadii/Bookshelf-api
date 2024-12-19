import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "../../common/utils/commonValidation.js";
import { idSchema, emailSchema, nameSchema } from "../../types.js";
extendZodWithOpenApi(z);

export type User = z.infer<typeof userSchema>;



export const userSchema = z.object({
  id: idSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetUserSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

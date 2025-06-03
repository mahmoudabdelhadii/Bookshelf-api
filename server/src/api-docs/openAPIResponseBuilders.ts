import { StatusCodes } from "http-status-codes";
import type { z } from "zod";
import { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import { ServiceResponseSchema } from "../common/models/serviceResponse.js";

export function createApiResponse(schema: z.ZodTypeAny, description: string, statusCode = StatusCodes.OK) {
  return {
    [statusCode]: {
      description,
      content: {
        "application/json": {
          schema: ServiceResponseSchema(schema),
        },
      },
    },
  };
}

// Use if you want multiple responses for a single endpoint

export type ApiResponseConfig = {
  schema: z.ZodTypeAny;
  description: string;
  statusCode: StatusCodes;
};
export function createApiResponses(configs: ApiResponseConfig[]) {
  const responses: Record<string, ResponseConfig> = {};
  for (const { schema, description, statusCode } of configs) {
    responses[statusCode] = {
      description,
      content: {
        "application/json": {
          schema: ServiceResponseSchema(schema),
        },
      },
    };
  }
  return responses;
}

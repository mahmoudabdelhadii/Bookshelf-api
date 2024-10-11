import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { type Request, type Response, Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";

export const healthCheckRegistry = new OpenAPIRegistry();
export const healthCheckRouter: Router = Router();

healthCheckRegistry.registerPath({
  method: "get",
  path: "/health-check",
  tags: ["Health Check"],
  responses: createApiResponse(z.null(), "Success"),
});

healthCheckRouter.get("/", (_req: Request, res: Response) => {
  const serviceResponse = ServiceResponse.success("Service is healthy", null);
  return handleServiceResponse(serviceResponse, res);
});

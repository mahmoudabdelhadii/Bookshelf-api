import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import type { ZodSchema } from "zod";

import { ServiceResponse } from "../models/serviceResponse.js";

export const handleServiceResponse = <T>(serviceResponse: ServiceResponse<T>, response: Response) => {
  return response.status(serviceResponse.statusCode).send(serviceResponse);
};

export const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next(); 
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const errorMessage = `Invalid input: ${err.errors.map((e) => e.message).join(", ")}`;
      const statusCode = StatusCodes.BAD_REQUEST;
      const serviceResponse = ServiceResponse.failure(errorMessage, null, statusCode);
      return handleServiceResponse(serviceResponse, res);
    }
    next(err); 
  }
};

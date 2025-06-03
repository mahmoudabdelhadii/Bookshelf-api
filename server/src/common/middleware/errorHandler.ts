import { ZodError } from "zod";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ApiError } from "../../errors.js";
import { ServiceResponse } from "../models/serviceResponse.js";

export default function errorHandler(logger?: Logger): (RequestHandler | ErrorRequestHandler)[] {
  const notFoundHandler: RequestHandler = (_req, res) => {
    const response = ServiceResponse.failure("Not Found", null, StatusCodes.NOT_FOUND);
    res.status(StatusCodes.NOT_FOUND).send(response);
  };

  const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    logger?.error(err, "Unhandled error in request");

    if (err instanceof ApiError) {
      const response = ServiceResponse.failure(err.message, err.context, err.statusCode);
      return res.status(err.statusCode).send(response);
    }

    if (err instanceof ZodError) {
      const message = err.errors.map((e) => e.message).join(", ");
      const response = ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST);
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    const response = ServiceResponse.failure(
      "An unexpected error occurred",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(response);
  };

  return [notFoundHandler, errorMiddleware];
}

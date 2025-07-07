import { ZodError } from "zod";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ApiError } from "../../errors.js";
import { ServiceResponse } from "../models/serviceResponse.js";

interface ExtendedError extends Error {
  code?: string | number;
  type?: string;
}

export default function errorHandler(logger?: Logger): (RequestHandler | ErrorRequestHandler)[] {
  const notFoundHandler: RequestHandler = (req, res) => {
    logger?.warn({ url: req.url, method: req.method }, "Route not found");
    const response = ServiceResponse.failure("Resource not found", null, StatusCodes.NOT_FOUND);
    res.status(StatusCodes.NOT_FOUND).send(response);
  };

  const errorMiddleware: ErrorRequestHandler = (err: unknown, req, res, _next) => {
    const safeErr = err as ExtendedError;

    const errorContext = {
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      stack: safeErr.stack,
    };

    logger?.error({ err: safeErr, ...errorContext }, "Error occurred in request");

    if (safeErr instanceof ApiError) {
      const response = ServiceResponse.failure(safeErr.message, safeErr.context, safeErr.statusCode);
      return res.status(safeErr.statusCode).send(response);
    }

    if (safeErr instanceof ZodError) {
      const formattedErrors = safeErr.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      }));

      const response = ServiceResponse.failure(
        "Validation failed",
        { validationErrors: formattedErrors },
        StatusCodes.BAD_REQUEST,
      );
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (safeErr.name === "CastError") {
      const response = ServiceResponse.failure("Invalid ID format provided", null, StatusCodes.BAD_REQUEST);
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (safeErr.code === "ECONNREFUSED") {
      const response = ServiceResponse.failure(
        "Service temporarily unavailable",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).send(response);
    }

    if (safeErr.type === "entity.too.large") {
      const response = ServiceResponse.failure(
        "Request payload too large",
        null,
        StatusCodes.REQUEST_TOO_LONG,
      );
      return res.status(StatusCodes.REQUEST_TOO_LONG).send(response);
    }

    if (safeErr instanceof SyntaxError && safeErr.message.includes("JSON")) {
      const response = ServiceResponse.failure(
        "Invalid JSON format in request body",
        null,
        StatusCodes.BAD_REQUEST,
      );
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (
      safeErr.code === "ETIMEDOUT" ||
      (typeof safeErr.message === "string" && safeErr.message.includes("timeout"))
    ) {
      const response = ServiceResponse.failure("Request timeout", null, StatusCodes.REQUEST_TIMEOUT);
      return res.status(StatusCodes.REQUEST_TIMEOUT).send(response);
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    const response = ServiceResponse.failure(
      "An unexpected error occurred",
      isDevelopment ? { stack: safeErr.stack, name: safeErr.name } : null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(response);
  };

  return [notFoundHandler, errorMiddleware];
}

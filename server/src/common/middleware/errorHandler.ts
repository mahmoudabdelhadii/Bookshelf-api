import { ZodError } from "zod";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ApiError } from "../../errors.js";
import { ServiceResponse } from "../models/serviceResponse.js";

export default function errorHandler(logger?: Logger): (RequestHandler | ErrorRequestHandler)[] {
  const notFoundHandler: RequestHandler = (req, res) => {
    logger?.warn({ url: req.url, method: req.method }, "Route not found");
    const response = ServiceResponse.failure("Resource not found", null, StatusCodes.NOT_FOUND);
    res.status(StatusCodes.NOT_FOUND).send(response);
  };

  const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
    const errorContext = {
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      stack: err.stack,
    };

    logger?.error({ err, ...errorContext }, "Error occurred in request");

    if (err instanceof ApiError) {
      const response = ServiceResponse.failure(err.message, err.context, err.statusCode);
      return res.status(err.statusCode).send(response);
    }

    if (err instanceof ZodError) {
      const formattedErrors = err.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      }));

      const message = "Validation failed";
      const response = ServiceResponse.failure(
        message,
        { validationErrors: formattedErrors },
        StatusCodes.BAD_REQUEST,
      );
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (err.name === "CastError") {
      const response = ServiceResponse.failure("Invalid ID format provided", null, StatusCodes.BAD_REQUEST);
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (err.code === "ECONNREFUSED") {
      const response = ServiceResponse.failure(
        "Service temporarily unavailable",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).send(response);
    }

    if (err.type === "entity.too.large") {
      const response = ServiceResponse.failure(
        "Request payload too large",
        null,
        StatusCodes.REQUEST_TOO_LONG,
      );
      return res.status(StatusCodes.REQUEST_TOO_LONG).send(response);
    }

    if (err instanceof SyntaxError && err.message.includes("JSON")) {
      const response = ServiceResponse.failure(
        "Invalid JSON format in request body",
        null,
        StatusCodes.BAD_REQUEST,
      );
      return res.status(StatusCodes.BAD_REQUEST).send(response);
    }

    if (err.code === "ETIMEDOUT" || err.message.includes("timeout")) {
      const response = ServiceResponse.failure("Request timeout", null, StatusCodes.REQUEST_TIMEOUT);
      return res.status(StatusCodes.REQUEST_TIMEOUT).send(response);
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    const response = ServiceResponse.failure(
      "An unexpected error occurred",
      isDevelopment ? { stack: err.stack, name: err.name } : null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(response);
  };

  return [notFoundHandler, errorMiddleware];
}

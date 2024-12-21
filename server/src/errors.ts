export abstract class ApiError extends Error {
  abstract code: string;
  abstract statusCode: number;
  context: Record<string, unknown>;

  constructor(
    message: string,
    context: Record<string, unknown> = {},
    opts: ErrorOptions | undefined = undefined,
  ) {
    super(message, opts);
    this.context = context;
  }
}

export class ValidationError extends ApiError {
  override code = "Validation Error";
  override statusCode = 422;

  constructor(message = "Validation error occurred", context: Record<string, unknown> = {}) {
    super(message, context);
  }
}

export class ResourceAlreadyExistsError extends ApiError {
  override code = "Resource Already Exists";
  override statusCode = 409;

  constructor(
    message = "The resource you are trying to create already exists",
    context: Record<string, unknown> = {},
  ) {
    super(message, context);
  }
}

export class DatabaseError extends ApiError {
  override code = "Database Error";
  override statusCode = 500;

  constructor(message = "Database operation failed", context: Record<string, unknown> = {}) {
    super(message, context);
  }
}

export class PayloadTooLargeError extends ApiError {
  override code = "Payload Too Large";
  override statusCode = 413;

  constructor(
    message = "The request payload is too large to process",
    context: Record<string, unknown> = {},
  ) {
    super(message, context);
  }
}

export class RateLimitExceededError extends ApiError {
  override code = "Rate Limit Exceeded";
  override statusCode = 429;

  constructor(
    message = "Rate limit exceeded. Please try again later.",
    context: Record<string, unknown> = {},
  ) {
    super(message, context);
  }
}

export class ServiceUnavailableError extends ApiError {
  override code = "Service Unavailable";
  override statusCode = 503;

  constructor(
    message = "The requested service is currently unavailable",
    context: Record<string, unknown> = {},
  ) {
    super(message, context);
  }
}

export class BadRequest extends ApiError {
  override code = "Bad Request";
  override statusCode = 400;
}

export class Unauthorized extends ApiError {
  override code = "Unauthorized";
  override statusCode = 401;
}

export class Forbidden extends ApiError {
  override code = "Forbidden";
  override statusCode = 403;
}

export class NotFound extends ApiError {
  override code = "Not Found";
  override statusCode = 404;
}

export class MethodNotAllowed extends ApiError {
  override code = "Method Not Allowed";
  override statusCode = 405;
}

export class Conflict extends ApiError {
  override code = "Conflict";
  override statusCode = 409;
}

export class BadGateway extends ApiError {
  override code = "Bad Gateway";
  override statusCode = 502;
}

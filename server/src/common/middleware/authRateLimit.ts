import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { StatusCodes } from "http-status-codes";
import { env } from "../utils/envConfig.js";
import { redisClient } from "./session.js";
import type { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

const rateLimitResponse = (limit: number, windowMs: number) => ({
  success: false,
  message: `Too many requests. You have exceeded the limit of ${limit} requests per ${Math.floor(
    windowMs / 60000,
  )} minutes. Please try again later.`,
  responseObject: {
    limit,
    windowMs,
    retryAfter: Math.ceil(windowMs / 1000),
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
});

function createRedisStore() {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      prefix: "rl:",
    });
  }
  return undefined;
}

export const authRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: rateLimitResponse(env.AUTH_RATE_LIMIT_MAX_REQUESTS, env.AUTH_RATE_LIMIT_WINDOW_MS),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown",
  handler: (req, res) => {
    res
      .status(StatusCodes.TOO_MANY_REQUESTS)
      .json(rateLimitResponse(env.AUTH_RATE_LIMIT_MAX_REQUESTS, env.AUTH_RATE_LIMIT_WINDOW_MS));
  },
});

export const loginRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: rateLimitResponse(5, 15 * 60 * 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) =>
    `login:${req.ip ?? req.socket.remoteAddress ?? "unknown"}:${req.body?.email ?? "no-email"}`,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json(rateLimitResponse(5, 15 * 60 * 1000));
  },
});

export const passwordResetRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: rateLimitResponse(3, 60 * 60 * 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) => `password-reset:${req.body?.email ?? "no-email"}`,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many password reset requests. Please wait before requesting another reset.",
      responseObject: {
        limit: 3,
        windowMs: 60 * 60 * 1000,
        retryAfter: 3600,
      },
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
    });
  },
});

export const emailVerificationRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: rateLimitResponse(5, 10 * 60 * 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) =>
    `email-verify:${req.ip ?? req.socket.remoteAddress ?? "unknown"}:${(req.body?.token ?? "no-token").substring(0, 8)}`,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many email verification attempts. Please wait before trying again.",
      responseObject: {
        limit: 5,
        windowMs: 10 * 60 * 1000,
        retryAfter: 600,
      },
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
    });
  },
});

export const registrationRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: rateLimitResponse(5, 60 * 60 * 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) => `register:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many registration attempts. Please wait before creating another account.",
      responseObject: {
        limit: 5,
        windowMs: 60 * 60 * 1000,
        retryAfter: 3600,
      },
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
    });
  },
});

export const refreshTokenRateLimit = rateLimit({
  store: createRedisStore(),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: rateLimitResponse(10, 15 * 60 * 1000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request) => `refresh:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many token refresh attempts. Please wait before trying again.",
      responseObject: {
        limit: 10,
        windowMs: 15 * 60 * 1000,
        retryAfter: 900,
      },
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
    });
  },
});

export const createAdaptiveRateLimit = (baseMax: number, baseWindowMs: number) =>
  rateLimit({
    store: createRedisStore(),
    windowMs: baseWindowMs,
    limit: (req) => {
      const userAgent = req.get("user-agent") ?? "";
      const suspicious = ["automation", "selenium", "crawler", "spider", "scraper"].some((kw) =>
        userAgent.toLowerCase().includes(kw),
      );
      return userAgent.length > 10 && !suspicious ? baseMax : Math.max(1, Math.floor(baseMax / 2));
    },
    message: (req: Request) => {
      const max = typeof req.rateLimit?.limit === "number" ? req.rateLimit.limit : baseMax;
      return rateLimitResponse(max, baseWindowMs);
    },
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (_req) => process.env.NODE_ENV === "test",
  });

export const createProgressiveRateLimit = (baseMax: number, baseWindowMs: number) => {
  const violationStore = new Map<string, { count: number; firstViolation: number }>();

  return rateLimit({
    store: createRedisStore(),
    windowMs: baseWindowMs,
    limit: (req: Request) => {
      const key = req.ip ?? "unknown";
      const violation = violationStore.get(key);
      return violation ? Math.max(1, Math.floor(baseMax / Math.min(violation.count, 5))) : baseMax;
    },
    message: (req: Request) => {
      const key = req.ip ?? "unknown";
      const violation = violationStore.get(key);
      const multiplier = violation ? Math.min(violation.count, 5) : 1;
      const max = Math.max(1, Math.floor(baseMax / multiplier));
      return {
        success: false,
        message: `Rate limit exceeded. Due to repeated violations, your limit has been reduced to ${max} requests per window.`,
        responseObject: {
          limit: max,
          windowMs: baseWindowMs,
          violationCount: violation?.count ?? 0,
        },
        statusCode: StatusCodes.TOO_MANY_REQUESTS,
      };
    },
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (_req) => process.env.NODE_ENV === "test",
  });
};

export const authSecurityRateLimit = [
  authRateLimit,
  createAdaptiveRateLimit(env.AUTH_RATE_LIMIT_MAX_REQUESTS, env.AUTH_RATE_LIMIT_WINDOW_MS),
];

export class RateLimitUtils {
  static async resetRateLimit(key: string): Promise<void> {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(`rl:*${key}*`);
      if (keys.length > 0) await redisClient.del(keys);
    } catch (err) {
      console.error(err);
    }
  }

  static async getRateLimitStatus(key: string): Promise<{
    remaining: number;
    resetTime: Date | null;
    total: number;
  }> {
    if (!redisClient) {
      return {
        remaining: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
        resetTime: null,
        total: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
      };
    }

    try {
      const redisKey = `rl:${key}`;
      const [current, ttl] = await Promise.all([redisClient.get(redisKey), redisClient.ttl(redisKey)]);

      const count = current ? parseInt(current, 10) : 0;
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

      return {
        remaining: Math.max(0, env.AUTH_RATE_LIMIT_MAX_REQUESTS - count),
        resetTime,
        total: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
      };
    } catch (err) {
      console.error(err);
      return {
        remaining: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
        resetTime: null,
        total: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
      };
    }
  }

  static async isRateLimited(ip: string, limitType = "auth"): Promise<boolean> {
    if (!redisClient) return false;
    try {
      const current = await redisClient.get(`rl:${limitType}:${ip}`);
      return (current ? parseInt(current, 10) : 0) >= env.AUTH_RATE_LIMIT_MAX_REQUESTS;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

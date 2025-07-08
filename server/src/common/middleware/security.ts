import helmet from "helmet";
import type { Application, Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import crypto from "node:crypto";
import { env } from "../utils/envConfig.js";

export function configureSecurityHeaders(app: Application): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: env.isProduction ? [] : null,
        },
        reportOnly: !env.isProduction, // Report only in development
      },

      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      frameguard: {
        action: "deny",
      },

      noSniff: true,

      xssFilter: true,

      referrerPolicy: {
        policy: ["no-referrer", "strict-origin-when-cross-origin"],
      },

      crossOriginEmbedderPolicy: false, // May interfere with APIs

      crossOriginOpenerPolicy: {
        policy: "same-origin",
      },

      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },

      hidePoweredBy: true,
    }),
  );
}

export function apiSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.setHeader("X-API-Version", "1.0.0");
  res.setHeader("X-Response-Time", Date.now().toString());

  next();
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        req.query[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/[<>\"']/g, "");
      }
    }
  }

  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  next();
}

function sanitizeObject(obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      obj[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    } else if (typeof value === "object" && value !== null) {
      sanitizeObject(value);
    }
  }
}

export class IPAccessControl {
  private whitelist: Set<string>;
  private blacklist: Set<string>;

  constructor(whitelist: string[] = [], blacklist: string[] = []) {
    this.whitelist = new Set(whitelist);
    this.blacklist = new Set(blacklist);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = this.getClientIP(req);

      if (this.blacklist.has(clientIP)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied from this IP address",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      if (this.whitelist.size > 0 && !this.whitelist.has(clientIP)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied. IP not in whitelist",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      return next();
    };
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ??
      req.socket.remoteAddress ??
      (req.headers["x-forwarded-for"] as string).split(",")[0]?.trim() ??
      "unknown"
    );
  }

  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
  }

  addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
  }

  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
  }

  removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip);
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = crypto.randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);
  next();
}

export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code injection
    /eval\(/i, // Code injection
  ];

  const userAgent = req.get("user-agent") ?? "";
  const url = req.url;
  const body = JSON.stringify(req.body);

  const isSuspicious = suspiciousPatterns.some(
    (pattern) => pattern.test(url) || pattern.test(body) || pattern.test(userAgent),
  );

  if (isSuspicious) {
    console.warn("Suspicious request detected:", {
      ip: req.ip,
      userAgent,
      url,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"],
    });
  }

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn("Slow request detected:", {
        ip: req.ip,
        url,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        requestId: req.headers["x-request-id"],
      });
    }
  });

  next();
}

export function setupSecurity(app: Application) {
  configureSecurityHeaders(app);

  app.use(requestId);

  app.use(securityMonitoring);

  app.use("/api", apiSecurityHeaders);

  app.use(sanitizeRequest);
}

export const SecurityUtils = {
  validateOrigin(req: Request, allowedOrigins: string[]): boolean {
    const origin = req.get("origin");
    if (!origin) return false;

    return allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed.includes("*")) {
        const pattern = new RegExp(allowed.replace(/\*/g, ".*"));
        return pattern.test(origin);
      }
      return origin === allowed;
    });
  },

  isBot(userAgent: string): boolean {
    const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /java/i];

    return botPatterns.some((pattern) => pattern.test(userAgent));
  },

  generateNonce(): string {
    return crypto.randomBytes(16).toString("base64");
  },

  hashForLogging(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex").substring(0, 8);
  },
};

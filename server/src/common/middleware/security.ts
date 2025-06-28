import helmet from "helmet";
import type { Application, Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import crypto from "node:crypto";
import { env } from "../utils/envConfig.js";

/**
 * Comprehensive security middleware setup for production deployment
 */

/**
 * Configure Helmet.js with security headers
 */
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

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // X-Frame-Options
      frameguard: {
        action: "deny",
      },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: true,

      // Referrer Policy
      referrerPolicy: {
        policy: ["no-referrer", "strict-origin-when-cross-origin"],
      },

      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false, // May interfere with APIs

      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: {
        policy: "same-origin",
      },

      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },

      // Hide X-Powered-By header
      hidePoweredBy: true,
    }),
  );
}

/**
 * CSRF Protection Implementation
 */
interface CSRFOptions {
  cookieName?: string;
  headerName?: string;
  tokenLength?: number;
  ignoredMethods?: string[];
  whitelist?: string[];
}

class CSRFProtection {
  private cookieName: string;
  private headerName: string;
  private tokenLength: number;
  private ignoredMethods: Set<string>;
  private whitelist: Set<string>;

  constructor(options: CSRFOptions = {}) {
    this.cookieName = options.cookieName || "csrf-token";
    this.headerName = options.headerName || "x-csrf-token";
    this.tokenLength = options.tokenLength || 32;
    this.ignoredMethods = new Set(options.ignoredMethods || ["GET", "HEAD", "OPTIONS"]);
    this.whitelist = new Set(options.whitelist || []);
  }

  /**
   * Generate a cryptographically secure CSRF token
   */
  generateToken(): string {
    return crypto.randomBytes(this.tokenLength).toString("hex");
  }

  /**
   * Set CSRF token in cookie and make it available to client
   */
  setToken(_req: Request, res: Response): string {
    const token = this.generateToken();

    // Set secure httpOnly cookie for server verification
    res.cookie(`${this.cookieName}-secret`, token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Set readable cookie for client to include in headers
    res.cookie(this.cookieName, token, {
      httpOnly: false,
      secure: env.isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return token;
  }

  /**
   * Verify CSRF token
   */
  verifyToken(req: Request): boolean {
    const cookieToken = req.cookies[`${this.cookieName}-secret`];
    const headerToken = req.get(this.headerName) || req.body?._csrf;

    if (!cookieToken || !headerToken) {
      return false;
    }

    // Use timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  }

  /**
   * CSRF middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (this.whitelist.has(req.path)) {
        next();
        return;
      }

      // Skip for ignored methods (GET, HEAD, OPTIONS)
      if (this.ignoredMethods.has(req.method)) {
        // Ensure token is set for non-modifying requests
        if (!req.cookies[this.cookieName]) {
          this.setToken(req, res);
        }
        next();
        return;
      }

      // Verify CSRF token for state-changing requests
      if (!this.verifyToken(req)) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Invalid CSRF token. Please refresh the page and try again.",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      next();
      return;
    };
  }

  /**
   * Get CSRF token endpoint
   */
  getTokenEndpoint() {
    return (req: Request, res: Response) => {
      const token = this.setToken(req, res);

      res.json({
        success: true,
        message: "CSRF token generated",
        responseObject: { token },
        statusCode: StatusCodes.OK,
      });
    };
  }
}

// Create CSRF protection instance
export const csrfProtection = new CSRFProtection({
  whitelist: [
    "/health",
    "/api-docs",
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/password/reset-request",
    "/auth/password/reset",
    "/auth/email/verify",
  ],
});

/**
 * API Security Headers Middleware
 */
export function apiSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Security headers specific to API responses
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // API-specific headers
  res.setHeader("X-API-Version", "1.0.0");
  res.setHeader("X-Response-Time", Date.now().toString());

  next();
}

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  // Remove potentially dangerous characters from query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        // Remove HTML tags and potentially dangerous characters
        req.query[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/[<>\"']/g, "");
      }
    }
  }

  // Sanitize request body (basic XSS prevention)
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  next();
}

/**
 * Recursively sanitize object properties
 */
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

/**
 * IP Whitelist/Blacklist Middleware
 */
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

      // Check blacklist first
      if (this.blacklist.has(clientIP)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied from this IP address",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      // If whitelist is configured, check it
      if (this.whitelist.size > 0 && !this.whitelist.has(clientIP)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied. IP not in whitelist",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      next();
      return;
    };
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.socket.remoteAddress ||
      (req.headers["x-forwarded-for"] as string).split(",")[0]?.trim() ||
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

/**
 * Request ID middleware for tracking
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = crypto.randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);
  next();
}

/**
 * Security monitoring middleware
 */
export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code injection
    /eval\(/i, // Code injection
  ];

  const userAgent = req.get("user-agent") || "";
  const url = req.url;
  const body = JSON.stringify(req.body);

  // Check for suspicious patterns
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

  // Monitor response time
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      // Log slow requests
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

/**
 * Complete security middleware setup
 */
export function setupSecurity(app: Application) {
  // Configure security headers
  configureSecurityHeaders(app);

  // Add request ID for tracking
  app.use(requestId);

  // Add security monitoring
  app.use(securityMonitoring);

  // API-specific security headers
  app.use("/api", apiSecurityHeaders);

  // Request sanitization
  app.use(sanitizeRequest);

  // CSRF protection (exclude auth endpoints that need to work without existing session)
  app.use(csrfProtection.middleware());

  // Add CSRF token endpoint
  app.get("/api/csrf-token", csrfProtection.getTokenEndpoint());
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Validate origin header
   */
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

  /**
   * Check for bot/crawler user agents
   */
  isBot(userAgent: string): boolean {
    const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /java/i];

    return botPatterns.some((pattern) => pattern.test(userAgent));
  },

  /**
   * Generate nonce for CSP
   */
  generateNonce(): string {
    return crypto.randomBytes(16).toString("base64");
  },

  /**
   * Hash sensitive data for logging
   */
  hashForLogging(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex").substring(0, 8);
  },
};

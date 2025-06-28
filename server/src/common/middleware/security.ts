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
          styleSrc: ["'self'", "'unsafe-inline'", "https:
          fontSrc: ["'self'", "https:
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: env.isProduction ? [] : null,
        },
        reportOnly: !env.isProduction, 
      },

      
      hsts: {
        maxAge: 31536000, 
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

      
      crossOriginEmbedderPolicy: false, 

      
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

    
    res.cookie(`${this.cookieName}-secret`, token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, 
    });

    
    res.cookie(this.cookieName, token, {
      httpOnly: false,
      secure: env.isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, 
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

      
      if (this.ignoredMethods.has(req.method)) {
        
        if (!req.cookies[this.cookieName]) {
          this.setToken(req, res);
        }
        next();
        return;
      }

      
      if (!this.verifyToken(req)) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Invalid CSRF token. Please refresh the page and try again.",
          responseObject: null,
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      next();
      
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

/**
 * Request sanitization middleware
 */
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

      next();
      
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

  
  const suspiciousPatterns = [
    /\.\./, 
    /<script/i, 
    /union.*select/i, 
    /exec\(/i, 
    /eval\(/i, 
  ];

  const userAgent = req.get("user-agent") || "";
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

/**
 * Complete security middleware setup
 */
export function setupSecurity(app: Application) {
  
  configureSecurityHeaders(app);

  
  app.use(requestId);

  
  app.use(securityMonitoring);

  
  app.use("/api", apiSecurityHeaders);

  
  app.use(sanitizeRequest);

  
  app.use(csrfProtection.middleware());

  
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


import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import type { Application } from "express";
import { env } from "../utils/envConfig.js";

// Redis client configuration
export let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for session storage
 */
export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  try {
    if (redisClient) {
      return redisClient;
    }

    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    // Error handling
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis Client Connected");
    });

    redisClient.on("ready", () => {
      console.log("Redis Client Ready");
    });

    redisClient.on("end", () => {
      console.log("Redis Client Disconnected");
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.disconnect();
      redisClient = null;
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }
}

/**
 * Configure Express session middleware with Redis store
 */
export function configureSession(app: Application): void {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call initializeRedis() first.");
  }

  // Initialize Redis store
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: env.REDIS_SESSION_PREFIX,
    ttl: env.SESSION_MAX_AGE / 1000, // Convert milliseconds to seconds
  });

  // Configure session middleware
  const sessionConfig: session.SessionOptions = {
    store: redisStore,
    name: env.SESSION_NAME,
    secret: env.SESSION_SECRET,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset expiration on each response
    cookie: {
      secure: env.isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: env.SESSION_MAX_AGE,
      sameSite: env.isProduction ? "strict" : "lax", // CSRF protection
    },
  };

  // In production, ensure trust proxy is set for secure cookies
  if (env.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionConfig));
}

/**
 * Session utilities for authentication
 */
export class SessionManager {
  /**
   * Store user data in session
   */
  static storeUserSession(req: any, userData: {
    userId: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    lastLogin: Date;
  }): void {
    req.session.user = {
      ...userData,
      sessionStartTime: new Date(),
    };
  }

  /**
   * Get user data from session
   */
  static getUserFromSession(req: any): any | null {
    return req.session?.user || null;
  }

  /**
   * Clear user session
   */
  static clearUserSession(req: any): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Regenerate session ID (for security after login)
   */
  static regenerateSession(req: any): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update session with new data
   */
  static updateSession(req: any, updates: Partial<{
    permissions: string[];
    role: string;
    lastActivity: Date;
  }>): void {
    if (req.session?.user) {
      Object.assign(req.session.user, {
        ...updates,
        lastActivity: new Date(),
      });
    }
  }

  /**
   * Check if session is valid and not expired
   */
  static isSessionValid(req: any): boolean {
    if (!req.session?.user) {
      return false;
    }

    const sessionStartTime = new Date(req.session.user.sessionStartTime);
    const now = new Date();
    const sessionAge = now.getTime() - sessionStartTime.getTime();

    // Check if session has exceeded maximum age
    return sessionAge < env.SESSION_MAX_AGE;
  }

  /**
   * Get session information
   */
  static getSessionInfo(req: any): {
    id: string;
    isAuthenticated: boolean;
    user?: any;
    startTime?: Date;
    lastActivity?: Date;
    age: number;
  } {
    const sessionId = req.sessionID;
    const user = req.session?.user;
    const startTime = user?.sessionStartTime ? new Date(user.sessionStartTime) : undefined;
    const lastActivity = user?.lastActivity ? new Date(user.lastActivity) : undefined;
    const age = startTime ? Date.now() - startTime.getTime() : 0;

    return {
      id: sessionId,
      isAuthenticated: !!user,
      user,
      startTime,
      lastActivity,
      age,
    };
  }
}

/**
 * Middleware to check session validity
 */
export function validateSession(req: any, res: any, next: any): void {
  if (req.session?.user && !SessionManager.isSessionValid(req)) {
    // Session expired, clear it
    SessionManager.clearUserSession(req)
      .then(() => {
        res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          responseObject: null,
          statusCode: 401,
        });
      })
      .catch((err) => {
        console.error("Error clearing expired session:", err);
        next(err);
      });
    return;
  }

  // Update last activity if user is authenticated
  if (req.session?.user) {
    SessionManager.updateSession(req, { lastActivity: new Date() });
  }

  next();
}

/**
 * Require session authentication
 */
export function requireSession(req: any, res: any, next: any): void {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Session authentication required. Please log in.",
      responseObject: null,
      statusCode: 401,
    });
  }

  if (!SessionManager.isSessionValid(req)) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
      responseObject: null,
      statusCode: 401,
    });
  }

  next();
}

/**
 * Session-based authentication middleware (alternative to JWT)
 */
export function authenticateSession(req: any, res: any, next: any): void {
  if (req.session?.user && SessionManager.isSessionValid(req)) {
    req.user = req.session.user;
    SessionManager.updateSession(req, { lastActivity: new Date() });
  }
  next();
}

/**
 * Hybrid authentication (JWT or Session)
 */
export function hybridAuth(req: any, res: any, next: any): void {
  // First try JWT authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // JWT authentication takes precedence
    return next();
  }

  // Fall back to session authentication
  authenticateSession(req, res, next);
}

/**
 * Session cleanup utilities
 */
export class SessionCleanup {
  /**
   * Clean up expired sessions from Redis
   */
  static async cleanupExpiredSessions(): Promise<void> {
    if (!redisClient) {
      console.warn("Redis client not available for session cleanup");
      return;
    }

    try {
      const pattern = `${env.REDIS_SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length === 0) {
        return;
      }

      // Check each session key for expiration
      const pipeline = redisClient.multi();
      
      for (const key of keys) {
        pipeline.ttl(key);
      }
      
      const ttls = await pipeline.exec();
      
      // Remove sessions that have very low TTL (about to expire)
      const keysToDelete = keys.filter((key, index) => {
        const ttl = ttls?.[index] as number;
        return ttl !== null && ttl >= 0 && ttl < 60; // Remove if expires in less than 1 minute
      });

      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
        console.log(`Cleaned up ${keysToDelete.length} expired sessions`);
      }
    } catch (error) {
      console.error("Error during session cleanup:", error);
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiringSoon: number;
  }> {
    if (!redisClient) {
      return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    }

    try {
      const pattern = `${env.REDIS_SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      const totalSessions = keys.length;

      if (totalSessions === 0) {
        return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
      }

      const pipeline = redisClient.multi();
      for (const key of keys) {
        pipeline.ttl(key);
      }

      const ttls = await pipeline.exec();
      let activeSessions = 0;
      let expiringSoon = 0;

      ttls?.forEach((ttl) => {
        const ttlValue = ttl as number;
        if (ttlValue > 0) {
          activeSessions++;
          if (ttlValue < 300) { // Expires in less than 5 minutes
            expiringSoon++;
          }
        }
      });

      return { totalSessions, activeSessions, expiringSoon };
    } catch (error) {
      console.error("Error getting session stats:", error);
      return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    }
  }
}

/**
 * Setup session cleanup interval
 */
export function setupSessionCleanup(): NodeJS.Timeout {
  // Clean up expired sessions every 15 minutes
  return setInterval(() => {
    SessionCleanup.cleanupExpiredSessions();
  }, 15 * 60 * 1000);
}

// Type extensions for Express session
declare module "express-session" {
  interface SessionData {
    user?: {
      userId: string;
      username: string;
      email: string;
      role: string;
      permissions: string[];
      lastLogin: Date;
      sessionStartTime: Date;
      lastActivity?: Date;
    };
  }
}
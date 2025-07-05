import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import type { Application } from "express";
import { env } from "../utils/envConfig.js";
import { DrizzleClient } from "database";

export let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for session storage
 */
export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  try {
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }

    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {});

    redisClient.on("connect", () => {});

    redisClient.on("ready", () => {});

    redisClient.on("end", () => {});

    redisClient.on("reconnecting", () => {});

    const connectTimeout = setTimeout(() => {
      if (redisClient && !redisClient.isOpen) {
        redisClient.disconnect().catch(() => {});
        throw new Error("Redis connection timeout after 10 seconds");
      }
    }, 10000);

    await redisClient.connect();
    clearTimeout(connectTimeout);

    await redisClient.ping();

    return redisClient;
  } catch (err) {
    redisClient = null;
    throw err;
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
    } catch (err) {}
  }
}

/**
 * Configure Express session middleware with Redis store
 */
export function configureSession(app: Application): void {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call initializeRedis() first.");
  }

  try {
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: env.REDIS_SESSION_PREFIX,
      ttl: Math.floor(env.SESSION_MAX_AGE / 1000),
      disableTouch: false,
    });

    const sessionConfig: session.SessionOptions = {
      store: redisStore,
      name: env.SESSION_NAME,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: env.isProduction,
        httpOnly: true,
        maxAge: env.SESSION_MAX_AGE,
        sameSite: env.isProduction ? "strict" : "lax",
      },
    };

    if (env.isProduction) {
      app.set("trust proxy", 1);
    }

    app.use(session(sessionConfig));
  } catch (err) {
    throw err;
  }
}

/**
 * Session utilities for authentication
 */
export class SessionManager {
  /**
   * Store user data in session
   */
  static storeUserSession(
    req: any,
    userData: {
      userId: string;
      username: string;
      email: string;
      role: string;
      permissions: string[];
      lastLogin: Date;
    },
  ): void {
    req.session.user = {
      ...userData,
      sessionStartTime: new Date(),
    };
  }

  /**
   * Get user data from session
   */
  static getUserFromSession(req: any): any | null {
    return req.session?.user ?? null;
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
  static updateSession(
    req: any,
    updates: Partial<{
      permissions: string[];
      role: string;
      lastActivity: Date;
    }>,
  ): void {
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
        next(err);
      });
    return;
  }

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
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return next();
  }

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
      return;
    }

    try {
      const pattern = `${env.REDIS_SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length === 0) {
        return;
      }

      const pipeline = redisClient.multi();

      for (const key of keys) {
        pipeline.ttl(key);
      }

      const ttls = await pipeline.exec();

      const keysToDelete = keys.filter((key, index) => {
        const ttl = ttls[index] as unknown as number;
        return ttl !== null && ttl >= 0 && ttl < 60;
      });

      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
      }
    } catch (err) {}
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

      if (ttls)
        for (const ttl of ttls) {
          const ttlValue = ttl as unknown as number;
          if (ttlValue > 0) {
            activeSessions++;
            if (ttlValue < 300) {
              expiringSoon++;
            }
          }
        }

      return { totalSessions, activeSessions, expiringSoon };
    } catch (err) {
      return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    }
  }
}

/**
 * Setup session cleanup interval
 */
export function setupSessionCleanup(): NodeJS.Timeout {
  return setInterval(
    () => {
      SessionCleanup.cleanupExpiredSessions();
    },
    15 * 60 * 1000,
  );
}

/**
 * Create session record for database tracking
 */
export async function createSessionRecord(
  drizzle: DrizzleClient,
  userId: string,
  sessionData: {
    sessionToken: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  },
): Promise<void> {
  try {
    console.log(`Session created for user ${userId}:`, {
      sessionToken: `${sessionData.sessionToken.substring(0, 10)}...`,
      expiresAt: sessionData.expiresAt,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent?.substring(0, 50),
    });
  } catch (err) {
    console.error("Failed to create session record:", err);
  }
}

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

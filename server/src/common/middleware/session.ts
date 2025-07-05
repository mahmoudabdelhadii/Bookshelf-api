import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import type { Application } from "express";
import { env } from "../utils/envConfig.js";
import { DrizzleClient, logger } from "database";

export let redisClient: ReturnType<typeof createClient> | null = null;


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

    redisClient.on("error", (err) => {
      console.error("Redis error", err);
    });

    redisClient.on("connect", () => {});

    redisClient.on("ready", () => {});

    redisClient.on("end", () => {});

    redisClient.on("reconnecting", () => {});

    const connectTimeout = setTimeout(() => {
      if (redisClient && !redisClient.isOpen) {
        redisClient.destroy();
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


export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      redisClient.destroy();
      redisClient = null;
    } catch (err) {
      console.error("Redis close error", err);
    }
  }
}


export function configureSession(app: Application): void {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call initializeRedis() first.");
  }

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
}


interface SessionRequest {
  session: {
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
    destroy: (callback: (err?: Error) => void) => void;
    regenerate: (callback: (err?: Error) => void) => void;
  };
  sessionID: string;
}

export namespace SessionManager {
  
  export function storeUserSession(
    req: SessionRequest,
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

  
  export function getUserFromSession(req: SessionRequest): SessionRequest["session"]["user"] | null {
    return req.session.user ?? null;
  }

  
  export function clearUserSession(req: SessionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err?: Error) => {
        if (err) {
          reject(new Error(`Failed to destroy session: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  
  export function regenerateSession(req: SessionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err?: Error) => {
        if (err) {
          reject(new Error(`Failed to regenerate session: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  
  export function updateSession(
    req: SessionRequest,
    updates: Partial<{
      permissions: string[];
      role: string;
      lastActivity: Date;
    }>,
  ): void {
    if (req.session.user) {
      Object.assign(req.session.user, {
        ...updates,
        lastActivity: new Date(),
      });
    }
  }

  
  export function isSessionValid(req: SessionRequest): boolean {
    if (!req.session.user) {
      return false;
    }

    const sessionStartTime = new Date(req.session.user.sessionStartTime);
    const now = new Date();
    const sessionAge = now.getTime() - sessionStartTime.getTime();

    return sessionAge < env.SESSION_MAX_AGE;
  }

  
  export function getSessionInfo(req: SessionRequest): {
    id: string;
    isAuthenticated: boolean;
    user?: SessionRequest["session"]["user"];
    startTime?: Date;
    lastActivity?: Date;
    age: number;
  } {
    const sessionId = req.sessionID;
    const user = req.session.user;
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


interface ExpressRequest extends SessionRequest {
  user?: SessionRequest["session"]["user"];
}

interface ExpressResponse {
  status: (code: number) => {
    json: (data: unknown) => void;
  };
}

export function validateSession(
  req: ExpressRequest,
  res: ExpressResponse,
  next: (err?: Error) => void,
): void {
  if (req.session.user && !SessionManager.isSessionValid(req)) {
    void SessionManager.clearUserSession(req)
      .then(() => {
        res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          responseObject: null,
          statusCode: 401,
        });
      })
      .catch((err: unknown) => {
        next(err instanceof Error ? err : new Error("Session cleanup failed"));
      });
    return;
  }

  if (req.session.user) {
    SessionManager.updateSession(req, { lastActivity: new Date() });
  }

  next();
}


export function requireSession(req: ExpressRequest, res: ExpressResponse, next: (err?: Error) => void): void {
  if (!req.session.user) {
    res.status(401).json({
      success: false,
      message: "Session authentication required. Please log in.",
      responseObject: null,
      statusCode: 401,
    }); return;
  }

  if (!SessionManager.isSessionValid(req)) {
    res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
      responseObject: null,
      statusCode: 401,
    }); return;
  }

  next();
  
}


export function authenticateSession(
  req: ExpressRequest,
  res: ExpressResponse,
  next: (err?: Error) => void,
): void {
  if (req.session.user && SessionManager.isSessionValid(req)) {
    req.user = req.session.user;
    SessionManager.updateSession(req, { lastActivity: new Date() });
  }
  next();
  
}


interface RequestWithHeaders extends ExpressRequest {
  headers: {
    authorization?: string;
  };
}

export function hybridAuth(req: RequestWithHeaders, res: ExpressResponse, next: (err?: Error) => void): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    next(); return;
  }

  authenticateSession(req, res, next);
}


export namespace SessionCleanup {
  
  export async function cleanupExpiredSessions(): Promise<void> {
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
    } catch (err) {
      console.error("Redis error", err);
    }
  }

  
  export async function getSessionStats(): Promise<{
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

      if (ttls) {
        for (const ttl of ttls) {
          const ttlValue = ttl as unknown as number;
          if (ttlValue > 0) {
            activeSessions++;
            if (ttlValue < 300) {
              expiringSoon++;
            }
          }
        }
      }

      return { totalSessions, activeSessions, expiringSoon };
    } catch (err) {
      console.error("Redis error", err);

      return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    }
  }
}


export function setupSessionCleanup(): NodeJS.Timeout {
  return setInterval(
    () => {
      void SessionCleanup.cleanupExpiredSessions();
    },
    15 * 60 * 1000,
  );
}


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
    logger.info("Session created for user %s", userId, {
      sessionToken: `${sessionData.sessionToken.substring(0, 10)}...`,
      expiresAt: sessionData.expiresAt,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent?.substring(0, 50),
    });
  } catch (err) {
    logger.error({ error: err }, "Failed to create session record");
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

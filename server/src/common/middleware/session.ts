import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import type { Application } from "express";
import { env } from "../utils/envConfig.js";
import { DrizzleClient, logger } from "database";

export let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  if (redisClient && redisClient.isOpen) return redisClient;

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => (retries > 5 ? false : Math.min(retries * 100, 3000)),
    },
  });

  redisClient.on("error", (err) => {
    logger.error(err, "Redis error");
  });
  await redisClient.connect();
  await redisClient.ping();

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
    } catch (err) {
      logger.error(err, "Redis close error");
    }
  }
}

export function configureSession(app: Application): void {
  if (!redisClient) throw new Error("Redis client not initialized. Call initializeRedis() first.");

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: env.REDIS_SESSION_PREFIX,
    ttl: Math.floor(env.SESSION_MAX_AGE / 1000),
    disableTouch: false,
  });

  app.use(
    session({
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
    }),
  );

  if (env.isProduction) app.set("trust proxy", 1);
}

interface SessionRequest {
  session: session.Session & {
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
  };
  sessionID: string;
}

export const SessionManager = {
  storeUserSession(
    req: SessionRequest,
    userData: Omit<NonNullable<SessionRequest["session"]["user"]>, "sessionStartTime">,
  ): void {
    req.session.user = {
      ...userData,
      sessionStartTime: new Date(),
    };
  },

  getUserFromSession(req: SessionRequest) {
    return req.session.user ?? null;
  },

  clearUserSession(req: SessionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(new Error("Failed to destroy session"));
        else resolve();
      });
    });
  },

  regenerateSession(req: SessionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(new Error("Failed to regenerate session"));
        else resolve();
      });
    });
  },

  updateSession(
    req: SessionRequest,
    updates: Partial<
      Pick<NonNullable<SessionRequest["session"]["user"]>, "permissions" | "role" | "lastActivity">
    >,
  ): void {
    if (req.session.user) {
      Object.assign(req.session.user, {
        ...updates,
        lastActivity: new Date(),
      });
    }
  },

  isSessionValid(req: SessionRequest): boolean {
    const start = req.session.user?.sessionStartTime;
    return !!start && Date.now() - new Date(start).getTime() < env.SESSION_MAX_AGE;
  },

  getSessionInfo(req: SessionRequest) {
    const user = req.session.user;
    const start = user?.sessionStartTime ? new Date(user.sessionStartTime) : undefined;
    const last = user?.lastActivity ? new Date(user.lastActivity) : undefined;
    return {
      id: req.sessionID,
      isAuthenticated: !!user,
      user,
      startTime: start,
      lastActivity: last,
      age: start ? Date.now() - start.getTime() : 0,
    };
  },
};

interface ExpressRequest extends SessionRequest {
  user?: NonNullable<SessionRequest["session"]["user"]>;
}

interface ExpressResponse {
  status: (code: number) => { json: (data: unknown) => void };
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
          message: "Session expired.",
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
  if (!req.session.user || !SessionManager.isSessionValid(req)) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
      responseObject: null,
      statusCode: 401,
    });
    return;
  }
  next();
}

export function authenticateSession(
  req: ExpressRequest,
  _res: ExpressResponse,
  next: (err?: Error) => void,
): void {
  if (req.session.user && SessionManager.isSessionValid(req)) {
    req.user = req.session.user;
    SessionManager.updateSession(req, { lastActivity: new Date() });
  }
  next();
}

interface RequestWithHeaders extends ExpressRequest {
  headers: { authorization?: string };
}

export function hybridAuth(req: RequestWithHeaders, res: ExpressResponse, next: (err?: Error) => void): void {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    next();
    return;
  }
  authenticateSession(req, res, next);
}

export const SessionCleanup = {
  async cleanupExpiredSessions(): Promise<void> {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(`${env.REDIS_SESSION_PREFIX}*`);
      if (!keys.length) return;

      const pipeline = redisClient.multi();
      for (const key of keys) {
        pipeline.ttl(key);
      }

      const ttls = await pipeline.exec();
      const toDelete = keys.filter((k, i) => {
        const ttl = ttls[i] as unknown as number;
        return ttl >= 0 && ttl < 60;
      });

      if (toDelete.length > 0) {
        await redisClient.del(toDelete);
      }
    } catch (err: unknown) {
      logger.error(err, "Error during session cleanup");
    }
  },

  async getSessionStats(): Promise<{ totalSessions: number; activeSessions: number; expiringSoon: number }> {
    if (!redisClient) return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    try {
      const keys = await redisClient.keys(`${env.REDIS_SESSION_PREFIX}*`);
      const pipeline = redisClient.multi();
      for (const key of keys) {
        pipeline.ttl(key);
      }
      const ttls = await pipeline.exec();

      let active = 0;
      let soon = 0;
      for (const ttl of ttls) {
        const t = ttl as unknown as number;
        if (t > 0) {
          active++;
          if (t < 300) soon++;
        }
      }
      return { totalSessions: keys.length, activeSessions: active, expiringSoon: soon };
    } catch (err: unknown) {
      logger.error(err, "Error getting session stats");
      return { totalSessions: 0, activeSessions: 0, expiringSoon: 0 };
    }
  },
};

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

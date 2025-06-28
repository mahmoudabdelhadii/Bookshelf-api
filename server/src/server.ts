import cors from "cors";
import express, { json, urlencoded } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "./api-docs/openAPIRouter.js";
import { healthCheckRouter } from "./api/healthCheck/healthCheckRouter.js";
import { userRouter } from "./api/user/user.router.js";
import { booksRouter } from "./api/book/book.router.js";
import { libraryRouter } from "./api/library/library.router.js";
import { libraryBooksRouter } from "./api/libraryBooks/libraryBooks.router.js";
import { authRouter } from "./api/auth/auth.router.js";
import errorHandler from "./common/middleware/errorHandler.js";
import rateLimiter from "./common/middleware/rateLimiter.js";
import requestLogger from "./common/middleware/requestLogger.js";
import { env } from "./common/utils/envConfig.js";
import { configurePassport } from "./common/auth/strategies.js";
import { configureOAuthStrategies } from "./common/auth/oauthStrategies.js";
import { initializeRedis, configureSession } from "./common/middleware/session.js";
import passport from "passport";

import { LOG_LEVEL } from "../env.js";
import { connect } from "database";
import type { DrizzleClient } from "database";
import { pinoHttp } from "pino-http";

const { drizzle } = connect("server");
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      drizzle: DrizzleClient;
    }
  }
}

const logger = pino({
  level: LOG_LEVEL,
  base: { app: "server" },
  customLevels: { http: 27 },
});

const app = express();


async function initializeServer() {
  try {
    
    await initializeRedis();
    logger.info("Redis initialized successfully");

    
    configureSession(app);
    logger.info("Session middleware configured");
  } catch (err) {
    logger.error("Failed to initialize Redis or session middleware:", err);
    logger.warn("Continuing without Redis session support");
  }
}

initializeServer().catch((err: unknown) => {
  logger.error("Server initialization failed:", err);
});

app.set("trust proxy", true);

app.use((req, _res, next) => {
  req.drizzle = drizzle;
  next();
});


configurePassport(drizzle);
configureOAuthStrategies(drizzle);

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);


app.use(passport.initialize());
app.use(passport.session());

app.use(requestLogger);

app.use(
  pinoHttp(
    {
      useLevel: "http",
      logger,
    },
    undefined,
  ),
);

app.use("/health-check", healthCheckRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/books", booksRouter);
app.use("/libraries", libraryRouter);
app.use("/library-books", libraryBooksRouter);

app.use("/docs", openAPIRouter);

app.use(errorHandler());

export { app, logger };

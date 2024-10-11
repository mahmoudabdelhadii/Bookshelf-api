import cors from "cors";
import express, {  json,urlencoded } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "./api-docs/openAPIRouter.js";
import { healthCheckRouter } from "./api/healthCheck/healthCheckRouter.js";
import { userRouter } from "./api/user/userRouter.js";
import errorHandler from "./common/middleware/errorHandler.js";
import rateLimiter from "./common/middleware/rateLimiter.js";
import requestLogger from "./common/middleware/requestLogger.js";
import { env } from "./common/utils/envConfig.js";

import { LOG_LEVEL} from "../env.js";
import { connect, schema } from "database";
import type { DrizzleClient } from "database";
import {pinoHttp} from "pino-http";

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
    customLevels: { http: 27 }, });
const app = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

app.use((req, _res, next) => {
  req.drizzle = drizzle;
  next();
});
// Middlewares
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
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
// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };

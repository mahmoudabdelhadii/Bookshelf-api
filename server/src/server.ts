import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "./api-docs/openAPIRouter.js";
import { healthCheckRouter } from "./api/healthCheck/healthCheckRouter.js";
import { userRouter } from "./api/user/userRouter.js";
import errorHandler from "./common/middleware/errorHandler.js";
import rateLimiter from "./common/middleware/rateLimiter.js";
import requestLogger from "./common/middleware/requestLogger.js";
import { env } from "./common/utils/envConfig.js";

import { connect, schema} from "database"
import type { DrizzleClient } from "database";



const { drizzle } = connect("server");
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
      interface Request {
        drizzle: DrizzleClient;
      }
    }
  }

  
const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

app.use((req, _res, next) => {
    req.drizzle = drizzle;
    next();
  });
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };

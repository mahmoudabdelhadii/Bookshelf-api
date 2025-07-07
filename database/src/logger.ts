import { pino } from "pino";
import { SQL_LOG_LEVEL } from "./env.js";

export const logger = pino({
  level: SQL_LOG_LEVEL,
  base: { app: "database" },
  customLevels: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    query: 25,
    debug: 20,
    trace: 10,
  },
  useOnlyCustomLevels: true,
});

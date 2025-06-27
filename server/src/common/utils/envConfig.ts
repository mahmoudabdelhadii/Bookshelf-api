import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("test"),

  HOST: z.string().min(1).default("localhost"),

  PORT: z.coerce.number().int().positive().default(3000),

  ISBNDB_API_KEY: z.string().default(""), // allow empty string by default

  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),

  COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

  COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

  // JWT Configuration
  JWT_SECRET: z.string().min(32).default("your-super-secret-jwt-key-change-in-production-minimum-32-chars"),
  JWT_REFRESH_SECRET: z.string().min(32).default("your-super-secret-refresh-key-change-in-production-different-from-jwt"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  JWT_ISSUER: z.string().default("bookshelf-api"),
  JWT_AUDIENCE: z.string().default("bookshelf-users"),

  // Session Configuration
  SESSION_SECRET: z.string().min(32).default("your-super-secret-session-key-change-in-production-minimum-32-chars"),
  SESSION_NAME: z.string().default("bookshelf-session"),
  SESSION_MAX_AGE: z.coerce.number().int().positive().default(86400000), // 24 hours in ms

  // Redis Configuration (for session storage)
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_SESSION_PREFIX: z.string().default("sess:"),

  // Security Configuration
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  PASSWORD_RESET_EXPIRES: z.coerce.number().int().positive().default(3600000), // 1 hour in ms
  EMAIL_VERIFICATION_EXPIRES: z.coerce.number().int().positive().default(86400000), // 24 hours in ms
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOCKOUT_TIME: z.coerce.number().int().positive().default(900000), // 15 minutes in ms

  // Rate Limiting for Auth
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes

  // 2FA Configuration
  TWO_FA_ISSUER: z.string().default("Bookshelf API"),
  TWO_FA_WINDOW: z.coerce.number().int().positive().default(2), // Time step tolerance
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isProduction: parsedEnv.data.NODE_ENV === "production",
  isTest: parsedEnv.data.NODE_ENV === "test",
};

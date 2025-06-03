/* eslint-disable no-console */
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

function number(name: string, fallback?: number): number {
  const value = process.env[name];
  if (!value && fallback === undefined) throw new Error(`Environment variable ${name} is required`);
  if (!value) return fallback!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  if (Number.isNaN(+value)) throw new Error(`Environment variable ${name} must be a number. Found: ${value}`);
  return +value;
}

export const ENV = process.env.ENV ?? "development";
console.log(`Running in ${ENV} mode`);

export const IS_DEV = ENV === "development";

export const PORT = number("PORT", 4050);
export const HOST = process.env.HOST ?? "0.0.0.0";
// Set default logging levels based on environment if LOG_LEVEL not provided
const defaultLogLevel =
  ENV === "development"
    ? "debug"
    : ENV === "test"
    ? "silent"
    : "info";
export const LOG_LEVEL = process.env.LOG_LEVEL ?? defaultLogLevel;
export const DATABASE_URL = ENV !== "test" ? required("DATABASE_URL") : null;
export const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY ?? "";

 
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

function number(name: string, fallback?: number): number {
  const value = process.env[name];
  if (!value && fallback === undefined) throw new Error(`Environment variable ${name} is required`);
  if (!value) return fallback!;
  if (Number.isNaN(+value)) throw new Error(`Environment variable ${name} must be a number. Found: ${value}`);
  return +value;
}

export const ENV = process.env.ENV ?? "development";

export const IS_DEV = ENV === "development";

export const PORT = number("PORT", 4050);
export const HOST = process.env.HOST ?? "0.0.0.0";

let defaultLogLevel = "info";
if (ENV === "development") {
  defaultLogLevel = "debug";
} else if (ENV === "test") {
  defaultLogLevel = "silent";
}
export const LOG_LEVEL = process.env.LOG_LEVEL ?? defaultLogLevel;
export const DATABASE_URL = ENV !== "test" ? required("DATABASE_URL") : null;
export const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY ?? "";

import { rule as logFormat } from "./rules/log-format.js";
import { rule as drizzle } from "./rules/drizzle.js";
import recommended from "./configs/recommended.js";

export const rules: Record<string, unknown> = {
  "log-format": logFormat,
  drizzle,
};

export const configs = {
  recommended,
};

export default {
  plugins: ["kitab"],
  rules: {
    "kitab/log-format": [
      "warn",
      {
        loggerNames: ["logger"],
        logMethods: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
      },
    ],
    "kitab/drizzle": [
      "warn",
      {
        drizzleNames: ["drizzle"],
      },
    ],
  },
};

export default {
  plugins: ["bookshelf"],
  rules: {
    "bookshelf/log-format": [
      "warn",
      {
        loggerNames: ["logger"],
        logMethods: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
      },
    ],
    "bookshelf/drizzle": [
      "warn",
      {
        drizzleNames: ["drizzle"],
      },
    ],
  },
};

const { format } = require("sql-formatter");

module.exports = {
  messageFormat: "[{app}] {msg}",
  colorize: true,
  customColors: "query:yellowBright,http:green",
  customLevels: "query:25,http:27",
  useOnlyCustomProps: false,
  ignore: "pid,hostname,app,pubsubMessage",
  customPrettifiers: {
    query: (query) => {
      try {
        return format(query, { language: "postgresql" });
      } catch {
        return query;
      }
    },
  },
};

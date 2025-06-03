#!/usr/bin/env -S npx tsx -r dotenv/config
/**
 * Run all the services at once.
 *
 * Pulls all environment variables from the root `.env` file and supplies them to each of our service.
 */

import Watcher from "watcher";
import concurrently from "concurrently";
import ignore from "ignore";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { spawn } from "node:child_process";
import { pino } from "pino";

function declareVar(value: string, fallback: string) {
  const parsed = Object.fromEntries(
    value
      .split(",")
      .map((spec) => spec.split("="))
      .map(([app, value]) => (app && value ? [app, value] : ["default", app])),
  );

  return (app: string) => parsed[app] ?? parsed.default ?? fallback;
}

const logger = pino({
  transport: { target: "pino-pretty" },
});

const logLevel = declareVar(process.env.LOG_LEVEL ?? "", "info");
const watch = declareVar(process.env.WATCH ?? "", "false");
const adaptLoguru = "npx pino-pretty -m text -k 'record.exception' --levelKey 'record.level.name' -i 'record.elapsed,record.file,record.exception,record.function,record.level,record.line,record.message,record.module,record.name,record.process,record.thread,record.time' -x 'TRACE:5,DEBUG:10,INFO:20,SUCCESS:25,WARNING:30,ERROR:40,CRITICAL:50' -a 'record.time.timestamp'";

const apps = [
  {
    name: "server",
    command: "npm run -w server dev",
    env: { ...process.env, LOG_LEVEL: logLevel("server") },
  },
];

// @ts-expect-error -- types are wrong or something idk
concurrently(apps, { prefixColors: "auto" });

// @ts-expect-error -- types are wrong or something idk
const filter = ignore().add(readFileSync("./.dockerignore", "utf-8"));
const LIBS = {
  database: "build-database",
} as const;

const isRebuilding = new Set();
const rebuildAgain = new Set();
async function rebuild(lib: keyof typeof LIBS) {
  const toRebuild = LIBS[lib];
  if (isRebuilding.has(toRebuild)) {
    rebuildAgain.add(toRebuild);
    return;
  }

  isRebuilding.add(toRebuild);
  rebuildAgain.delete(toRebuild);
  logger.info("Change detected in %s. Running %s.", lib, toRebuild);

  const cp = spawn("just", [toRebuild], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "inherit", "inherit"],
  });
  cp.on("exit", () => {
    logger.info("Rebuilt libs (exit code %d)", cp.exitCode ?? -1);
    isRebuilding.delete(toRebuild);
    if (rebuildAgain.has(toRebuild)) rebuild(lib);
  });
  cp.on("error", (error) => {
    logger.error({ err: error }, "Error building %s", toRebuild);
    isRebuilding.delete(toRebuild);
    if (rebuildAgain.has(toRebuild)) rebuild(lib);
  });
}

const watchers: Watcher[] = [];
for (const lib of Object.keys(LIBS) as (keyof typeof LIBS)[]) {
  if (watch(lib)) {
    logger.info("Watching %s", lib);
    const watcher = new Watcher(lib, {
      renameDetection: false,
      ignore: (path: string) => filter.ignores(relative(process.cwd(), path)),
      ignoreInitial: true,
      recursive: true,
    });
    watcher.on("all", () => rebuild(lib));
    watchers.push(watcher);
  }
}

process.on("SIGINT", () => {
  for (const watcher of watchers) watcher.close();
  logger.info("Exiting");
});

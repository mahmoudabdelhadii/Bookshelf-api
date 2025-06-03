import { RuleTester } from "@typescript-eslint/rule-tester";
import { rule } from "./log-format.js";
import { after, describe, it } from "node:test";

RuleTester.afterAll = after;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.describe = describe;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("log-format", rule, {
  invalid: [
    {
      code: "logger.info(`Hello ${x}`);",
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-format-string" }],
    },
    {
      code: "logger.info(someObjectProbably, notAMessage);",
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-no-message" }],
    },
    {
      code: 'logger.info(someObjectProbably, "a message", extraParam);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-unused-interpolations" }],
    },
    {
      code: 'logger.info(someObjectProbably, "a message with %d params");',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-missing-interpolations" }],
    },
    {
      code: 'logger.info(someObjectProbably, "a message with %d params", 1, 2);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-unused-interpolations" }],
    },
    {
      code: 'logger.info(someObjectProbably, "a message with %d params %d", 1);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
      errors: [{ messageId: "logger-missing-interpolations" }],
    },
  ],
  valid: [
    {
      code: 'logger.info({ obj: "" });',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info({ obj: "" }, "message");',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info({ obj: "" }, "message %d", param);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info({ obj: "" }, "message %d %s", param, param2);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info("message");',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info("message %d", param);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: 'logger.info("message %d %s", param, param2);',
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: "logger.notALogMethod(`Can do ${whatever} you want`);",
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
    {
      code: "notALogger.info(`Can do ${whatever} you want`);",
      options: [{ loggerNames: ["logger"], logMethods: ["info"] }],
    },
  ],
});

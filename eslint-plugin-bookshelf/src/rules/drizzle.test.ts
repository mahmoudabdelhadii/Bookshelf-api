import { RuleTester } from "@typescript-eslint/rule-tester";
import { rule } from "./drizzle.js";
import { after, describe, it } from "node:test";

RuleTester.afterAll = after;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.describe = describe;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.it = it;

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("drizzle", rule, {
  invalid: [
    {
      code: "drizzle.transaction((tx) => drizzle.query.items.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(async (tx) => drizzle.query.items.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: `
        drizzle.transaction(async (tx) => {
          const items = await tx.items.findMany();
          return drizzle.players.findMany();
        });
      `,
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(function (tx) { return drizzle.query.items.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(function (tx) { return someSubFunction({ drizzle }) });",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
  ],
  valid: [
    {
      code: "drizzle.transaction(async (tx) => tx.query.items.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (tx) { return tx.query.items.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(async (drizzle) => drizzle.query.items.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (drizzle) { return drizzle.query.items.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.query.items.findMany();
        drizzle.transaction(async (tx) => tx.query.items.findMany());
        drizzle.query.items.findMany();
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.transaction(async (tx) => tx.query.items.findMany());
        drizzle.transaction(async (tx) => tx.query.items.findMany());
        drizzle.transaction(async (tx) => tx.query.items.findMany());
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.query.items.findMany();
        drizzle.transaction(async (drizzle) => drizzle.query.items.findMany());
        drizzle.query.items.findMany();
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (tx) { return someSubFunction({ drizzle: tx }) });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
  ],
});

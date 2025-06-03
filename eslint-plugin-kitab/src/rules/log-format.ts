import { AST_NODE_TYPES, ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type Options = { loggerNames: string[]; logMethods: string[] };

export const rule = ESLintUtils.RuleCreator.withoutDocs<
  [Options],
  | "logger-no-message"
  | "logger-format-string"
  | "logger-unused-interpolations"
  | "logger-missing-interpolations"
>({
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (node.callee.object.type !== AST_NODE_TYPES.Identifier) return;
        if (!context.options[0].loggerNames.includes(node.callee.object.name)) return;
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return;
        if (!context.options[0].logMethods.includes(node.callee.property.name)) return;
        if (!node.arguments.length) return;
        if (node.arguments[0].type === AST_NODE_TYPES.TemplateLiteral) {
          context.report({
            node: node.arguments[0],
            messageId: "logger-format-string",
          });
          return;
        }
        let messageParam: undefined | TSESTree.StringLiteral;
        let formatArguments = 0;
        if (
          node.arguments[0].type === AST_NODE_TYPES.Literal &&
          typeof node.arguments[0].value === "string"
        ) {
          messageParam = node.arguments[0];
          formatArguments = node.arguments.length - 1;
        } else if (node.arguments[1]) {
          if (node.arguments[1].type === AST_NODE_TYPES.TemplateLiteral) {
            context.report({ node: node.arguments[1], messageId: "logger-format-string" });
            return;
          }
          if (
            node.arguments[1].type === AST_NODE_TYPES.Literal &&
            typeof node.arguments[1].value === "string"
          ) {
            messageParam = node.arguments[1];
            formatArguments = node.arguments.length - 2;
          }
        }
        if (!messageParam) {
          if (node.arguments.length !== 1) {
            context.report({ node, messageId: "logger-no-message" });
          }
          return;
        }
        const formatPlaceholders = Array.from(messageParam.value.matchAll(/%[dsjoO]/g)).length;
        if (formatPlaceholders < formatArguments) {
          context.report({ node: messageParam, messageId: "logger-unused-interpolations" });
        } else if (formatPlaceholders > formatArguments) {
          context.report({ node: messageParam, messageId: "logger-missing-interpolations" });
        }
      },
    };
  },
  meta: {
    docs: {
      description: "Logs through Pino should be formatted using the appropriate arguments",
    },
    messages: {
      "logger-no-message": "Logging calls must have a message",
      "logger-format-string": "Format string should be preferred over direct interpolation",
      "logger-unused-interpolations": "Extra arguments were passed without placeholders in the message",
      "logger-missing-interpolations": "Placeholders in the message do not have corresponding arguments",
    },
    type: "suggestion",
    schema: [
      {
        type: "object",
        properties: {
          loggerNames: {
            type: "array",
            items: { type: "string" },
          },
          logMethods: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
  },
  defaultOptions: [
    {
      loggerNames: ["logger"],
      logMethods: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
    },
  ],
});

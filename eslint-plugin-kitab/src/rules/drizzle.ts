import { AST_NODE_TYPES, ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type Options = { drizzleNames: string[] };

const CALLABLE = [AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression];

export const rule = ESLintUtils.RuleCreator.withoutDocs<[Options], "drizzle-client-in-transaction">({
  create(context) {
    let transactionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | undefined;
    let validName: string | undefined;
    let isIn = false;

    return {
      CallExpression(node) {
        if (transactionNode) return;
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (node.callee.object.type !== AST_NODE_TYPES.Identifier) return;
        if (!context.options[0].drizzleNames.includes(node.callee.object.name)) return;
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return;
        if (node.callee.property.name !== "transaction") return;
        if (!node.arguments.length) return;
        if (!CALLABLE.includes(node.arguments[0].type)) return; // NOTE: could report "possibly unsafe transaction" here?
        const fn = node.arguments[0] as TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
        transactionNode = fn;
        if (fn.params[0].type === AST_NODE_TYPES.Identifier) {
          validName = fn.params[0].name;
        }
      },
      ArrowFunctionExpression(node) {
        if (node === transactionNode) {
          isIn = true;
        }
      },
      "ArrowFunctionExpression:exit"(node) {
        if (node === transactionNode) {
          isIn = false;
          transactionNode = undefined;
          validName = undefined;
        }
      },
      FunctionExpression(node) {
        if (node === transactionNode) isIn = true;
      },
      "FunctionExpression:exit"(node) {
        if (node === transactionNode) {
          isIn = false;
          transactionNode = undefined;
          validName = undefined;
        }
      },
      Identifier(node) {
        if (!isIn) return;
        if (node.parent.type === AST_NODE_TYPES.Property && node.parent.key === node) return;
        if (context.options[0].drizzleNames.includes(node.name) && (!validName || node.name !== validName)) {
          context.report({ node, messageId: "drizzle-client-in-transaction" });
        }
      },
    };
  },
  meta: {
    docs: {
      description: "Enforces safe usage of the Drizzle client",
    },
    messages: {
      "drizzle-client-in-transaction": "Bare Drizzle client should not be used inside of a `transaction`",
    },
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          drizzleNames: { type: "array", items: { type: "string" } },
        },
      },
    ],
  },
  defaultOptions: [
    {
      drizzleNames: ["drizzle"],
    },
  ],
});

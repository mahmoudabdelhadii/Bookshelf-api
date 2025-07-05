import globals from "globals";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginKitab from "eslint-plugin-kitab";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";

function config(...configs) {
  return tsEslint.config(
    {
      ignores: [
        "**/.DS_Store",
        "**/node_modules",
        "**/build",
        "**/dist",
        "**/public",
        "**/out",
        "**/.svelte-kit",
        "**/.env",
        "**/.env.*",
        "!**/.env.example",
        "**/package-lock.json",
        "**/src/server/routes.ts",
        "**/src/server/swagger.json",
        "*.js",
        "*.cjs",
        "*.mjs",
        ".venv",
      ],
    },

    // Base and TS rules
    eslint.configs.recommended,
    eslintPluginImport.flatConfigs.recommended,
    eslintPluginImport.flatConfigs.typescript,
    ...tsEslint.configs.strictTypeChecked,
    ...tsEslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    eslintPluginKitab.configs.recommended,

    // Main ruleset
    {
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        globals: {
          ...globals.builtin,
          ...globals.node,
        },
      },
      plugins: {
        unicorn: eslintPluginUnicorn,
        "unused-imports": eslintPluginUnusedImports,
      },
      rules: {
        // ESLint core
        "no-console": "warn",
        "dot-notation": "error",
        "prefer-const": "warn",
        "prefer-template": "warn",
        "no-var": "error",
        "no-useless-return": "error",
        "no-useless-rename": "error",
        "no-useless-computed-key": "error",
        "no-else-return": "error",
        "no-alert": "error",
        "no-lonely-if": "error",
        "no-nested-ternary": "error",
        "object-shorthand": "error",
        quotes: ["error", "double", { avoidEscape: true }],
        yoda: "error",
        eqeqeq: "error",

        // TypeScript
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          {
            allowNumber: true,
            allowBoolean: true,
          },
        ],
        "@typescript-eslint/naming-convention": [
          "error",
          {
            selector: "default",
            format: null,
          },
          {
            selector: "enumMember",
            format: ["StrictPascalCase"],
          },
        ],
        "@typescript-eslint/no-unused-vars": "off",

        // Unused imports plugin
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
          "warn",
          {
            vars: "all",
            varsIgnorePattern: "^_",
            args: "after-used",
            argsIgnorePattern: "^_",
          },
        ],

        // Unicorn
        "unicorn/catch-error-name": ["error", { name: "err" }],
        "unicorn/no-array-for-each": "error",
        "unicorn/no-instanceof-array": "error",
        "unicorn/prefer-node-protocol": "error",

        // Import plugin
        "import-x/no-relative-packages": "error",

        // Naming
        "id-denylist": ["error", "idx"],
        "spaced-comment": "error",
      },
    },

    ...configs,
  );
}

export default { config };

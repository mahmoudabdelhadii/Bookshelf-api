import globals from "globals";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginKitab from "eslint-plugin-kitab";

function config(...configs) {
  return tsEslint.config(
    eslint.configs.recommended,
    eslintPluginImport.flatConfigs.recommended,
    eslintPluginImport.flatConfigs.typescript,
    ...tsEslint.configs.strictTypeChecked,
    ...tsEslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    eslintPluginKitab.configs.recommended,
    {
      languageOptions: {
        globals: globals.builtin,
      },
      plugins: {
        unicorn: eslintPluginUnicorn,
      },
      rules: {
        "unicorn/catch-error-name": ["error", { name: "err" }],
        "unicorn/no-array-for-each": ["error"],
        "unicorn/no-instanceof-array": ["error"],
        "unicorn/prefer-node-protocol": ["error"],
      },
    },
    {
      rules: {
        "no-console": "warn",
        "id-denylist": ["error", "idx"],
        "dot-notation": "error",
        "spaced-comment": "error",
        "prefer-template": "warn",
        "prefer-const": "warn",
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
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          {
            allowNumber: true,
            allowBoolean: true,
          },
        ],
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
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
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { varsIgnorePattern: "^_.*", argsIgnorePattern: "^_.*" },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
        "import-x/no-relative-packages": ["error"],
      },
    },
    {
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        globals: { ...globals.node },
      },
    },
    {
      ignores: [
        "**/.DS_Store",
        "**/node_modules",
        "**/build",
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
    ...configs,
  );
}

export default { config };

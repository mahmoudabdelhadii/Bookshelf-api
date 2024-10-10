module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  reportUnusedDisableDirectives: true,
  plugins: ["@typescript-eslint", "import"],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"],
    },
    "import/resolver": {
      typescript: { alwaysTryTypes: true },
    },
  },
  env: { es2021: true },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/strict-type-checked",
    "prettier",
    "plugin:bookshelf/recommended",
  ],
  rules: {
    "no-console": "error",
    "id-denylist": ["error", "idx"],
    "dot-notation": "error",
    "spaced-comment": "error",
    "prefer-template": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-useless-return": "error",
    "no-useless-rename": "error",
    "no-useless-computed-key": "error",
    "no-else-return": "error",
    "no-alert": "error",
    "no-undef": "off",
    "no-lonely-if": "error",
    "no-nested-ternary": "error",
    "object-shorthand": "error",
    quotes: ["error", "double", { avoidEscape: true }],
    yoda: "warn",
    eqeqeq: "error",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-empty-function": "off",
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
    "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_.*", argsIgnorePattern: "^_.*" }],
  },
  overrides: [
    {
      files: ["build/**/*.js"], // Exclude the build folder
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
};

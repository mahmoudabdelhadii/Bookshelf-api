import kitabEslintConfig from "../eslint.config.js";

export default kitabEslintConfig.config(
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    ignores: ["src/seedtypes.ts", "src/schematypes.ts", "drizzle.config.ts"],
  },
);
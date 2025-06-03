import kitabEslintConfig from "../eslint.config.js";

export default kitabEslintConfig.config(
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["src/seedtypes.ts", "src/schematypes.ts", "drizzle.config.ts"],
  },
);

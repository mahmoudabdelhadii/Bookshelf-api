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
  );

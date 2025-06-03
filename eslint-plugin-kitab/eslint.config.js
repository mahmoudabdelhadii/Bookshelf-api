import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
import kitabEslintConfig from "../eslint.config.js";

export default kitabEslintConfig.config(eslintPluginEslintPlugin.configs["flat/recommended"], {
  ignores: ["dist", "node_modules"],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});

module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier', '@typescript-eslint', 'prettier-plugin-tailwindcss'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json', // Ensure this path is correct based on your project structure
    tsconfigRootDir: __dirname, // Points ESLint to the root directory of your project
  },
};

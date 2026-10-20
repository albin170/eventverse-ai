export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "tests/e2e/**", "*.config.js", "*.config.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }]
    }
  }
];

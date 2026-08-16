import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@next/next": nextPlugin },
    rules: { "@next/next/no-img-element": "warn" },
  },
  globalIgnores([".next/**", "node_modules/**", ".npm-cache/**"]),
]);

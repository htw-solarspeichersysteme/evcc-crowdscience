// @ts-check

import eslint from "@eslint/js";
import pluginRouter from "@tanstack/eslint-plugin-router";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  pluginRouter.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      // "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/only-throw-error": "off",
      // "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "off",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      // "drizzle/enforce-delete-with-where": [
      //   "error",
      //   {
      //     drizzleObjectName: ["db", "ctx.db"],
      //   },
      // ],
      // "drizzle/enforce-update-with-where": [
      //   "error",
      //   {
      //     drizzleObjectName: ["db", "ctx.db"],
      //   },
      // ],
    },
  },
);

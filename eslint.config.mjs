import jaypie from "@jaypie/eslint";
import globals from "globals";

export default [
  ...jaypie,
  {
    ignores: ["**/dist/**", "var/**"],
  },
  {
    // The app package runs in the browser: DOM globals, not Node.
    files: ["packages/app/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // The CLI prints to stdout by design.
    files: ["packages/cli/src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // vitest accepts a message as expect's second argument; the specs use it
    // to name the rendering or chapter under test.
    files: ["packages/*/src/**/__tests__/**/*.ts"],
    rules: {
      "vitest/valid-expect": ["error", { maxArgs: 2 }],
    },
  },
];

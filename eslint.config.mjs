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
];

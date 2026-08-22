/**
 * Model ids, mirrored from @jaypie/llm's `LLM.MODEL` as plain literals.
 *
 * Why mirror rather than import: `@jaypie/llm` is a Node runtime — it pulls
 * in the AWS SDK, `fs/promises`, and `module` — and this module is reachable
 * from browser bundles (the app's client components import
 * `@modelstudies/survey`). Importing the real
 * constant breaks `next build` with "Module not found" for every Node
 * builtin behind it.
 *
 * The tradeoff is drift, which is exactly the failure these ids had before.
 * `__tests__/models.spec.ts` pins every value here to its `LLM.MODEL`
 * counterpart and runs in Node, where the import is free — so a Jaypie
 * model bump fails CI loudly instead of shipping a stale id quietly.
 */
export const MODELS = {
  // Anthropic
  OPUS: "claude-opus-5",
  SONNET: "claude-sonnet-5",
  // OpenAI
  SOL: "gpt-5.6-sol",
  LUNA: "gpt-5.6-luna",
  // Google
  GEMINI_FLASH: "gemini-3.7-flash",
  GEMINI_FLASH_LITE: "gemini-3.5-flash-lite",
  // xAI
  GROK: "grok-4.6",
  // Open weights, served through Fireworks (the four fielded: DeepSeek, GLM, Kimi, Qwen)
  FIREWORKS_DEEPSEEK: "accounts/fireworks/models/deepseek-v4-pro",
  FIREWORKS_GLM: "accounts/fireworks/models/glm-5p2",
  FIREWORKS_KIMI: "accounts/fireworks/models/kimi-k3",
  FIREWORKS_QWEN: "accounts/fireworks/models/qwen3p7-plus",
} as const;

export type ModelName = keyof typeof MODELS;

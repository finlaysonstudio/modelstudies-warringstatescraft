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
  HAIKU: "claude-haiku-4-5",
  // OpenAI
  SOL: "gpt-5.6-sol",
  TERRA: "gpt-5.6-terra",
  LUNA: "gpt-5.6-luna",
  // Google
  GEMINI_PRO: "gemini-3.1-pro-preview",
  GEMINI_FLASH: "gemini-3.6-flash",
  GEMINI_FLASH_LITE: "gemini-3.5-flash-lite",
  // xAI
  GROK: "grok-4.5",
  // Open weights, served through Fireworks
  FIREWORKS_DEEPSEEK: "accounts/fireworks/models/deepseek-v4-pro",
  FIREWORKS_GLM: "accounts/fireworks/models/glm-5p2",
  FIREWORKS_GPT_OSS: "accounts/fireworks/models/gpt-oss-120b",
  FIREWORKS_KIMI: "accounts/fireworks/models/kimi-k3",
  FIREWORKS_MINIMAX: "accounts/fireworks/models/minimax-m2p7",
  FIREWORKS_QWEN: "accounts/fireworks/models/qwen3p7-plus",
  // Mistral
  MISTRAL_LARGE: "mistral-large-latest",
  // OpenRouter proxy routes
  OPENROUTER_GLM: "z-ai/glm-5.2",
} as const;

export type ModelName = keyof typeof MODELS;

/**
 * @modelstudies/workflows — composition graph engine, LlmClient and Store
 * seams, and the provider selector shared by every LLM-calling package.
 */

// Composition public surface
export * from "./composition";

// Registry and in-process nested call resolution
export {
  clearCompositions,
  getComposition,
  listCompositions,
  nestedCallResolver,
  registerComposition,
} from "./registry";

// LlmClient seam and the default Jaypie-backed implementation
export type {
  LlmClient,
  LlmOperateOptions,
  LlmOperateResult,
  LlmTurn,
  LlmUsage,
  LlmUsageItem,
} from "./llm/client";
export { createLlmClient, defaultLlmClient } from "./llm/jaypieClient";
export {
  createLegacyOpenAiClient,
  isLegacyOpenAiModel,
  LEGACY_OPENAI_MODELS,
} from "./llm/legacyOpenAiClient";

// Pricing: list price per model and the per-call dollar stamp
export {
  billableTokens,
  MODEL_PRICES,
  priceOf,
  priceUsage,
  type ModelPrice,
} from "./llm/pricing";

// Provider selection seam over @jaypie/llm
export {
  LLM_PROVIDER_NAMES,
  llmSelector,
  toLlmHistory,
  toLlmProvider,
  type LlmChatMessage,
  type LlmProviderName,
} from "./llm/providers";

// Persistence seam
export {
  calculateScope,
  FileStore,
  type Entity,
  type EntityLike,
  type Store,
} from "./store/store";

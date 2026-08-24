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
export {
  createLlmClient,
  defaultLlmClient,
  type CreateLlmClientOptions,
} from "./llm/jaypieClient";
export {
  classifyRetry,
  DEFAULT_RETRY,
  retryDelay,
  withRetry,
  type RetryAttempt,
  type RetryOptions,
  type RetryReason,
  type RetryVerdict,
} from "./llm/retry";
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

// Persistence seams: entities as full puts, journals as appended events
export {
  calculateScope,
  FileStore,
  type Entity,
  type EntityLike,
  type Store,
} from "./store/store";
export {
  FileJournal,
  MemoryJournal,
  parseJournal,
  type Journal,
  type JournalEvent,
  type JournalRead,
} from "./store/journal";

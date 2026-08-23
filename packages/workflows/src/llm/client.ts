/**
 * LlmClient — the seam every LLM-calling module takes by injection.
 * Interface only; the default Jaypie-backed implementation lives in
 * ./jaypieClient.ts so tests and browser code never import @jaypie/llm.
 */

export interface LlmTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LlmOperateOptions {
  /** JSON schema for structured output; result.content is the parsed object */
  format?: Record<string, unknown>;
  history?: LlmTurn[];
  model?: string;
  provider?: string;
  system?: string;
}

/**
 * One model call's token accounting as the provider reported it (mirrors
 * `@jaypie/llm`'s `LlmUsageItem`, plus `usd`). Provider semantics differ:
 * Anthropic's `input` excludes cache reads and its `output` includes thinking;
 * OpenAI-compatible providers (OpenAI, xAI, Fireworks) count cache reads inside
 * `input` and reasoning inside `output`; Google reports `reasoning` beside
 * `output`. `priceUsage` in ./pricing.ts carries those rules.
 */
export interface LlmUsageItem {
  input: number;
  output: number;
  reasoning: number;
  total: number;
  cacheRead?: number;
  cacheWrite?: number;
  provider?: string;
  model?: string;
  /**
   * list-price dollars for this call at the time it was made (the price
   * the call was actually billed at); absent when the model is unpriced
   */
  usd?: number;
}

export type LlmUsage = LlmUsageItem[];

export interface LlmOperateResult {
  content: unknown;
  history?: unknown;
  /** one item per model call the operation made, priced */
  usage?: LlmUsage;
}

export interface LlmClient {
  operate(
    prompt: string,
    options?: LlmOperateOptions,
  ): Promise<LlmOperateResult>;
}

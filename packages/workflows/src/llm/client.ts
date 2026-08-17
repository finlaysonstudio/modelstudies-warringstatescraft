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

export interface LlmOperateResult {
  content: unknown;
  history?: unknown;
}

export interface LlmClient {
  operate(
    prompt: string,
    options?: LlmOperateOptions,
  ): Promise<LlmOperateResult>;
}

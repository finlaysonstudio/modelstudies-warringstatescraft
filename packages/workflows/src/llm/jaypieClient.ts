/**
 * Default Jaypie-backed {@link LlmClient}: wraps `Llm.operate` from
 * `@jaypie/llm`, routing model/provider hints through {@link llmSelector} and
 * converting `LlmTurn[]` history via {@link toLlmHistory}. Mirrors how the
 * upstream `chat` and `interviews` services call `Llm.operate`
 * (options shape: `{ model, system?, format?, history?, llm? }`).
 */
import { Llm } from "@jaypie/llm";
import type { LlmClient, LlmOperateOptions, LlmOperateResult } from "./client";
import { llmSelector, toLlmHistory } from "./providers";

type JaypieOperateOptions = NonNullable<Parameters<typeof Llm.operate>[1]>;
type JaypieHistory = NonNullable<JaypieOperateOptions["history"]>;

/**
 * History arrives two ways: simple {role, content} turns (converted and
 * validated) or a provider-native LlmHistory previously returned by
 * `Llm.operate` (recognized by non-plain entries — e.g. a `type` field or
 * non-string content — and passed through untouched, since providers may
 * return structured content that toLlmHistory would reject).
 */
function normalizeHistory(
  history: NonNullable<LlmOperateOptions["history"]>,
): JaypieHistory {
  const isPlainTurn = (entry: unknown): boolean => {
    if (typeof entry !== "object" || entry === null) return false;
    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.content === "string" &&
      (candidate.role === "user" || candidate.role === "assistant") &&
      !("type" in candidate)
    );
  };
  if (history.every(isPlainTurn)) {
    return toLlmHistory(history);
  }
  return history as unknown as JaypieHistory;
}

export function createLlmClient(
  defaults: { model?: string; provider?: string } = {},
): LlmClient {
  return {
    async operate(
      prompt: string,
      options: LlmOperateOptions = {},
    ): Promise<LlmOperateResult> {
      // llmSelector throws BadRequestError on an unknown provider
      const operateOptions: JaypieOperateOptions = {
        ...llmSelector({
          model: options.model ?? defaults.model,
          provider: options.provider ?? defaults.provider,
        }),
        ...(options.system && { system: options.system }),
        ...(options.format && {
          format: options.format as JaypieOperateOptions["format"],
        }),
        ...(options.history && { history: normalizeHistory(options.history) }),
      };
      const response = await Llm.operate(prompt, operateOptions);
      return { content: response.content, history: response.history };
    },
  };
}

export const defaultLlmClient: LlmClient = createLlmClient();

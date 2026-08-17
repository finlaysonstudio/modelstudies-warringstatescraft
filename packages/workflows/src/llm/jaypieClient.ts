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
        ...(options.history && { history: toLlmHistory(options.history) }),
      };
      const response = await Llm.operate(prompt, operateOptions);
      return { content: response.content, history: response.history };
    },
  };
}

export const defaultLlmClient: LlmClient = createLlmClient();

/**
 * Default Jaypie-backed {@link LlmClient}: wraps `Llm.operate` from
 * `@jaypie/llm`, routing model/provider hints through {@link llmSelector} and
 * converting `LlmTurn[]` history via {@link toLlmHistory}. Mirrors how the
 * upstream `chat` and `interviews` services call `Llm.operate`
 * (options shape: `{ model, system?, format?, history?, llm? }`).
 * Every call requests `effort: highest`; adapters translate it per provider
 * and ignore it where a model has no reasoning control. A legacy OpenAI model
 * id (`isLegacyOpenAiModel`) bypasses Jaypie for the Chat Completions client,
 * the only path those models answer a `format` on. Both paths sit under one
 * outer {@link withRetry} (`retry: false` removes it): `Llm.operate` and the
 * legacy client each retry inside their own budget, and the wrapper covers
 * the outage that outlasts it.
 */
import { LLM, Llm } from "@jaypie/llm";
import type { LlmClient, LlmOperateOptions, LlmOperateResult } from "./client";
import {
  createLegacyOpenAiClient,
  isLegacyOpenAiModel,
} from "./legacyOpenAiClient";
import { priceUsage } from "./pricing";
import { llmSelector, toLlmHistory } from "./providers";
import { withRetry, type RetryOptions } from "./retry";

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

export interface CreateLlmClientOptions {
  model?: string;
  provider?: string;
  /** outer retry over both paths; `false` leaves only the clients' own loops */
  retry?: RetryOptions | false;
}

interface ToolUseBlock {
  type?: string;
  name?: string;
  input?: unknown;
  arguments?: unknown;
  function?: { name?: string; arguments?: unknown };
}

const STRUCTURED_OUTPUT_TOOL = "structured_output";

const parseArguments = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
};

const structuredCallOf = (block: ToolUseBlock): unknown => {
  if (block.name === STRUCTURED_OUTPUT_TOOL) {
    return parseArguments(block.input ?? block.arguments);
  }
  if (block.function?.name === STRUCTURED_OUTPUT_TOOL) {
    return parseArguments(block.function.arguments);
  }
  return undefined;
};

/**
 * Jaypie's legacy `structured_output` tool emulation can return a reply whose
 * only block is that tool call while `content` stays undefined (seen on
 * claude-sonnet-5 once the runtime has cached the native output_config
 * rejection: the response is read on the native path, which expects a text
 * block). The call's input is the structured reply, so a format request
 * recovers it from the raw provider responses rather than reporting an empty
 * reply. Anthropic blocks (`content[].type === "tool_use"`), OpenAI
 * Responses items (`output[].type === "function_call"`), and Chat
 * Completions tool calls (`choices[].message.tool_calls[]`) are read; the
 * last structured call wins.
 */
export const recoverStructuredOutput = (response: unknown): unknown => {
  const raw = (response as { responses?: unknown[] } | null)?.responses;
  if (!Array.isArray(raw)) return undefined;
  let found: unknown;
  for (const entry of raw) {
    const item = entry as {
      content?: ToolUseBlock[];
      output?: ToolUseBlock[];
      choices?: { message?: { tool_calls?: ToolUseBlock[] } }[];
    } | null;
    const blocks: ToolUseBlock[] = [
      ...(Array.isArray(item?.content) ? item.content : []),
      ...(Array.isArray(item?.output) ? item.output : []),
      ...(Array.isArray(item?.choices)
        ? item.choices.flatMap((choice) => choice?.message?.tool_calls ?? [])
        : []),
    ];
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const value = structuredCallOf(block);
      if (value !== undefined && value !== null && typeof value === "object") {
        found = value;
      }
    }
  }
  return found;
};

export function createLlmClient(
  defaults: CreateLlmClientOptions = {},
): LlmClient {
  const legacy = createLegacyOpenAiClient();
  const client: LlmClient = {
    async operate(
      prompt: string,
      options: LlmOperateOptions = {},
    ): Promise<LlmOperateResult> {
      const model = options.model ?? defaults.model;
      if (isLegacyOpenAiModel(model)) {
        return legacy.operate(prompt, { ...options, model });
      }
      // llmSelector throws BadRequestError on an unknown provider
      const operateOptions: JaypieOperateOptions = {
        ...llmSelector({
          model,
          provider: options.provider ?? defaults.provider,
        }),
        effort: LLM.EFFORT.HIGHEST,
        ...(options.system && { system: options.system }),
        ...(options.format && {
          format: options.format as JaypieOperateOptions["format"],
        }),
        ...(options.history?.length && {
          history: normalizeHistory(options.history),
        }),
      };
      const response = await Llm.operate(prompt, operateOptions);
      const content =
        response.content === undefined && options.format
          ? recoverStructuredOutput(response)
          : response.content;
      return {
        content,
        history: response.history,
        ...(response.usage?.length
          ? { usage: priceUsage(response.usage) }
          : {}),
      };
    },
  };
  return defaults.retry === false
    ? client
    : withRetry(client, defaults.retry ?? {});
}

export const defaultLlmClient: LlmClient = createLlmClient();

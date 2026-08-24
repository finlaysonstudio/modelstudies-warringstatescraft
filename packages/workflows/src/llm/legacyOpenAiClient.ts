/**
 * Legacy OpenAI {@link LlmClient}: the Lamparth-era OpenAI models
 * (`gpt-4-0613`, `gpt-3.5-turbo-*`) predate structured output. The Responses
 * API rejects `text.format: json_schema` for them and silently ignores tools
 * on `gpt-4-0613`, so `@jaypie/llm`'s OpenAI adapter cannot drive them. This
 * client speaks Chat Completions, the API the paper's repo called, and
 * satisfies a `format` request with a forced function call, which both
 * generations honor. No temperature is sent (the API default, 1.0, is what
 * the paper's `create_chat` used and what the Jaypie path sends for the
 * other OpenAI subjects). A reply whose function arguments are not JSON comes
 * back as the raw string so the caller's own validation (`validateChoices`
 * and the retry loop in `elicitBrief`) sees an invalid reply rather than a
 * thrown call.
 */
import {
  BadGatewayError,
  ConfigurationError,
  TooManyRequestsError,
  UnavailableError,
} from "@jaypie/errors";

import type {
  LlmClient,
  LlmOperateOptions,
  LlmOperateResult,
  LlmUsageItem,
} from "./client";
import { priceUsage } from "./pricing";

/**
 * OpenAI chat model ids that lack native structured output. `gpt-4` and
 * `gpt-3.5-turbo*` are API aliases the response names by snapshot
 * (`gpt-4-0613`, `gpt-3.5-turbo-0125`), and usage is stamped with the
 * snapshot the response reports.
 */
export const LEGACY_OPENAI_MODELS: readonly string[] = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k",
  "gpt-4",
  "gpt-4-0613",
];

export const isLegacyOpenAiModel = (model?: string): boolean =>
  !!model && LEGACY_OPENAI_MODELS.includes(model.trim());

export const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

const PROVIDER = "openai";
const RESPONSE_TOOL = "response";
const RETRIES = 3;
const RETRY_BASE_MS = 2_000;

export interface LegacyOpenAiClientOptions {
  /** defaults to `process.env.OPENAI_API_KEY`, read at call time */
  apiKey?: string;
  /** injectable for tests */
  fetch?: typeof fetch;
  /** injectable for tests; defaults to a backoff sleep */
  sleep?: (ms: number) => Promise<void>;
  url?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  model?: string;
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: { function?: { name?: string; arguments?: string } }[];
    };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string; code?: string };
}

/** the JSON schema a `format` carries: bare, or wrapped as `{ name, schema }` */
const schemaOf = (
  format: Record<string, unknown>,
): { name: string; schema: Record<string, unknown> } => {
  const wrapped = format.schema;
  if (
    format.type !== "object" &&
    typeof wrapped === "object" &&
    wrapped !== null
  ) {
    return {
      name: typeof format.name === "string" ? format.name : RESPONSE_TOOL,
      schema: wrapped as Record<string, unknown>,
    };
  }
  return { name: RESPONSE_TOOL, schema: format };
};

const messagesOf = (
  prompt: string,
  options: LlmOperateOptions,
): ChatMessage[] => [
  ...(options.system
    ? [{ role: "system" as const, content: options.system }]
    : []),
  ...(options.history ?? []).map((turn) => ({
    role: turn.role,
    content: turn.content,
  })),
  { role: "user", content: prompt },
];

const usageOf = (
  response: ChatCompletionResponse,
  model: string,
): LlmUsageItem[] => {
  const usage = response.usage;
  if (!usage) return [];
  const input = usage.prompt_tokens ?? 0;
  const output = usage.completion_tokens ?? 0;
  const cacheRead = usage.prompt_tokens_details?.cached_tokens;
  return [
    {
      input,
      output,
      reasoning: 0,
      total: usage.total_tokens ?? input + output,
      ...(cacheRead ? { cacheRead } : {}),
      provider: PROVIDER,
      model: response.model ?? model,
    },
  ];
};

/**
 * Repair the JSON defects `gpt-4-0613` produces in function arguments:
 * trailing commas before a closing bracket, raw control characters inside
 * strings, and a reply cut off mid-string or mid-object (the string and every
 * open bracket are closed). Anything else still fails the parse and the raw
 * string is returned for the caller's own validation to reject.
 */
export const repairJson = (text: string): string => {
  const CONTROL: Record<string, string> = {
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
  };
  let out = "";
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (inString) {
      if (escaped) {
        out += char;
        escaped = false;
      } else if (char === "\\") {
        out += char;
        escaped = true;
      } else if (char === '"') {
        out += char;
        inString = false;
      } else if (char < " ") {
        out +=
          CONTROL[char] ??
          `\\u${char.codePointAt(0)!.toString(16).padStart(4, "0")}`;
      } else {
        out += char;
      }
      continue;
    }
    if (char === '"') {
      out += char;
      inString = true;
    } else if (char === "{" || char === "[") {
      out += char;
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      // drop a trailing comma the model left before the close
      out = out.replace(/,\s*$/, "");
      out += char;
      stack.pop();
    } else {
      out += char;
    }
  }
  if (escaped) out = out.slice(0, -1);
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop();
  return out;
};

const contentOf = (
  response: ChatCompletionResponse,
  structured: boolean,
): unknown => {
  const message = response.choices?.[0]?.message;
  if (structured) {
    const args = message?.tool_calls?.[0]?.function?.arguments;
    if (typeof args !== "string") return message?.content ?? "";
    try {
      return JSON.parse(args);
    } catch {
      try {
        return JSON.parse(repairJson(args));
      } catch {
        return args;
      }
    }
  }
  return message?.content ?? "";
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createLegacyOpenAiClient(
  clientOptions: LegacyOpenAiClientOptions = {},
): LlmClient {
  const url = clientOptions.url ?? OPENAI_CHAT_COMPLETIONS_URL;
  const doFetch = clientOptions.fetch ?? fetch;
  const sleep = clientOptions.sleep ?? defaultSleep;
  return {
    async operate(
      prompt: string,
      options: LlmOperateOptions = {},
    ): Promise<LlmOperateResult> {
      const apiKey = clientOptions.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new ConfigurationError("OPENAI_API_KEY is not set");
      }
      const model = options.model?.trim();
      if (!model) {
        throw new ConfigurationError("legacy OpenAI client needs a model id");
      }
      const body: Record<string, unknown> = {
        model,
        messages: messagesOf(prompt, options),
      };
      if (options.format) {
        const { name, schema } = schemaOf(options.format);
        body.tools = [
          {
            type: "function",
            function: {
              name,
              description: "Return the structured response.",
              parameters: schema,
            },
          },
        ];
        body.tool_choice = { type: "function", function: { name } };
      }
      const response = await postWithRetry({
        body,
        apiKey,
        doFetch,
        sleep,
        url,
      });
      const content = contentOf(response, !!options.format);
      const usage = usageOf(response, model);
      return {
        content,
        ...(usage.length ? { usage: priceUsage(usage) } : {}),
      };
    },
  };
}

const postWithRetry = async ({
  apiKey,
  body,
  doFetch,
  sleep,
  url,
}: {
  apiKey: string;
  body: Record<string, unknown>;
  doFetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  url: string;
}): Promise<ChatCompletionResponse> => {
  for (let attempt = 0; ; attempt++) {
    const result = await doFetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await result.text();
    let parsed: ChatCompletionResponse = {};
    try {
      parsed = JSON.parse(text) as ChatCompletionResponse;
    } catch {
      // a non-JSON body reads as an upstream fault below
    }
    if (result.ok && parsed.choices) return parsed;
    const detail = parsed.error?.message ?? text.slice(0, 200);
    // an exhausted balance is a 429 no backoff will cure
    const quota = parsed.error?.code === "insufficient_quota";
    const retryable = !quota && (result.status === 429 || result.status >= 500);
    if (retryable && attempt < RETRIES) {
      await sleep(RETRY_BASE_MS * 2 ** attempt);
      continue;
    }
    // the marker is what `classifyRetry` reads to refuse a further wait
    if (result.status === 429) {
      throw new TooManyRequestsError(
        quota ? `insufficient_quota: ${detail}` : detail,
      );
    }
    if (result.status >= 500) throw new UnavailableError(detail);
    throw new BadGatewayError(`OpenAI ${result.status}: ${detail}`);
  }
};

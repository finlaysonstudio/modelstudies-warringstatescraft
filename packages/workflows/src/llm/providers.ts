/**
 * The seam between this repo's callers and `@jaypie/llm`: which provider name
 * a caller may say, how a model id and a provider hint become routing options,
 * and how a `{ role, content }` conversation becomes an `LlmHistory`. Shared
 * by the `chat` service and the app's chat routes so the two agree.
 */
import { LLM, LlmMessageRole, LlmMessageType } from "@jaypie/llm";
import type { LlmHistory } from "@jaypie/llm";
import { BadRequestError } from "@jaypie/errors";

/**
 * Provider names this repo's callers use, mapped to the names `@jaypie/llm`
 * routes on. Jaypie calls Google's provider "google"; the app clients, the
 * decision model, and the CLI all say "gemini".
 */
export const LLM_PROVIDER_NAMES = {
  anthropic: LLM.PROVIDER.ANTHROPIC.NAME,
  bedrock: LLM.PROVIDER.BEDROCK.NAME,
  fireworks: LLM.PROVIDER.FIREWORKS.NAME,
  gemini: LLM.PROVIDER.GOOGLE.NAME,
  google: LLM.PROVIDER.GOOGLE.NAME,
  mistral: LLM.PROVIDER.MISTRAL.NAME,
  openai: LLM.PROVIDER.OPENAI.NAME,
  openrouter: LLM.PROVIDER.OPENROUTER.NAME,
  xai: LLM.PROVIDER.XAI.NAME,
} as const;

export type LlmProviderName =
  (typeof LLM_PROVIDER_NAMES)[keyof typeof LLM_PROVIDER_NAMES];

// Providers Jaypie routes to by an explicit `<provider>:<model>` prefix. Their
// model ids carry no signal of their own — an OpenRouter route to an OpenAI
// model reads as an OpenAI id — and `Llm.operate` silently drops a `model`
// whose derived provider disagrees with a `llm` option, so the prefix is the
// only way a provider hint survives alongside a model id.
const PREFIX_ROUTED: string[] = [
  LLM.PROVIDER.BEDROCK.NAME,
  LLM.PROVIDER.FIREWORKS.NAME,
  LLM.PROVIDER.OPENROUTER.NAME,
];

/**
 * Translate a caller-facing provider name into the Jaypie provider name.
 * Throws on anything unrecognized so an unknown provider reads as a caller
 * error rather than a configuration failure inside the loop.
 */
export function toLlmProvider(provider: string): LlmProviderName {
  const name =
    LLM_PROVIDER_NAMES[
      provider.trim().toLowerCase() as keyof typeof LLM_PROVIDER_NAMES
    ];
  if (!name) {
    throw new BadRequestError(
      `provider must be one of: ${Object.keys(LLM_PROVIDER_NAMES).join(", ")}`,
    );
  }
  return name;
}

/**
 * Resolve a model id and an optional provider hint into the routing options
 * `Llm.operate` takes. The model is the selector — Jaypie derives the provider
 * from the id — so the hint only picks the provider's default model when no
 * model is named, or qualifies an id for a provider that routes by prefix.
 */
export function llmSelector({
  model,
  provider,
}: { model?: string; provider?: string } = {}): {
  llm?: LlmProviderName;
  model?: string;
} {
  const id = model?.trim();
  const name = provider?.trim() ? toLlmProvider(provider) : undefined;
  if (!id) {
    return name ? { llm: name } : {};
  }
  if (name && PREFIX_ROUTED.includes(name) && !id.startsWith(`${name}:`)) {
    return { model: `${name}:${id}` };
  }
  return { model: id };
}

export interface LlmChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ROLES: string[] = [LlmMessageRole.Assistant, LlmMessageRole.User];

/**
 * Turn a caller's conversation into the history `Llm.operate`/`Llm.stream`
 * take. Rejects an empty or malformed array as a caller error rather than
 * letting a provider name the fault from inside the loop.
 */
export function toLlmHistory(messages: unknown): LlmHistory {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequestError("messages must be a non-empty array");
  }
  return messages.map((message: LlmChatMessage) => {
    if (
      !ROLES.includes(message?.role) ||
      typeof message?.content !== "string"
    ) {
      throw new BadRequestError(
        'each message must be {role: "user" | "assistant", content: String}',
      );
    }
    return {
      content: message.content,
      role: message.role as LlmMessageRole,
      type: LlmMessageType.Message,
    };
  });
}

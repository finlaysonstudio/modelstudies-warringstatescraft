/**
 * Model capabilities the callers of the seam have to route around. Today
 * that is one thing: whether a model can hold a multi-property JSON schema.
 *
 * The Lamparth-era OpenAI chat models predate structured output. The legacy
 * client (./legacyOpenAiClient.ts) satisfies a `format` request with a forced
 * Chat Completions function call, but that is not strict mode: `required` is
 * advisory and a missing key is not an API error. `gpt-3.5-turbo-0125`
 * flattens a two-array schema often enough to be unusable as a subject (a
 * probe against the move-two prompt of the Lamparth replication failed two
 * calls in three, both by describing the actions in prose inside `answers`
 * and omitting `choices`). Callers ask such a model in plain text and match
 * the reply themselves.
 *
 * `gpt-4-0613` stays on the schema path: it played 80 arms of study_a82834f2
 * with zero retries and zero unusable selections, and moving it would
 * invalidate a finished arm for no gain.
 *
 * The name is `ElicitationMode` rather than `Elicitation` because
 * `@modelstudies/game` already exports an `Elicitation` (`memo` | `choice`),
 * which is a property of a scenario rather than of a model.
 */

/** how a caller asks a model for a structured answer */
export type ElicitationMode = "schema" | "text";

export const ELICITATION_MODES: ElicitationMode[] = ["schema", "text"];

/** models asked in plain text because they cannot hold a schema */
export const TEXT_ELICITATION_MODELS: readonly string[] = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k",
];

export const elicitationFor = (model?: string): ElicitationMode =>
  model && TEXT_ELICITATION_MODELS.includes(model.trim()) ? "text" : "schema";

import { BadRequestError, NotFoundError } from "@jaypie/errors";
import {
  calculateScope,
  type Entity,
  type LlmClient,
  type LlmTurn,
  type Store,
} from "@modelstudies/workflows";
import { randomUUID } from "node:crypto";

import { buildInstrument, DEFAULT_PLAN, EXPLAIN_PROMPT } from "./instrument";
import { noopLog, type Logger } from "./log";
import { balancedOrders, seededShuffle, turnSeed } from "./order";
import { resolvePanel } from "./panel";
import type { Instrument, InstrumentPlan, SurveyItem } from "./types";

export const INTERVIEW_MODEL = "interview";

// Root scope for interview entities — they hang off the apex, and their
// probes hang off them.
export const APEX = "apex";

export const INTERVIEW_STATUSES = ["pending", "complete", "error"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const PROBE_MODEL = "probe";

export const PROBE_CATEGORY_EXPLANATION = "explanation";

// Deterministic id per (interview, item): a re-asked item on resume upserts
// its probe instead of stranding a duplicate.
export function probeId(scope: string, name: string): string {
  return `${scope}#${name}`;
}

// One item's answer, keyed by the instrument's item name so results stay
// joinable to the source bank.
export interface InterviewItemResponse {
  name: string;
  // Option code or numeric value; the mean of `values` on repetition runs;
  // null when declined
  value: number | null;
  // One code per repetition (null = non-conforming); present on LLM runs
  values?: (number | null)[];
  // The option labels as presented, one order per repetition — the record of
  // what the respondent actually saw, so a later probe can replay the turn
  // rather than re-ask it. Absent on open numeric items.
  orders?: string[][];
  declined?: boolean;
  // Verbatim non-conforming answer, kept for refusal analysis
  raw?: string;
  // Explain-mode follow-ups: one per repetition on LLM runs (null when the
  // follow-up produced no text)
  explanations?: (string | null)[];
}

// One administration of an instrument to one respondent model.
export interface InterviewEntity extends Entity {
  model: typeof INTERVIEW_MODEL;
  scope: string;
  // Instrument plan id, e.g. "model-values-96" — the comparison cohort this
  // sitting belongs to
  plan: string;
  // Who answered
  respondent: string;
  // The named roster this sitting was fielded to, when it was taken as
  // part of one (absent when the models were named directly)
  panel?: string;
  provider?: string;
  respondentModel?: string;
  // Times each item was asked (absent = 1)
  repetitions?: number;
  // Experimental condition, e.g. "reversed-options" | "randomized-options"
  condition?: string;
  // Explain mode: the follow-up prompt asked after each answer (absent =
  // explanations were not collected)
  explain?: string;
  // Language the sitting was requested in, when one was named
  language?: string;
  responses: Record<string, InterviewItemResponse>;
  answered: number;
  declined: number;
  remaining: number;
  status: InterviewStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// A follow-up question put to a respondent about one item of a parent
// sitting. Scoped to the parent interview id and named for the item it
// probes, so free text stays off the parent entity and loads as a scope
// query.
export interface ProbeEntity extends Entity {
  model: typeof PROBE_MODEL;
  // The parent interview's id
  scope: string;
  // What kind of probe: "explanation" for explain-mode follow-ups
  category: string;
  // The item probed, e.g. "t2" — joins the parent's responses key
  name: string;
  // The follow-up question asked, e.g. "Please explain your preference…"
  query: string;
  // One reply per repetition, index-aligned with the item response's
  // `values`; null when the follow-up produced no text
  responses: (string | null)[];
}

export interface ItemPresentationOptions {
  reverseOptions?: boolean;
  /** Seeded per-turn shuffle of option order; wins over reverseOptions. */
  shuffleSeed?: string;
  /** Explicit label order (balanced-random protocol); wins over both. */
  order?: string[];
}

export function orderedLabels(
  item: SurveyItem,
  options: ItemPresentationOptions,
): string[] {
  if (options.order !== undefined) return [...options.order];
  const labels = item.options.map((option) => option.label);
  if (options.shuffleSeed !== undefined) {
    return seededShuffle(labels, { seed: options.shuffleSeed });
  }
  if (options.reverseOptions) labels.reverse();
  return labels;
}

// One repetition's presentation: the question and its labeled choices as
// plain text — no numbers, no letters, no system prompt. Each item is asked
// in an independent conversation so earlier answers cannot anchor later ones.
export function itemPrompt(
  instrument: Instrument,
  item: SurveyItem,
  options: ItemPresentationOptions = {},
): string {
  const lines: string[] = [];
  const instruction = item.instruction ?? instrument.instruction;
  if (instruction) {
    lines.push(instruction, "");
  }
  lines.push(item.wording);
  if (item.options.length > 0) {
    lines.push("", ...orderedLabels(item, options));
  } else {
    lines.push(
      "",
      `Answer with a number between ${item.range[0]} and ${item.range[1]}.`,
    );
  }
  return lines.join("\n");
}

// operate() format contract: a JSON object whose response is one of the
// exact option labels ("Somewhat agree" — never a code or letter), or an
// in-range number for open items.
export function itemFormat(
  item: SurveyItem,
  options: ItemPresentationOptions = {},
): Record<string, unknown> {
  if (item.options.length > 0) {
    return {
      type: "object",
      properties: {
        response: { type: "string", enum: orderedLabels(item, options) },
      },
      required: ["response"],
    };
  }
  return {
    type: "object",
    properties: {
      response: {
        type: "number",
        minimum: item.range[0],
        maximum: item.range[1],
      },
    },
    required: ["response"],
  };
}

// Map a structured response back to the item's numeric code so results stay
// joinable; unmatched or out-of-range responses score null (non-conforming).
export function toCode(item: SurveyItem, response: unknown): number | null {
  if (item.options.length === 0) {
    if (typeof response !== "number" || !Number.isFinite(response)) {
      return null;
    }
    return response >= item.range[0] && response <= item.range[1]
      ? response
      : null;
  }
  if (typeof response !== "string") return null;
  const wanted = response.trim().toLowerCase();
  const match = item.options.find(
    (option) => option.label.toLowerCase() === wanted,
  );
  return match ? match.code : null;
}

// Envelope keys that describe the call rather than carry the answer, so a
// model naming its own tool "structured_output" cannot be read as a label.
const ENVELOPE_KEYS = new Set(["tool", "name", "type", "function"]);
const MAX_ENVELOPE_DEPTH = 6;

// Structured-output compliance is a model decision wherever the provider
// emulates it with a prompt-level tool instead of a grammar (Fireworks
// nemotron, Gemini fallbacks). Those models answer correctly and then bury
// the answer: under an invented key ({"choice": …}, {"selected_statement": …})
// or inside the emulation envelope ({"tool":"structured_output","arguments":
// {…}}). Walk the payload for the first value this item accepts rather than
// scoring a conforming answer null over its key. Only exact option labels and
// in-range numbers match, so the walk cannot invent an answer.
export function toResponseCode(
  item: SurveyItem,
  content: unknown,
): number | null {
  const seen = new Set<object>();
  const walk = (node: unknown, depth: number): number | null => {
    const direct = toCode(item, node);
    if (direct !== null) return direct;
    if (depth >= MAX_ENVELOPE_DEPTH) return null;
    if (typeof node === "string") {
      const text = node.trim();
      if (!text.startsWith("{") && !text.startsWith("[")) return null;
      try {
        return walk(JSON.parse(text), depth + 1);
      } catch {
        return null;
      }
    }
    if (node === null || typeof node !== "object") return null;
    if (seen.has(node)) return null;
    seen.add(node);
    for (const [key, value] of Object.entries(node)) {
      if (ENVELOPE_KEYS.has(key) && typeof value === "string") continue;
      const code = walk(value, depth + 1);
      if (code !== null) return code;
    }
    return null;
  };
  return walk(content, 0);
}

// A cheap first pass. Two turns already surface instability on an item, and
// resume tops a sitting up to any higher target without re-asking what is
// already banked, so depth is an opt-in second step rather than a commitment
// made before the first run.
const DEFAULT_REPETITIONS = 2;

// A bare `explain: true` uses the plan's probe when it defines one; text
// overrides either default.
function explainPrompt(
  explain: boolean | string | undefined,
  options: { probe?: string } = {},
): string | undefined {
  if (explain === undefined || explain === false) return undefined;
  return explain === true || explain === "true"
    ? (options.probe ?? EXPLAIN_PROMPT)
    : explain;
}

// Explanations persist as probe children of the interview, never on the
// interview item — a verbose model's free text can push the parent past a
// store's item limits. The deterministic id makes the write an upsert, so an
// item re-asked on resume replaces its probe.
async function saveProbe(options: {
  store: Store;
  interviewId: string;
  name: string;
  query: string;
  responses: (string | null)[];
  // Turns already recorded for this item. Given, `responses` covers only the
  // turns after them: the existing probe is padded with nulls out to this
  // length before the new entries land, so explanation index keeps matching
  // repetition index even when the earlier turns were never probed.
  priorTurns?: number;
}): Promise<void> {
  const { store, interviewId, name, query, responses, priorTurns } = options;
  const scope = calculateScope(interviewId);
  const id = probeId(scope, name);
  let merged = responses;
  if (priorTurns) {
    const existing = await store.get<ProbeEntity>(PROBE_MODEL, id);
    const head = [...(existing?.responses ?? [])].slice(0, priorTurns);
    while (head.length < priorTurns) head.push(null);
    merged = [...head, ...responses];
  }
  await store.update<ProbeEntity>({
    id,
    model: PROBE_MODEL,
    scope,
    category: PROBE_CATEGORY_EXPLANATION,
    name,
    query,
    responses: merged,
  });
}

// The option order each turn is shown, for turns [from, turns). Derived in one
// place so the ask path and the replay path agree: a probe reconstructs the
// transcript the respondent saw rather than a differently-ordered one.
export function turnPresentations(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  item: SurveyItem;
  turns: number;
  from?: number;
}): ItemPresentationOptions[] {
  const { entity, instrument, item, turns } = options;
  const from = options.from ?? 0;
  const reverseOptions = entity.condition === "reversed-options";
  const randomizedOptions = entity.condition === "randomized-options";
  // Plan-mandated protocol; an explicit condition overrides it.
  const balancedOptions =
    instrument.optionOrder === "balanced-random" &&
    entity.condition === undefined;
  // Balanced-random protocol: one order per turn, each order appearing equally
  // often across the run (6/6 over 12 reps of a pair), seeded by (plan, item)
  // so every model sees the same order on the same turn. A top-up balances its
  // own tail on a seed carrying the offset rather than re-deriving the whole
  // schedule: the banked head was balanced under its own target, so head plus
  // balanced tail stays balanced.
  const orders =
    balancedOptions && item.options.length > 1
      ? balancedOrders(
          item.options.map((option) => option.label),
          {
            seed:
              from === 0
                ? `${entity.plan}:${item.name}`
                : `${entity.plan}:${item.name}:from${from}`,
            turns: turns - from,
          },
        )
      : undefined;
  const schedule: ItemPresentationOptions[] = [];
  for (let rep = from; rep < turns; rep += 1) {
    schedule.push({
      reverseOptions,
      // Under randomized-options every turn gets a fresh option order, seeded
      // by (plan, item, turn) so every model sees the same order on the turn.
      shuffleSeed: randomizedOptions
        ? turnSeed({ plan: entity.plan, item: item.name, turn: rep + 1 })
        : undefined,
      order: orders?.[rep - from],
    });
  }
  return schedule;
}

// What the respondent saw on each recorded turn. Sittings run since orders
// were recorded carry them verbatim; older ones re-derive the schedule, which
// is exact for a sitting asked in a single pass.
export function recordedOrders(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  item: SurveyItem;
  turns: number;
}): string[][] {
  const { entity, instrument, item, turns } = options;
  if (item.options.length === 0) return [];
  const orders = [...(entity.responses[item.name]?.orders ?? [])].slice(
    0,
    turns,
  );
  if (orders.length >= turns) return orders;
  const derived = turnPresentations({ entity, instrument, item, turns });
  for (let rep = orders.length; rep < turns; rep += 1) {
    orders[rep] = orderedLabels(item, derived[rep]!);
  }
  return orders;
}

export interface RunSittingOptions {
  entity: InterviewEntity;
  instrument: Instrument;
  items: SurveyItem[];
  repetitions: number;
  store: Store;
  llm: LlmClient;
  log?: Logger;
}

// Carry each item to `repetitions` total turns and land the (already
// persisted) entity as complete or error. Shared by fresh runs and resume:
// responses accumulate onto whatever the entity already holds, an item that
// already has turns recorded is topped up rather than restarted, and because
// update is a full put a successful resume clears a prior error.
export async function runSitting(
  options: RunSittingOptions,
): Promise<InterviewEntity> {
  const { entity, instrument, items, repetitions, store, llm } = options;
  const log = options.log ?? noopLog;
  const { id } = entity;
  const modelId = entity.respondentModel!;
  // Items already on the record plus the ones this pass touches: a top-up
  // re-lists items that are already counted, so the total is the union.
  const target = new Set([
    ...Object.keys(entity.responses),
    ...items.map((item) => item.name),
  ]).size;
  const responses: Record<string, InterviewItemResponse> = {
    ...entity.responses,
  };
  // Counters are derived, never incremented — a topped-up item may cross from
  // declined to answered, and only a recount tracks that.
  const tally = () => {
    const recorded = Object.values(responses);
    const declined = recorded.filter((response) => response.declined).length;
    return { answered: recorded.length - declined, declined };
  };
  let { answered, declined } = tally();
  let provider: string | undefined = entity.provider;
  try {
    for (const item of items) {
      // Turns already banked for this item; a top-up appends to them.
      const prior = entity.responses[item.name];
      const values: (number | null)[] = [...(prior?.values ?? [])];
      const banked = values.length;
      // The banked turns' orders, so a top-up's record stays aligned even when
      // the head predates order recording.
      const orders = recordedOrders({
        entity,
        instrument,
        item,
        turns: banked,
      });
      const schedule = turnPresentations({
        entity,
        instrument,
        item,
        turns: repetitions,
        from: banked,
      });
      const explanations: (string | null)[] = [];
      let raw: string | undefined = prior?.raw;
      for (let rep = values.length; rep < repetitions; rep += 1) {
        const presentation = schedule[rep - banked]!;
        if (item.options.length > 0) {
          orders[rep] = orderedLabels(item, presentation);
        }
        const prompt = itemPrompt(instrument, item, presentation);
        const format = itemFormat(item, presentation);
        const response = await llm.operate(prompt, { model: modelId, format });
        provider = (response as { provider?: string }).provider ?? provider;
        const content = response.content as { response?: unknown } | null;
        const strict = toCode(item, content?.response);
        // Fall back to the envelope walk only when the declared key misses.
        const code = strict ?? toResponseCode(item, response.content);
        values.push(code);
        if (code === null && raw === undefined) {
          raw =
            typeof content?.response === "string"
              ? content.response
              : JSON.stringify(response.content);
        }
        if (entity.explain) {
          // Second turn in the same conversation: the model explains the
          // answer it just gave. Free text — no format constraint.
          const followUp = await llm.operate(entity.explain, {
            model: modelId,
            history: (response as { history?: LlmTurn[] }).history,
          });
          const text =
            typeof followUp.content === "string" && followUp.content.length > 0
              ? followUp.content
              : null;
          explanations.push(text);
        }
      }
      const scored = values.filter((value): value is number => value !== null);
      const mean = scored.length
        ? Math.round(
            (scored.reduce((sum, value) => sum + value, 0) / scored.length) *
              100,
          ) / 100
        : null;
      const itemResponse: InterviewItemResponse = {
        name: item.name,
        value: mean,
        values,
      };
      if (orders.length > 0) itemResponse.orders = orders;
      if (mean === null) itemResponse.declined = true;
      if (raw !== undefined) itemResponse.raw = raw;
      if (explanations.length > 0) {
        await saveProbe({
          store,
          interviewId: id,
          name: item.name,
          query: entity.explain!,
          responses: explanations,
          // A top-up's explanations follow the ones already recorded.
          priorTurns: banked,
        });
      }
      responses[item.name] = itemResponse;
      ({ answered, declined } = tally());
      log.trace(
        `interview ${id}: ${item.name} avg ${mean} over ${scored.length}/${repetitions}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`interview ${id} (${modelId}) failed: ${message}`);
    const failed: InterviewEntity = {
      ...entity,
      responses,
      answered,
      declined,
      remaining: target - answered - declined,
      status: "error",
      error: message,
    };
    if (provider !== undefined) failed.provider = provider;
    await store.update(failed);
    return failed;
  }

  const complete: InterviewEntity = {
    ...entity,
    responses,
    answered,
    declined,
    remaining: 0,
    status: "complete",
    completedAt: new Date().toISOString(),
  };
  delete complete.error;
  if (provider !== undefined) complete.provider = provider;
  try {
    await store.update(complete);
  } catch (error) {
    // Every answer is already collected (and probes persisted); a failed
    // final put must not crash out leaving the entity stuck at "pending"
    // with no stamped error.
    const message = error instanceof Error ? error.message : String(error);
    log.error(`interview ${id} (${modelId}) failed to persist: ${message}`);
    const failed: InterviewEntity = {
      ...complete,
      status: "error",
      error: message,
    };
    delete failed.completedAt;
    await store.update(failed);
    return failed;
  }
  return complete;
}

// Probe an answer already on the record. The turn is replayed rather than
// re-asked: the prompt is reconstructed from the order the respondent saw and
// the recorded code is played back as the answer it gave, so the probe lands
// as the second turn of that conversation without spending another answer.
// The respondent's own reasoning trace is not in that context — it explains an
// answer attributed to it rather than one it has just produced.
export async function replayProbe(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  item: SurveyItem;
  order: string[] | undefined;
  value: number;
  query: string;
  llm: LlmClient;
}): Promise<string | null> {
  const { entity, instrument, item, order, value, query, llm } = options;
  const answer =
    item.options.length > 0
      ? item.options.find((option) => option.code === value)!.label
      : value;
  const history: LlmTurn[] = [
    {
      role: "user",
      content: itemPrompt(instrument, item, order ? { order } : {}),
    },
    {
      role: "assistant",
      content: JSON.stringify({ response: answer }),
    },
  ];
  const followUp = await llm.operate(query, {
    model: entity.respondentModel!,
    history,
  });
  return typeof followUp.content === "string" && followUp.content.length > 0
    ? followUp.content
    : null;
}

// Fill in explanations for turns already recorded, one replay per unprobed
// turn. Non-conforming turns are skipped — there is no answer to explain — and
// stay null so explanation index keeps matching repetition index.
export async function backfillExplanations(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  items: SurveyItem[];
  query: string;
  store: Store;
  llm: LlmClient;
  log?: Logger;
}): Promise<number> {
  const { entity, instrument, items, query, store, llm } = options;
  const scope = calculateScope(entity);
  let asked = 0;
  for (const item of items) {
    const values = entity.responses[item.name]?.values ?? [];
    if (values.length === 0) continue;
    const probe = await store.get<ProbeEntity>(
      PROBE_MODEL,
      probeId(scope, item.name),
    );
    const explanations: (string | null)[] = [...(probe?.responses ?? [])].slice(
      0,
      values.length,
    );
    while (explanations.length < values.length) explanations.push(null);
    const orders = recordedOrders({
      entity,
      instrument,
      item,
      turns: values.length,
    });
    let added = 0;
    for (const [rep, value] of values.entries()) {
      if (value === null || explanations[rep] !== null) continue;
      const text = await replayProbe({
        entity,
        instrument,
        item,
        order: orders[rep],
        value,
        query,
        llm,
      });
      explanations[rep] = text;
      added += 1;
    }
    if (added === 0) continue;
    await saveProbe({
      store,
      interviewId: entity.id,
      name: item.name,
      query,
      responses: explanations,
    });
    asked += added;
  }
  return asked;
}

interface RunOneModelOptions {
  modelId: string;
  instrument: Instrument;
  items: SurveyItem[];
  repetitions: number;
  condition?: string;
  explain?: string;
  panel?: string;
  language?: string;
  store: Store;
  llm: LlmClient;
  log?: Logger;
}

// One model's fresh sitting: persist the pending row, then run every item.
async function runOneModel(
  options: RunOneModelOptions,
): Promise<InterviewEntity> {
  const {
    modelId,
    instrument,
    items,
    repetitions,
    condition,
    explain,
    panel,
    language,
    store,
    llm,
    log,
  } = options;
  const id = randomUUID();
  const entity: InterviewEntity = {
    id,
    model: INTERVIEW_MODEL,
    scope: APEX,
    plan: instrument.id,
    respondent: modelId,
    respondentModel: modelId,
    repetitions,
    responses: {},
    answered: 0,
    declined: 0,
    remaining: items.length,
    status: "pending",
    startedAt: new Date().toISOString(),
  };
  if (condition !== undefined) entity.condition = condition;
  if (explain !== undefined) entity.explain = explain;
  if (panel !== undefined) entity.panel = panel;
  if (language !== undefined) entity.language = language;
  await store.create(entity);
  return runSitting({
    entity,
    instrument,
    items,
    repetitions,
    store,
    llm,
    log,
  });
}

// Pick a model sitting back up in place: same interview id, same plan and
// condition, into the same record. Resume works against a repetition target
// rather than a to-do list — every item short of the target is asked the
// difference and its turns append. With no override the target is the
// recorded repetitions, so resume finishes an interrupted run; raising it
// (repetitions 12 over a 2-rep sitting) fans an existing sitting out by
// asking the missing 10, including on a sitting that already read complete.
// `explain` backfills: every recorded turn without an explanation is replayed
// and probed, so a smoke run taken without explain can be probed after the
// fact on the questions worth probing.
async function resumeOneModel(options: {
  id: string;
  repetitions?: number;
  explain?: boolean | string;
  retry?: boolean;
  store: Store;
  llm: LlmClient;
  log?: Logger;
}): Promise<InterviewEntity> {
  const { id, repetitions, retry, store, llm } = options;
  const log = options.log ?? noopLog;
  const entity = await store.get<InterviewEntity>(INTERVIEW_MODEL, id);
  if (!entity || entity.model !== INTERVIEW_MODEL) {
    throw new NotFoundError(`No interview: ${id}`);
  }
  if (!entity.respondentModel) {
    throw new BadRequestError(
      `Interview ${id} is not a model sitting — resume re-asks items with the recorded model`,
    );
  }
  const instrument = buildInstrument({ plan: entity.plan as InstrumentPlan });
  const explain = explainPrompt(options.explain, { probe: instrument.probe });
  const reps =
    repetitions && repetitions > 0
      ? Math.floor(repetitions)
      : (entity.repetitions ?? DEFAULT_REPETITIONS);
  // A null turn is a real finding on a contested instrument (the respondent
  // refused) and a provider defect on a model that cannot hold its own
  // output format. Only `retry` discards them, and then the turn is re-asked
  // rather than counted toward the target.
  const responses = retry
    ? Object.fromEntries(
        Object.entries(entity.responses).map(([name, response]) => {
          const kept = (response.values ?? []).filter(
            (value) => value !== null,
          );
          if (kept.length === (response.values?.length ?? 0)) {
            return [name, response];
          }
          const next: InterviewItemResponse = { ...response, values: kept };
          delete next.raw;
          return [name, next];
        }),
      )
    : entity.responses;
  const scoped = instrument.items;
  const banked = (name: string) => responses[name]?.values?.length ?? 0;
  const items = scoped.filter((item) => banked(item.name) < reps);
  const query = explain ?? entity.explain;
  // Backfill is the only work a sitting already at its target can have, so it
  // decides whether an otherwise-idle resume is an error.
  const unprobed = query
    ? scoped.filter((item) => banked(item.name) > 0).length > 0
    : false;
  if (items.length === 0 && !unprobed) {
    throw new BadRequestError(
      `Interview ${id} already holds ${reps} turns for every item — pass a higher repetitions to add more, or explain to probe the turns it has`,
    );
  }
  const added = items.reduce(
    (sum, item) => sum + (reps - banked(item.name)),
    0,
  );
  log.debug(
    `resuming interview ${id}: ${items.length} items short of ${reps} turns (${added} to ask)`,
  );
  // A backfill-only pass asks no items, so it leaves status alone: a sitting
  // scoped to one item must not read complete on the strength of that item.
  const pending: InterviewEntity = {
    ...entity,
    responses,
    repetitions: reps,
    status: items.length > 0 ? "pending" : entity.status,
  };
  if (explain !== undefined) pending.explain = explain;
  if (items.length > 0) delete pending.error;
  await store.update(pending);
  // Backfill first: the replayed turns precede any new ones, so explanation
  // index keeps matching repetition index when both run in the same pass.
  if (query) {
    const probed = await backfillExplanations({
      entity: pending,
      instrument,
      items: scoped,
      query,
      store,
      llm,
      log,
    });
    log.debug(`interview ${id}: backfilled ${probed} explanations`);
  }
  if (items.length === 0) return pending;
  return runSitting({
    entity: pending,
    instrument,
    items,
    repetitions: reps,
    store,
    llm,
    log,
  });
}

export interface RunInterviewsOptions {
  /** Instrument plan; defaults to the registry default. */
  plan?: InstrumentPlan;
  /** Named roster to field; defaults to the instrument's own panel, then the registry default. */
  panel?: string;
  /** Explicit model ids; overrides the panel. */
  models?: string[];
  /** Turns each item is asked per model (default 2); with resume it is the target total and only the shortfall is asked. */
  repetitions?: number;
  /** Experimental condition: "reversed-options" | "randomized-options". */
  condition?: string;
  /** Language the sitting is requested in; stamped on the interview record. */
  language?: string;
  /** Follow each answer with an explanation request in the same conversation; true uses the plan's probe, or pass custom text. With resume it backfills instead: recorded turns are replayed and probed, spending no answer turns. */
  explain?: boolean | string;
  /** With resume, ask non-conforming turns again instead of counting them toward the target (they are kept by default — a refusal is a finding). */
  retry?: boolean;
  /** Interview ids to pick back up, resumed concurrently. Every item short of the repetition target is asked the difference into the same record; plan, model, and condition come from each record, repetitions and explain may override. Banked turns are always kept. */
  resume?: string[];
  store: Store;
  llm: LlmClient;
  log?: Logger;
}

/**
 * Administer a survey instrument to one or more LLM respondents — every item
 * asked repeatedly, one interview per model. Models run concurrently; each
 * sitting is internally serial, so the roster size is the request-concurrency
 * ceiling. A model that errors persists as status "error" and the remaining
 * models still run.
 */
export async function runInterviews(
  options: RunInterviewsOptions,
): Promise<InterviewEntity[]> {
  const {
    plan,
    panel,
    models,
    repetitions,
    condition,
    language,
    explain,
    retry,
    resume,
    store,
    llm,
    log,
  } = options;
  if (resume) {
    const ids = resume.map((entry) => entry.trim()).filter(Boolean);
    if (ids.length === 0) {
      throw new BadRequestError("resume must name at least one interview id");
    }
    // Sittings resume concurrently, as a roster of fresh runs would: each is
    // internally serial, so one call probes one item across a whole panel.
    return Promise.all(
      ids.map((id) =>
        resumeOneModel({ id, repetitions, explain, retry, store, llm, log }),
      ),
    );
  }
  const reps =
    repetitions && repetitions > 0
      ? Math.floor(repetitions)
      : DEFAULT_REPETITIONS;
  const instrument = buildInstrument({ plan: plan ?? DEFAULT_PLAN });
  // An explicit roster wins; otherwise the run is fielded to a panel —
  // the one named, the instrument's own, or the registry default — so a
  // sitting always records which cohort it belongs to.
  const roster = models
    ? models.map((entry) => entry.trim()).filter(Boolean)
    : resolvePanel({ panel, instrumentPanel: instrument.panel }).models;
  if (roster.length === 0) {
    throw new BadRequestError("models must name at least one model id");
  }
  const cohort = models
    ? undefined
    : resolvePanel({ panel, instrumentPanel: instrument.panel }).id;
  return Promise.all(
    roster.map((modelId) =>
      runOneModel({
        modelId,
        instrument,
        items: instrument.items,
        repetitions: reps,
        condition,
        explain: explainPrompt(explain, { probe: instrument.probe }),
        language,
        store,
        llm,
        log,
        ...(cohort === undefined ? {} : { panel: cohort }),
      }),
    ),
  );
}

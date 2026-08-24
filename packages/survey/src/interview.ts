import { BadRequestError, NotFoundError } from "@jaypie/errors";
import {
  calculateScope,
  type Entity,
  type Journal,
  type LlmClient,
  type LlmTurn,
  type LlmUsage,
  type Store,
} from "@modelstudies/workflows";
import { randomUUID } from "node:crypto";

import {
  FIELDING_MODEL,
  fieldingId,
  fieldingStatus,
  type FieldingEntity,
} from "./fielding";
import {
  armItems,
  buildInstrument,
  DEFAULT_PLAN,
  EXPLAIN_PROMPT,
  resolveArm,
  resolveItems,
} from "./instrument";
import {
  discardReps,
  foldJournal,
  meanOf,
  rawOf,
  sha1,
  type FoldedItem,
  type SittingEvent,
  type SittingFold,
  type StopReason,
} from "./journal";
import { noopLog, type Logger } from "./log";
import { balancedOrders, seededShuffle, turnSeed } from "./order";
import { resolvePanel } from "./panel";
import type {
  ArmDefinition,
  Instrument,
  InstrumentPlan,
  SurveyItem,
} from "./types";

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
  // The course the informed arm's appended line named, by code, one per
  // repetition; present only in an arm that appends a majority
  majority?: (1 | 2)[];
  declined?: boolean;
  // Verbatim non-conforming answer, kept for refusal analysis
  raw?: string;
  // Explain-mode follow-ups: one per repetition on LLM runs (null when the
  // follow-up produced no text)
  explanations?: (string | null)[];
  // The answer call's usage per repetition, priced at call time; null where
  // the call reported none. Index-aligned with `values`.
  usage?: (LlmUsage | null)[];
}

// One administration of an instrument to one respondent model.
export interface InterviewEntity extends Entity {
  model: typeof INTERVIEW_MODEL;
  scope: string;
  // Instrument plan id, e.g. "model-values-96" — the comparison cohort this
  // sitting belongs to
  plan: string;
  // The treatment arm the plan declares that this sitting was fielded in
  // (absent = the default arm); part of the sitting's identity, read back
  // on resume, replay, and verify
  arm?: string;
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
  // The fielding (one interview-run) this sitting was opened by
  fielding?: string;
  // The item names this sitting was scoped to (absent = the whole plan);
  // a resume asks only these
  items?: string[];
  responses: Record<string, InterviewItemResponse>;
  answered: number;
  declined: number;
  remaining: number;
  status: InterviewStatus;
  // Why a pending sitting stopped: "interrupted at f2 rep 3", "budget …"
  statusDetail?: string;
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
  // The probe call's usage per repetition; null where none was reported
  usage?: (LlmUsage | null)[];
}

// The journal is keyed by the interview model, so it sits beside the entity.
export const INTERVIEW_JOURNAL = INTERVIEW_MODEL;

const stamp = () => new Date().toISOString();

export interface ItemPresentationOptions {
  reverseOptions?: boolean;
  /** Seeded per-turn shuffle of option order; wins over reverseOptions. */
  shuffleSeed?: string;
  /** Explicit label order (balanced-random protocol); wins over both. */
  order?: string[];
  /** The arm the item is asked in: preamble, rendering, appended line. */
  arm?: ArmDefinition;
  /** The course the informed arm's line names this turn, by code. */
  majority?: 1 | 2;
}

/** the informed arm's line when the arm states none; `{course}` is the course named */
export const DEFAULT_MAJORITY_TEXT =
  "Four other advisers, deciding independently, chose: {course}";

/**
 * The item as an arm shows it: the arm's rendering of its wording and
 * courses when it has one, codes unchanged; the bank's item otherwise.
 * Idempotent, so a rendered item passed back in renders the same.
 */
export function presentItem(item: SurveyItem, arm?: ArmDefinition): SurveyItem {
  const rendering = arm?.rendering?.[item.name];
  if (!rendering) return item;
  if (item.options.length !== 2) {
    throw new BadRequestError(
      `Arm ${arm!.title} renders ${item.name}, which is not a two-course item`,
    );
  }
  return {
    ...item,
    wording: rendering.wording,
    options: item.options.map((option, index) => ({
      ...option,
      label: rendering.options[index]!,
    })),
  };
}

export function orderedLabels(
  item: SurveyItem,
  options: ItemPresentationOptions,
): string[] {
  if (options.order !== undefined) return [...options.order];
  const labels = presentItem(item, options.arm).options.map(
    (option) => option.label,
  );
  if (options.shuffleSeed !== undefined) {
    return seededShuffle(labels, { seed: options.shuffleSeed });
  }
  if (options.reverseOptions) labels.reverse();
  return labels;
}

/** The informed arm's appended line naming the course `majority` codes. */
export function majorityLine(
  item: SurveyItem,
  arm: ArmDefinition,
  majority: 1 | 2,
): string {
  const shown = presentItem(item, arm);
  const course = shown.options.find((option) => option.code === majority);
  if (!course) {
    throw new BadRequestError(
      `Item ${item.name} has no course coded ${majority} for the majority line`,
    );
  }
  return (arm.appendText ?? DEFAULT_MAJORITY_TEXT).replaceAll(
    "{course}",
    course.label,
  );
}

// One repetition's presentation: the question and its labeled choices as
// plain text — no numbers, no letters, no system prompt. Each item is asked
// in an independent conversation so earlier answers cannot anchor later ones.
// An arm swaps the preamble and the rendering, and the informed arm appends
// its line after the courses; the prompt stays a pure function of (plan,
// arm, item, order, majority), which is what replay and verify rely on.
export function itemPrompt(
  instrument: Instrument,
  item: SurveyItem,
  options: ItemPresentationOptions = {},
): string {
  const { arm } = options;
  const shown = presentItem(item, arm);
  const lines: string[] = [];
  const instruction =
    shown.instruction ?? arm?.preamble ?? instrument.instruction;
  if (instruction) {
    lines.push(instruction, "");
  }
  lines.push(shown.wording);
  if (shown.options.length > 0) {
    lines.push("", ...orderedLabels(shown, options));
  } else {
    lines.push(
      "",
      `Answer with a number between ${shown.range[0]} and ${shown.range[1]}.`,
    );
  }
  if (arm?.append === "majority") {
    if (options.majority === undefined) {
      throw new BadRequestError(
        `Arm ${arm.title} appends a majority line and none was scheduled for ${item.name}`,
      );
    }
    lines.push("", majorityLine(shown, arm, options.majority));
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
  usage?: (LlmUsage | null)[];
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
  let usage = options.usage ?? responses.map(() => null);
  if (priorTurns) {
    const existing = await store.get<ProbeEntity>(PROBE_MODEL, id);
    const head = [...(existing?.responses ?? [])].slice(0, priorTurns);
    const headUsage = [...(existing?.usage ?? [])].slice(0, priorTurns);
    while (head.length < priorTurns) head.push(null);
    while (headUsage.length < priorTurns) headUsage.push(null);
    merged = [...head, ...responses];
    usage = [...headUsage, ...usage];
  }
  await store.update<ProbeEntity>({
    id,
    model: PROBE_MODEL,
    scope,
    category: PROBE_CATEGORY_EXPLANATION,
    name,
    query,
    responses: merged,
    usage,
  });
}

// Counters are derived, never incremented — a topped-up item may cross from
// declined to answered, and only a recount tracks that.
function tallyOf(
  responses: Record<string, InterviewItemResponse>,
  target: number,
): { answered: number; declined: number; remaining: number } {
  const recorded = Object.values(responses);
  const declined = recorded.filter((response) => response.declined).length;
  const answered = recorded.length - declined;
  return {
    answered,
    declined,
    remaining: Math.max(0, target - recorded.length),
  };
}

/** An item's response as the fold holds it. */
export function responseOf(
  name: string,
  item: FoldedItem,
): InterviewItemResponse {
  const response: InterviewItemResponse = {
    name,
    value: meanOf(item.values),
    values: [...item.values],
  };
  const orders = item.orders.filter(
    (order): order is string[] => order !== null,
  );
  if (orders.length > 0) response.orders = orders;
  const majority = item.majority.filter(
    (entry): entry is 1 | 2 => entry !== null,
  );
  if (majority.length > 0) response.majority = majority;
  if (response.value === null) response.declined = true;
  const missed = item.values.findIndex((value) => value === null);
  if (missed >= 0) response.raw = rawOf(item.contents[missed]);
  if (item.usage.some((usage) => usage !== null)) {
    response.usage = [...item.usage];
  }
  return response;
}

/**
 * The entity's responses with the fold laid over them: every item the
 * journal holds is rebuilt from it; an item only the entity holds (a sitting
 * older than the journal) stays. Returns the differences, for the log.
 */
export function materializeResponses(options: {
  entity: InterviewEntity;
  fold: SittingFold;
}): { responses: Record<string, InterviewItemResponse>; drift: string[] } {
  const { entity, fold } = options;
  const responses: Record<string, InterviewItemResponse> = {
    ...entity.responses,
  };
  const drift: string[] = [];
  for (const [name, item] of Object.entries(fold.items)) {
    if (item.values.length === 0) {
      delete responses[name];
      if (entity.responses[name]) drift.push(`${name}: journal holds no turns`);
      continue;
    }
    const next = responseOf(name, item);
    const prior = entity.responses[name];
    if (!prior) {
      drift.push(`${name}: entity lacks ${next.values!.length} turns`);
    } else if (
      JSON.stringify(prior.values ?? []) !== JSON.stringify(next.values)
    ) {
      drift.push(
        `${name}: entity holds ${JSON.stringify(prior.values ?? [])}, journal ${JSON.stringify(next.values)}`,
      );
    }
    responses[name] = next;
  }
  return { responses, drift };
}

/** The probe children the fold implies, aligned to each item's turns. */
export function probesOf(options: {
  entity: InterviewEntity;
  fold: SittingFold;
}): ProbeEntity[] {
  const { entity, fold } = options;
  const scope = calculateScope(entity.id);
  const probes: ProbeEntity[] = [];
  for (const [name, item] of Object.entries(fold.items)) {
    if (!item.explanations.some((text) => text !== undefined)) continue;
    const query = item.query ?? entity.explain;
    if (!query) continue;
    probes.push({
      id: probeId(scope, name),
      model: PROBE_MODEL,
      scope,
      category: PROBE_CATEGORY_EXPLANATION,
      name,
      query,
      responses: item.explanations.map((text) => text ?? null),
      usage: [...item.probeUsage],
    });
  }
  return probes;
}

/** The arm a sitting was fielded in, resolved against its plan (undefined on the default arm). */
export function armOf(
  instrument: Instrument,
  entity: Pick<InterviewEntity, "arm">,
): ArmDefinition | undefined {
  return entity.arm === undefined
    ? undefined
    : resolveArm(instrument, entity.arm);
}

// The option order each turn is shown, for turns [from, turns), and in an
// arm that appends a majority line, the course it names. Derived in one
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
  const arm = armOf(instrument, entity);
  const shown = presentItem(item, arm);
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
    balancedOptions && shown.options.length > 1
      ? balancedOrders(
          shown.options.map((option) => option.label),
          {
            seed:
              from === 0
                ? `${entity.plan}:${item.name}`
                : `${entity.plan}:${item.name}:from${from}`,
            turns: turns - from,
          },
        )
      : undefined;
  // The informed arm's majority: the same balanced machinery over the two
  // codes, seeded by (plan, arm, item) and independent of the option order,
  // so 12 reps name course 1 six times and course 2 six times.
  const majorities =
    arm?.append === "majority"
      ? balancedOrders([1, 2] as const, {
          seed:
            from === 0
              ? `${entity.plan}:${entity.arm}:${item.name}`
              : `${entity.plan}:${entity.arm}:${item.name}:from${from}`,
          turns: turns - from,
        }).map((pair) => pair[0]!)
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
      ...(arm ? { arm } : {}),
      ...(majorities ? { majority: majorities[rep - from] } : {}),
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

// The majority named on each recorded turn of an informed-arm sitting:
// recorded verbatim, else re-derived from the schedule. Empty outside such
// an arm.
export function recordedMajority(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  item: SurveyItem;
  turns: number;
}): (1 | 2)[] {
  const { entity, instrument, item, turns } = options;
  const arm = armOf(instrument, entity);
  if (arm?.append !== "majority") return [];
  const majority = [...(entity.responses[item.name]?.majority ?? [])].slice(
    0,
    turns,
  );
  if (majority.length >= turns) return majority;
  const derived = turnPresentations({ entity, instrument, item, turns });
  for (let rep = majority.length; rep < turns; rep += 1) {
    majority[rep] = derived[rep]!.majority!;
  }
  return majority;
}

/**
 * A dollar cap shared by every sitting of a fielding. Each landed call adds
 * its priced `usd` (an unpriced call adds nothing and is counted, so a cap
 * over an unpriced model is visibly not a cap); a sitting checks the running
 * sum after every call and stops as pending once the limit is reached. A
 * resumed sitting adds what its journal already holds before it asks
 * anything, so the cap counts earlier processes.
 */
export interface SittingBudget {
  limitUsd: number;
  spentUsd: number;
  unpriced: number;
}

export const createBudget = (limitUsd: number): SittingBudget => ({
  limitUsd,
  spentUsd: 0,
  unpriced: 0,
});

export const chargeBudget = (
  budget: SittingBudget | undefined,
  usage: LlmUsage | undefined,
): void => {
  if (!budget) return;
  let priced = false;
  for (const item of usage ?? []) {
    if (typeof item.usd === "number") {
      priced = true;
      budget.spentUsd = Math.round((budget.spentUsd + item.usd) * 1e6) / 1e6;
    }
  }
  if (!priced) budget.unpriced += 1;
};

export const budgetExhausted = (budget: SittingBudget | undefined): boolean =>
  budget !== undefined && budget.spentUsd >= budget.limitUsd;

export const budgetDetail = (budget: SittingBudget): string =>
  `budget exhausted at $${budget.spentUsd.toFixed(2)} of $${budget.limitUsd.toFixed(2)}` +
  (budget.unpriced ? ` (${budget.unpriced} unpriced calls counted at $0)` : "");

export interface RunSittingOptions {
  entity: InterviewEntity;
  instrument: Instrument;
  items: SurveyItem[];
  repetitions: number;
  store: Store;
  llm: LlmClient;
  /** every call lands here before its reply is used; absent = entity only */
  journal?: Journal;
  /** checked between calls; an in-flight call lands, then the sitting stops */
  signal?: AbortSignal;
  /** checked after every call; the sitting stops as pending once it is spent */
  budget?: SittingBudget;
  log?: Logger;
}

// Carry each item to `repetitions` total turns and land the (already
// persisted) entity as complete, pending (interrupted), or error. Shared by
// fresh runs and resume: responses accumulate onto whatever the entity
// already holds, an item that already has turns recorded is topped up rather
// than restarted, and because update is a full put a successful resume
// clears a prior error. Every call is journaled before its reply is used and
// the entity is checkpointed after every item, so the most an interrupt or a
// crash can lose is the call in flight.
export async function runSitting(
  options: RunSittingOptions,
): Promise<InterviewEntity> {
  const {
    entity,
    instrument,
    items,
    repetitions,
    store,
    llm,
    journal,
    signal,
    budget,
  } = options;
  const log = options.log ?? noopLog;
  const { id } = entity;
  const modelId = entity.respondentModel!;
  const arm = armOf(instrument, entity);
  const append = async (event: Omit<SittingEvent, "at">) => {
    if (!journal) return;
    await journal.append(INTERVIEW_JOURNAL, id, {
      t: event.t,
      at: stamp(),
      ...event,
    } as SittingEvent);
  };
  // Items already on the record plus the ones this pass touches: a top-up
  // re-lists items that are already counted, so the total is the union.
  const target = new Set([
    ...Object.keys(entity.responses),
    ...items.map((item) => item.name),
  ]).size;
  const responses: Record<string, InterviewItemResponse> = {
    ...entity.responses,
  };
  let provider: string | undefined = entity.provider;
  let usd = 0;
  const spend = (usage: LlmUsage | undefined) => {
    for (const item of usage ?? []) usd += item.usd ?? 0;
    chargeBudget(budget, usage);
  };
  const checkpoint = async (
    status: InterviewStatus,
    detail?: string,
  ): Promise<InterviewEntity> => {
    const next: InterviewEntity = {
      ...entity,
      responses,
      ...tallyOf(responses, target),
      status,
    };
    delete next.statusDetail;
    delete next.error;
    delete next.completedAt;
    if (provider !== undefined) next.provider = provider;
    if (status === "error") next.error = detail;
    else if (detail !== undefined) next.statusDetail = detail;
    if (status === "complete") {
      next.remaining = 0;
      next.completedAt = stamp();
    }
    await store.update(next);
    await append({
      t: "checkpoint",
      answered: next.answered,
      declined: next.declined,
      usd: Math.round(usd * 1e6) / 1e6,
    });
    return next;
  };
  const stop = async (reason: StopReason, message?: string) =>
    append({ t: "stop", reason, ...(message ? { message } : {}) });
  const aborted = () => signal?.aborted === true;
  // The item in progress: what has landed so far, so a thrown call or an
  // interrupt still lands its turns on the checkpoint.
  interface ItemState {
    item: SurveyItem;
    banked: number;
    values: (number | null)[];
    usage: (LlmUsage | null)[];
    orders: string[][];
    majority: (1 | 2)[];
    explanations: (string | null)[];
    probeUsage: (LlmUsage | null)[];
    raw: string | undefined;
  }
  let current: ItemState | undefined;
  const land = async (state: ItemState | undefined) => {
    if (!state || state.values.length <= state.banked) return;
    const {
      item,
      banked,
      values,
      usage,
      orders,
      majority,
      explanations,
      probeUsage,
    } = state;
    const itemResponse: InterviewItemResponse = {
      name: item.name,
      value: meanOf(values),
      values,
    };
    if (orders.length > 0) itemResponse.orders = orders;
    if (majority.length > 0) itemResponse.majority = majority;
    if (itemResponse.value === null) itemResponse.declined = true;
    if (state.raw !== undefined) itemResponse.raw = state.raw;
    if (usage.some((entry) => entry !== null)) itemResponse.usage = usage;
    if (explanations.length > 0) {
      await saveProbe({
        store,
        interviewId: id,
        name: item.name,
        query: entity.explain!,
        responses: explanations,
        usage: probeUsage,
        // A top-up's explanations follow the ones already recorded.
        priorTurns: banked,
      });
    }
    responses[item.name] = itemResponse;
    log.trace(
      `interview ${id}: ${item.name} avg ${itemResponse.value} over ${values.filter((value) => value !== null).length}/${repetitions}`,
    );
  };
  let where = "";
  try {
    for (const item of items) {
      // Turns already banked for this item; a top-up appends to them.
      const prior = entity.responses[item.name];
      const values: (number | null)[] = [...(prior?.values ?? [])];
      const usage: (LlmUsage | null)[] = [...(prior?.usage ?? [])];
      while (usage.length < values.length) usage.push(null);
      const banked = values.length;
      // The banked turns' orders, so a top-up's record stays aligned even when
      // the head predates order recording.
      const orders = recordedOrders({
        entity,
        instrument,
        item,
        turns: banked,
      });
      const majority = recordedMajority({
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
      // The item as this arm shows it: labels the schema constrains, the
      // reply is matched against, and the record keeps.
      const shown = presentItem(item, arm);
      const explanations: (string | null)[] = [];
      const probeUsage: (LlmUsage | null)[] = [];
      const state: ItemState = {
        item,
        banked,
        values,
        usage,
        orders,
        majority,
        explanations,
        probeUsage,
        raw: prior?.raw,
      };
      current = state;
      let stopped: "interrupt" | "budget" | undefined;
      for (let rep = values.length; rep < repetitions; rep += 1) {
        if (aborted()) {
          stopped = "interrupt";
          where = `${item.name} rep ${rep}`;
          break;
        }
        if (budgetExhausted(budget)) {
          stopped = "budget";
          where = `${item.name} rep ${rep}`;
          break;
        }
        const presentation = schedule[rep - banked]!;
        if (shown.options.length > 0) {
          orders[rep] = orderedLabels(shown, presentation);
        }
        if (presentation.majority !== undefined) {
          majority[rep] = presentation.majority;
        }
        const prompt = itemPrompt(instrument, shown, presentation);
        const format = itemFormat(shown, presentation);
        const started = Date.now();
        let response;
        try {
          response = await llm.operate(prompt, { model: modelId, format });
        } catch (error) {
          await append({
            t: "fail",
            item: item.name,
            rep,
            phase: "answer",
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        provider = (response as { provider?: string }).provider ?? provider;
        const content = response.content as { response?: unknown } | null;
        const strict = toCode(shown, content?.response);
        // Fall back to the envelope walk only when the declared key misses.
        const code = strict ?? toResponseCode(shown, response.content);
        await append({
          t: "turn",
          item: item.name,
          rep,
          ...(orders[rep] ? { order: orders[rep] } : {}),
          ...(majority[rep] !== undefined ? { majority: majority[rep] } : {}),
          ...(provider ? { provider } : {}),
          content: response.content,
          code,
          ...(response.usage ? { usage: response.usage } : {}),
          ms: Date.now() - started,
          promptSha1: sha1(prompt),
        });
        spend(response.usage);
        values.push(code);
        usage.push(response.usage ?? null);
        if (code === null && state.raw === undefined) {
          state.raw = rawOf(response.content);
        }
        // A probe belongs to its answer; the cap is checked after the pair.
        if (entity.explain) {
          // Second turn in the same conversation: the model explains the
          // answer it just gave. Free text — no format constraint.
          const probeStarted = Date.now();
          let followUp;
          try {
            followUp = await llm.operate(entity.explain, {
              model: modelId,
              history: (response as { history?: LlmTurn[] }).history,
            });
          } catch (error) {
            await append({
              t: "fail",
              item: item.name,
              rep,
              phase: "probe",
              message: error instanceof Error ? error.message : String(error),
            });
            throw error;
          }
          const text =
            typeof followUp.content === "string" && followUp.content.length > 0
              ? followUp.content
              : null;
          await append({
            t: "probe",
            item: item.name,
            rep,
            query: entity.explain,
            text,
            ...(followUp.usage ? { usage: followUp.usage } : {}),
            ms: Date.now() - probeStarted,
            replay: false,
          });
          spend(followUp.usage);
          explanations.push(text);
          probeUsage.push(followUp.usage ?? null);
        }
      }
      await land(state);
      current = undefined;
      if (stopped === "interrupt") {
        log.warn(`interview ${id} (${modelId}) interrupted at ${where}`);
        const pending = await checkpoint("pending", `interrupted at ${where}`);
        await stop("interrupt", where);
        return pending;
      }
      if (stopped === "budget") {
        const detail = budgetDetail(budget!);
        log.warn(`interview ${id} (${modelId}) stopped at ${where}: ${detail}`);
        const pending = await checkpoint("pending", detail);
        await stop("budget", `${where}: ${detail}`);
        return pending;
      }
      // the last item's checkpoint is the complete one, written next
      if (item !== items.at(-1)) await checkpoint("pending");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`interview ${id} (${modelId}) failed: ${message}`);
    try {
      await land(current);
    } catch (landError) {
      // the journal still holds the turns; the checkpoint just lags them
      log.warn(
        `interview ${id}: could not checkpoint the item in progress: ${landError instanceof Error ? landError.message : String(landError)}`,
      );
    }
    const failed = await checkpoint("error", message);
    await stop("error", message);
    return failed;
  }

  try {
    const complete = await checkpoint("complete");
    await stop("complete");
    return complete;
  } catch (error) {
    // Every answer is already collected (and probes persisted); a failed
    // final put must not crash out leaving the entity stuck at "pending"
    // with no stamped error.
    const message = error instanceof Error ? error.message : String(error);
    log.error(`interview ${id} (${modelId}) failed to persist: ${message}`);
    const failed: InterviewEntity = {
      ...entity,
      responses,
      ...tallyOf(responses, target),
      status: "error",
      error: message,
    };
    delete failed.completedAt;
    if (provider !== undefined) failed.provider = provider;
    await store.update(failed);
    return failed;
  }
}

// Probe an answer already on the record. The turn is replayed rather than
// re-asked: the prompt is reconstructed from the order the respondent saw and
// the recorded code is played back as the answer it gave, so the probe lands
// as the second turn of that conversation without spending another answer.
// The respondent's own reasoning trace is not in that context — it explains an
// answer attributed to it rather than one it has just produced.
export interface ReplayProbeResult {
  text: string | null;
  usage?: LlmUsage;
  ms: number;
}

export async function replayProbe(options: {
  entity: InterviewEntity;
  instrument: Instrument;
  item: SurveyItem;
  order: string[] | undefined;
  /** the course the informed arm's line named on that turn */
  majority?: 1 | 2;
  value: number;
  query: string;
  llm: LlmClient;
}): Promise<ReplayProbeResult> {
  const { entity, instrument, item, order, majority, value, query, llm } =
    options;
  const started = Date.now();
  const arm = armOf(instrument, entity);
  const shown = presentItem(item, arm);
  const answer =
    shown.options.length > 0
      ? shown.options.find((option) => option.code === value)!.label
      : value;
  const history: LlmTurn[] = [
    {
      role: "user",
      content: itemPrompt(instrument, shown, {
        ...(order ? { order } : {}),
        ...(arm ? { arm } : {}),
        ...(majority !== undefined ? { majority } : {}),
      }),
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
  return {
    text:
      typeof followUp.content === "string" && followUp.content.length > 0
        ? followUp.content
        : null,
    ...(followUp.usage ? { usage: followUp.usage } : {}),
    ms: Date.now() - started,
  };
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
  journal?: Journal;
  signal?: AbortSignal;
  budget?: SittingBudget;
  log?: Logger;
}): Promise<number> {
  const {
    entity,
    instrument,
    items,
    query,
    store,
    llm,
    journal,
    signal,
    budget,
  } = options;
  const scope = calculateScope(entity);
  let asked = 0;
  for (const item of items) {
    if (signal?.aborted || budgetExhausted(budget)) break;
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
    const usage: (LlmUsage | null)[] = [...(probe?.usage ?? [])].slice(
      0,
      values.length,
    );
    while (usage.length < values.length) usage.push(null);
    const orders = recordedOrders({
      entity,
      instrument,
      item,
      turns: values.length,
    });
    const majority = recordedMajority({
      entity,
      instrument,
      item,
      turns: values.length,
    });
    let added = 0;
    for (const [rep, value] of values.entries()) {
      if (value === null || explanations[rep] !== null) continue;
      if (signal?.aborted || budgetExhausted(budget)) break;
      let result: ReplayProbeResult;
      try {
        result = await replayProbe({
          entity,
          instrument,
          item,
          order: orders[rep],
          ...(majority[rep] !== undefined ? { majority: majority[rep] } : {}),
          value,
          query,
          llm,
        });
      } catch (error) {
        await journal?.append(INTERVIEW_JOURNAL, entity.id, {
          t: "fail",
          at: stamp(),
          item: item.name,
          rep,
          phase: "probe",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      await journal?.append(INTERVIEW_JOURNAL, entity.id, {
        t: "probe",
        at: stamp(),
        item: item.name,
        rep,
        query,
        text: result.text,
        ...(result.usage ? { usage: result.usage } : {}),
        ms: result.ms,
        replay: true,
      });
      chargeBudget(budget, result.usage);
      explanations[rep] = result.text;
      usage[rep] = result.usage ?? null;
      added += 1;
    }
    if (added === 0) continue;
    await saveProbe({
      store,
      interviewId: entity.id,
      name: item.name,
      query,
      responses: explanations,
      usage,
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
  /** the arm the sitting is fielded in */
  arm?: string;
  condition?: string;
  explain?: string;
  panel?: string;
  language?: string;
  fielding?: string;
  /** the subset the sitting is scoped to, when it is one */
  subset?: string[];
  store: Store;
  llm: LlmClient;
  journal?: Journal;
  signal?: AbortSignal;
  budget?: SittingBudget;
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
    arm,
    condition,
    explain,
    panel,
    language,
    fielding,
    subset,
    store,
    llm,
    journal,
    signal,
    budget,
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
  if (arm !== undefined) entity.arm = arm;
  if (condition !== undefined) entity.condition = condition;
  if (explain !== undefined) entity.explain = explain;
  if (panel !== undefined) entity.panel = panel;
  if (language !== undefined) entity.language = language;
  if (fielding !== undefined) entity.fielding = fielding;
  if (subset !== undefined) entity.items = subset;
  await store.create(entity);
  await journal?.append(INTERVIEW_JOURNAL, id, {
    t: "start",
    at: stamp(),
    plan: instrument.id,
    ...(arm !== undefined ? { arm } : {}),
    model: modelId,
    repetitions,
    items: items.length,
    ...(explain !== undefined ? { explain } : {}),
    ...(condition !== undefined ? { condition } : {}),
    ...(language !== undefined ? { language } : {}),
    ...(panel !== undefined ? { panel } : {}),
    ...(fielding !== undefined ? { fielding } : {}),
    ...(subset !== undefined ? { subset } : {}),
  });
  return runSitting({
    entity,
    instrument,
    items,
    repetitions,
    store,
    llm,
    journal,
    signal,
    budget,
    log,
  });
}

/**
 * Read a sitting's journal and lay it over the entity: the journal is the
 * record, the entity its checkpoint, so wherever they differ the journal
 * wins and the difference is logged. A sitting without a journal (older than
 * journaling, or run without one) keeps its entity as is.
 */
export async function loadSitting(options: {
  entity: InterviewEntity;
  journal?: Journal;
  log?: Logger;
}): Promise<{ entity: InterviewEntity; fold?: SittingFold; torn: string[] }> {
  const { entity, journal } = options;
  const log = options.log ?? noopLog;
  if (!journal || !(await journal.exists(INTERVIEW_JOURNAL, entity.id))) {
    return { entity, torn: [] };
  }
  const { events, torn = [] } = await journal.read<SittingEvent>(
    INTERVIEW_JOURNAL,
    entity.id,
  );
  for (const fragment of torn) {
    log.warn(
      `interview ${entity.id}: journal has a torn line (${fragment.length} chars), dropped`,
    );
  }
  const fold = foldJournal(events, { name: `interview ${entity.id}` });
  const { responses, drift } = materializeResponses({ entity, fold });
  for (const line of drift) {
    log.warn(`interview ${entity.id}: ${line} (journal wins)`);
  }
  const target = Object.keys(responses).length + entity.remaining;
  return {
    entity: { ...entity, responses, ...tallyOf(responses, target) },
    fold,
    torn,
  };
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
  /** a sitting with nothing to do returns as is instead of throwing (a fielding resume) */
  tolerateIdle?: boolean;
  store: Store;
  llm: LlmClient;
  journal?: Journal;
  signal?: AbortSignal;
  budget?: SittingBudget;
  log?: Logger;
}): Promise<InterviewEntity> {
  const {
    id,
    repetitions,
    retry,
    tolerateIdle,
    store,
    llm,
    journal,
    signal,
    budget,
  } = options;
  const log = options.log ?? noopLog;
  const stored = await store.get<InterviewEntity>(INTERVIEW_MODEL, id);
  if (!stored || stored.model !== INTERVIEW_MODEL) {
    throw new NotFoundError(`No interview: ${id}`);
  }
  const { entity, fold } = await loadSitting({
    entity: stored,
    journal,
    log,
  });
  if (!entity.respondentModel) {
    throw new BadRequestError(
      `Interview ${id} is not a model sitting — resume re-asks items with the recorded model`,
    );
  }
  const instrument = buildInstrument({ plan: entity.plan as InstrumentPlan });
  // The cap counts what earlier processes spent on this sitting: the
  // journal's sum when there is one, the checkpoint's usage otherwise.
  if (budget) {
    if (fold) {
      budget.spentUsd = Math.round((budget.spentUsd + fold.usd) * 1e6) / 1e6;
      budget.unpriced += fold.unpriced;
    } else {
      for (const response of Object.values(entity.responses)) {
        for (const usage of response.usage ?? []) {
          if (usage) chargeBudget(budget, usage);
        }
      }
      const probes = await store.queryByScope<ProbeEntity>(
        PROBE_MODEL,
        entity.id,
      );
      for (const probe of probes) {
        for (const usage of probe.usage ?? []) {
          if (usage) chargeBudget(budget, usage);
        }
      }
    }
  }
  const arm = armOf(instrument, entity);
  const explain = explainPrompt(options.explain, {
    probe: arm?.probe ?? instrument.probe,
  });
  const reps =
    repetitions && repetitions > 0
      ? Math.floor(repetitions)
      : (entity.repetitions ?? DEFAULT_REPETITIONS);
  // A null turn is a real finding on a contested instrument (the respondent
  // refused) and a provider defect on a model that cannot hold its own
  // output format. Only `retry` discards them, and then the turn is re-asked
  // rather than counted toward the target. The discard is journaled so the
  // fold drops the same turns the entity does.
  let responses = entity.responses;
  if (retry) {
    responses = {};
    for (const [name, response] of Object.entries(entity.responses)) {
      const reps = (response.values ?? [])
        .map((value, index) => (value === null ? index : -1))
        .filter((index) => index >= 0);
      if (reps.length === 0) {
        responses[name] = response;
        continue;
      }
      await journal?.append(INTERVIEW_JOURNAL, id, {
        t: "discard",
        at: stamp(),
        item: name,
        reps,
      });
      const held = fold?.items[name];
      if (held) {
        discardReps(held, reps);
        if (held.values.length > 0) responses[name] = responseOf(name, held);
        continue;
      }
      const drop = new Set(reps);
      const next: InterviewItemResponse = {
        ...response,
        values: (response.values ?? []).filter((_, index) => !drop.has(index)),
      };
      if (response.orders) {
        next.orders = response.orders.filter((_, index) => !drop.has(index));
      }
      if (response.usage) {
        next.usage = response.usage.filter((_, index) => !drop.has(index));
      }
      delete next.raw;
      responses[name] = next;
    }
  }
  // A sitting scoped to a subset stays scoped to it.
  const scoped = entity.items
    ? instrument.items.filter((item) => entity.items!.includes(item.name))
    : instrument.items;
  const banked = (name: string) => responses[name]?.values?.length ?? 0;
  const items = scoped.filter((item) => banked(item.name) < reps);
  const query = explain ?? entity.explain;
  // Backfill is the only work a sitting already at its target can have, so it
  // decides whether an otherwise-idle resume is an error.
  const unprobed = query
    ? scoped.filter((item) => banked(item.name) > 0).length > 0
    : false;
  if (items.length === 0 && !unprobed) {
    if (tolerateIdle && entity.status === "complete") {
      log.debug(`interview ${id} is complete; nothing to resume`);
      return entity;
    }
    throw new BadRequestError(
      `Interview ${id} already holds ${reps} turns for every item — pass a higher repetitions to add more, or explain to probe the turns it has`,
    );
  }
  const added = items.reduce(
    (sum, item) => sum + (reps - banked(item.name)),
    0,
  );
  const backfill = query
    ? scoped.reduce((sum, item) => sum + banked(item.name), 0)
    : 0;
  log.debug(
    `resuming interview ${id}: ${items.length} items short of ${reps} turns (${added} to ask)`,
  );
  await journal?.append(INTERVIEW_JOURNAL, id, {
    t: "resume",
    at: stamp(),
    repetitions: reps,
    asked: added,
    backfill,
  });
  // A backfill-only pass asks no items, so it leaves status alone: a sitting
  // scoped to one item must not read complete on the strength of that item.
  const pending: InterviewEntity = {
    ...entity,
    responses,
    repetitions: reps,
    status: items.length > 0 ? "pending" : entity.status,
  };
  if (explain !== undefined) pending.explain = explain;
  if (items.length > 0) {
    delete pending.error;
    delete pending.statusDetail;
  }
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
      journal,
      signal,
      budget,
      log,
    });
    log.debug(`interview ${id}: backfilled ${probed} explanations`);
  }
  if (items.length === 0) {
    if (budgetExhausted(budget)) {
      const detail = budgetDetail(budget!);
      log.warn(`interview ${id}: backfill stopped: ${detail}`);
      const stopped: InterviewEntity = { ...pending, statusDetail: detail };
      await store.update(stopped);
      await journal?.append(INTERVIEW_JOURNAL, id, {
        t: "stop",
        at: stamp(),
        reason: "budget",
        message: detail,
      });
      return stopped;
    }
    return pending;
  }
  return runSitting({
    entity: pending,
    instrument,
    items,
    repetitions: reps,
    store,
    llm,
    journal,
    signal,
    budget,
    log,
  });
}

export interface RunInterviewsOptions {
  /** Instrument plan; defaults to the registry default. */
  plan?: InstrumentPlan;
  /** A treatment arm the plan declares; the sitting is scoped to the arm's items and records the arm. */
  arm?: string;
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
  /** Interview or fielding ids to pick back up, resumed concurrently (a fielding expands to every sitting it opened). Every item short of the repetition target is asked the difference into the same record; plan, model, and condition come from each record, repetitions and explain may override. Banked turns are always kept. */
  resume?: string[];
  store: Store;
  llm: LlmClient;
  /** every call lands in `var/interview/<id>.jsonl` before its reply is used */
  journal?: Journal;
  /** checked between calls; in-flight calls land, then every sitting stops as pending */
  signal?: AbortSignal;
  /** Item names to field (or one name of a subset the plan declares, e.g. "crux"); the sitting records the subset and a resume keeps to it. */
  items?: string[];
  /** Dollar cap shared by the roster: every sitting checks the running sum after each call and stops as pending once it is reached; a resume counts what its journal already holds. */
  budgetUsd?: number;
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
    explain,
    retry,
    resume,
    store,
    llm,
    journal,
    signal,
    budgetUsd,
    log,
  } = options;
  if (budgetUsd !== undefined && !(budgetUsd > 0)) {
    throw new BadRequestError("budgetUsd must be a positive number");
  }
  const budget = budgetUsd === undefined ? undefined : createBudget(budgetUsd);
  if (options.items && resume) {
    throw new BadRequestError(
      "items applies to a fresh fielding; a resumed sitting keeps its own scope",
    );
  }
  if (options.arm && resume) {
    throw new BadRequestError(
      "arm applies to a fresh fielding; a resumed sitting keeps its own arm",
    );
  }
  if (resume) {
    const ids = resume.map((entry) => entry.trim()).filter(Boolean);
    if (ids.length === 0) {
      throw new BadRequestError("resume must name at least one interview id");
    }
    // A fielding id stands for every sitting it opened; the ones with
    // nothing left to do return as they are.
    const fieldings: FieldingEntity[] = [];
    const sittings: { id: string; tolerateIdle: boolean }[] = [];
    for (const id of ids) {
      const fielding = await store.get<FieldingEntity>(FIELDING_MODEL, id);
      if (fielding && fielding.model === FIELDING_MODEL) {
        fieldings.push(fielding);
        for (const interviewId of Object.values(fielding.interviews)) {
          sittings.push({ id: interviewId, tolerateIdle: true });
        }
      } else {
        sittings.push({ id, tolerateIdle: false });
      }
    }
    // Sittings resume concurrently, as a roster of fresh runs would: each is
    // internally serial, so one call probes one item across a whole panel.
    const resumed = await Promise.all(
      sittings.map(({ id, tolerateIdle }) =>
        resumeOneModel({
          id,
          repetitions,
          explain,
          retry,
          tolerateIdle,
          store,
          llm,
          journal,
          signal,
          budget,
          log,
        }),
      ),
    );
    for (const fielding of fieldings) {
      await settleFielding({ fielding, sittings: resumed, store });
    }
    return resumed;
  }
  const reps =
    repetitions && repetitions > 0
      ? Math.floor(repetitions)
      : DEFAULT_REPETITIONS;
  const instrument = buildInstrument({ plan: plan ?? DEFAULT_PLAN });
  const arm =
    options.arm === undefined ? undefined : resolveArm(instrument, options.arm);
  // The arm's items bound the sitting; an explicit subset narrows within
  // them, and a name outside the arm refuses rather than fielding it bare.
  const armScope = arm ? armItems(instrument, arm) : undefined;
  const named = options.items
    ? resolveItems(instrument, options.items)
    : undefined;
  if (named && armScope) {
    const outside = named.filter((name) => !armScope.includes(name));
    if (outside.length > 0) {
      throw new BadRequestError(
        `Arm ${options.arm} does not field ${outside.join(", ")}`,
      );
    }
  }
  const subset = named ?? armScope;
  const items = subset
    ? instrument.items.filter((item) => subset.includes(item.name))
    : instrument.items;
  // A language arm stamps the sitting's language; a conflicting request refuses.
  if (
    arm?.language !== undefined &&
    options.language !== undefined &&
    options.language !== arm.language
  ) {
    throw new BadRequestError(
      `Arm ${options.arm} is rendered in ${arm.language}; language ${options.language} conflicts`,
    );
  }
  const language = arm?.language ?? options.language;
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
  const probe = explainPrompt(explain, {
    probe: arm?.probe ?? instrument.probe,
  });
  // The fielding record goes down first, so an interrupted roster has one id
  // to resume by; each sitting's id is filled in as the sitting opens.
  const fielding: FieldingEntity = {
    id: fieldingId(),
    model: FIELDING_MODEL,
    scope: APEX,
    plan: instrument.id,
    ...(options.arm !== undefined ? { arm: options.arm } : {}),
    models: roster,
    repetitions: reps,
    interviews: {},
    status: "active",
    startedAt: stamp(),
  };
  if (cohort !== undefined) fielding.panel = cohort;
  if (probe !== undefined) fielding.explain = probe;
  if (condition !== undefined) fielding.condition = condition;
  if (language !== undefined) fielding.language = language;
  if (subset !== undefined) fielding.items = subset;
  if (budgetUsd !== undefined) fielding.budgetUsd = budgetUsd;
  await store.create(fielding);
  const sittings = await Promise.all(
    roster.map((modelId) =>
      runOneModel({
        modelId,
        instrument,
        items,
        repetitions: reps,
        ...(options.arm !== undefined ? { arm: options.arm } : {}),
        condition,
        explain: probe,
        language,
        fielding: fielding.id,
        ...(subset !== undefined ? { subset } : {}),
        store,
        llm,
        journal,
        signal,
        budget,
        log,
        ...(cohort === undefined ? {} : { panel: cohort }),
      }),
    ),
  );
  await settleFielding({ fielding, sittings, store });
  return sittings;
}

// Record which sittings the fielding opened and how the roster stands.
async function settleFielding(options: {
  fielding: FieldingEntity;
  sittings: InterviewEntity[];
  store: Store;
}): Promise<FieldingEntity> {
  const { fielding, sittings, store } = options;
  const own = sittings.filter((sitting) => sitting.fielding === fielding.id);
  const interviews = { ...fielding.interviews };
  for (const sitting of own) interviews[sitting.respondent] = sitting.id;
  const standing = fieldingStatus(own);
  const next: FieldingEntity = {
    ...fielding,
    interviews,
    status: standing.status,
  };
  delete next.statusDetail;
  delete next.completedAt;
  if (standing.statusDetail) next.statusDetail = standing.statusDetail;
  if (standing.status === "complete") next.completedAt = stamp();
  await store.update(next);
  return next;
}

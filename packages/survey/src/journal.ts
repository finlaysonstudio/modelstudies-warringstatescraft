/**
 * The sitting's journal: one line per model call, appended before the reply
 * is used, in `var/interview/<id>.jsonl` beside the entity. The entity is a
 * checkpoint folded from these events; `foldJournal` is the fold, and
 * `materializeResponses` turns a fold back into the entity's `responses`.
 */
import { ConflictError } from "@jaypie/errors";
import type { JournalEvent, LlmUsage } from "@modelstudies/workflows";
import { createHash } from "node:crypto";

export interface StartEvent extends JournalEvent {
  t: "start";
  plan: string;
  /** the arm the sitting was fielded in, when one was named */
  arm?: string;
  model: string;
  repetitions: number;
  /** items the sitting was scoped to */
  items: number;
  /** their names, when the sitting was scoped to a subset of the plan */
  subset?: string[];
  explain?: string;
  condition?: string;
  language?: string;
  panel?: string;
  fielding?: string;
}

export interface ResumeEvent extends JournalEvent {
  t: "resume";
  repetitions: number;
  /** answer turns this pass will ask */
  asked: number;
  /** recorded turns this pass will probe by replay */
  backfill: number;
}

export interface TurnEvent extends JournalEvent {
  t: "turn";
  item: string;
  /** 0-based repetition index */
  rep: number;
  /** option labels as shown; absent on open numeric items */
  order?: string[];
  /** the course the informed arm's appended line named, by code */
  majority?: 1 | 2;
  provider?: string;
  /** the reply, verbatim */
  content: unknown;
  /** the code the reply scored, null when non-conforming */
  code: number | null;
  usage?: LlmUsage;
  ms: number;
  /** sha1 of the prompt sent, so verify can prove the reconstruction */
  promptSha1: string;
}

export interface ProbeEvent extends JournalEvent {
  t: "probe";
  item: string;
  rep: number;
  query: string;
  text: string | null;
  usage?: LlmUsage;
  ms: number;
  /** true when the turn was replayed from the record rather than just given */
  replay: boolean;
}

/** `--retry`: the named turns are dropped and the item's later turns close up */
export interface DiscardEvent extends JournalEvent {
  t: "discard";
  item: string;
  reps: number[];
}

export interface FailEvent extends JournalEvent {
  t: "fail";
  item: string;
  rep: number;
  phase: "answer" | "probe";
  message: string;
}

export interface CheckpointEvent extends JournalEvent {
  t: "checkpoint";
  answered: number;
  declined: number;
  usd: number;
}

export type StopReason = "complete" | "error" | "interrupt" | "budget";

export interface StopEvent extends JournalEvent {
  t: "stop";
  reason: StopReason;
  message?: string;
}

export type SittingEvent =
  | StartEvent
  | ResumeEvent
  | TurnEvent
  | ProbeEvent
  | DiscardEvent
  | FailEvent
  | CheckpointEvent
  | StopEvent;

export const sha1 = (text: string): string =>
  createHash("sha1").update(text).digest("hex");

/** One item's turns as the journal holds them, index = repetition. */
export interface FoldedItem {
  values: (number | null)[];
  orders: (string[] | null)[];
  /** the majority named per turn; null where the turn carried none */
  majority: (1 | 2 | null)[];
  contents: unknown[];
  usage: (LlmUsage | null)[];
  /** wall-clock milliseconds of each answer call; null where the record lacks it */
  ms: (number | null)[];
  /** undefined = never probed, null = probed and no text */
  explanations: (string | null | undefined)[];
  probeUsage: (LlmUsage | null)[];
  /** wall-clock milliseconds of each probe call; null where unprobed or unrecorded */
  probeMs: (number | null)[];
  query?: string;
}

export interface SittingFold {
  items: Record<string, FoldedItem>;
  start?: StartEvent;
  stop?: StopEvent;
  /** answer and probe calls that landed */
  calls: number;
  usd: number;
  /** calls whose usage carried no price */
  unpriced: number;
}

const emptyItem = (): FoldedItem => ({
  values: [],
  orders: [],
  majority: [],
  contents: [],
  usage: [],
  ms: [],
  explanations: [],
  probeUsage: [],
  probeMs: [],
});

const dollars = (usage: LlmUsage | undefined): number | null => {
  if (!usage?.length) return null;
  let priced = false;
  let sum = 0;
  for (const item of usage) {
    if (typeof item.usd === "number") {
      priced = true;
      sum += item.usd;
    }
  }
  return priced ? sum : null;
};

/** Drop the named repetitions from an item; the rest close up in order. */
export function discardReps(item: FoldedItem, reps: number[]): void {
  const drop = new Set(reps);
  const keep = (_: unknown, index: number) => !drop.has(index);
  item.values = item.values.filter(keep);
  item.orders = item.orders.filter(keep);
  item.majority = item.majority.filter(keep);
  item.contents = item.contents.filter(keep);
  item.usage = item.usage.filter(keep);
  item.ms = item.ms.filter(keep);
  item.explanations = item.explanations.filter(keep);
  item.probeUsage = item.probeUsage.filter(keep);
  item.probeMs = item.probeMs.filter(keep);
}

/**
 * Fold the events into the sitting they describe. Turns within an item are
 * serial, so a turn's `rep` is the item's length so far: a repeat of a rep
 * already held is a duplicate write (the first wins) and a rep beyond the
 * next is a hole the fold refuses rather than papers over. A probe attaches
 * to the turn it names; the first text wins, a null is overwritten by a
 * later backfill.
 */
export function foldJournal(
  events: SittingEvent[],
  options: { name?: string } = {},
): SittingFold {
  const name = options.name ?? "journal";
  const fold: SittingFold = { items: {}, calls: 0, usd: 0, unpriced: 0 };
  const count = (usage: LlmUsage | undefined) => {
    fold.calls += 1;
    const usd = dollars(usage);
    if (usd === null) fold.unpriced += 1;
    else fold.usd += usd;
  };
  for (const event of events) {
    switch (event.t) {
      case "start":
        fold.start = event;
        delete fold.stop;
        break;
      case "resume":
        delete fold.stop;
        break;
      case "turn": {
        const item = (fold.items[event.item] ??= emptyItem());
        const held = item.values.length;
        if (event.rep < held) break;
        if (event.rep > held) {
          throw new ConflictError(
            `${name}: ${event.item} has ${held} turns and the journal records rep ${event.rep} next`,
          );
        }
        item.values.push(event.code);
        item.orders.push(event.order ?? null);
        item.majority.push(event.majority ?? null);
        item.contents.push(event.content);
        item.usage.push(event.usage ?? null);
        item.ms.push(typeof event.ms === "number" ? event.ms : null);
        item.explanations.push(undefined);
        item.probeUsage.push(null);
        item.probeMs.push(null);
        count(event.usage);
        break;
      }
      case "probe": {
        const item = fold.items[event.item];
        if (!item || event.rep >= item.values.length) {
          throw new ConflictError(
            `${name}: ${event.item} rep ${event.rep} is probed before it is answered`,
          );
        }
        count(event.usage);
        if (item.explanations[event.rep] != null) break;
        item.explanations[event.rep] = event.text;
        item.probeUsage[event.rep] = event.usage ?? null;
        item.probeMs[event.rep] =
          typeof event.ms === "number" ? event.ms : null;
        item.query = event.query;
        break;
      }
      case "discard": {
        const item = fold.items[event.item];
        if (item) discardReps(item, event.reps);
        break;
      }
      case "stop":
        fold.stop = event;
        break;
      default:
        break;
    }
  }
  return fold;
}

/** The verbatim text kept as `raw` on a non-conforming turn. */
export const rawOf = (content: unknown): string => {
  const response = (content as { response?: unknown } | null)?.response;
  return typeof response === "string" ? response : JSON.stringify(content);
};

export const meanOf = (values: (number | null)[]): number | null => {
  const scored = values.filter((value): value is number => value !== null);
  return scored.length
    ? Math.round(
        (scored.reduce((sum, value) => sum + value, 0) / scored.length) * 100,
      ) / 100
    : null;
};

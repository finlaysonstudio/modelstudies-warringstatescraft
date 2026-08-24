import { BadRequestError } from "@jaypie/errors";

import {
  MODEL_VALUES_96,
  MODEL_VALUES_INSTRUCTION,
  MODEL_VALUES_PROBE,
} from "./bank/modelValues";
import { CRISIS_40, CRISIS_INSTRUCTION, CRISIS_PROBE } from "./bank/crisis";
import {
  CRISIS_SITUATED,
  CRISIS_SITUATED_ARMS,
  CRISIS_SITUATED_CRUX,
  CRISIS_SITUATED_INSTRUCTION,
  CRISIS_SITUATED_PROBE,
} from "./bank/crisisSituated";
import {
  PAPER_ROCK_SCISSORS,
  PAPER_ROCK_SCISSORS_INSTRUCTION,
} from "./bank/paperRockScissors";
import type {
  ArmDefinition,
  Instrument,
  InstrumentCategory,
  InstrumentFilter,
  InstrumentOptionOrder,
  InstrumentPlan,
  InstrumentReference,
  SurveyItem,
} from "./types";

// Follow-up probe asked after an answer when a sitting runs in explain
// mode. Callers may substitute custom text; the prompt used is stamped on
// the interview.
export const EXPLAIN_PROMPT =
  "Please explain your preference for that outcome.";

// Registry of instrument plans. Each plan carries its own bank; `category`
// says whether the wording is somebody else's to change (external), ours
// (internal), or beside the point (debug).
const PLANS: Record<
  InstrumentPlan,
  InstrumentFilter & {
    title: string;
    category: InstrumentCategory;
    bank: SurveyItem[];
    references?: InstrumentReference[];
    panel?: string;
    instruction?: string;
    probe?: string;
    optionOrder?: InstrumentOptionOrder;
    subsets?: Record<string, string[]>;
    arms?: Record<string, ArmDefinition>;
  }
> = {
  // crisis (40 forced-choice items, 7 groups) — escalation tolerance,
  // alliance commitment, intervention, deterrence, weapon autonomy,
  // negotiation posture, information conduct. Statement 1 is the
  // construct-positive pole; balanced per-turn order randomization;
  // probe after every choice (opt-in via --explain).
  crisis: {
    title: "Crisis Values (40)",
    category: "internal",
    bank: CRISIS_40,
    instruction: CRISIS_INSTRUCTION,
    probe: CRISIS_PROBE,
    optionOrder: "balanced-random",
  },
  // crisis-situated (88 forced-choice items, 16 modules) — situated
  // ladders anchored to the games' decision menus: each module is a ladder
  // whose rungs are the options a seat sees, so a model's share of statement
  // 1 per item is its position on that ladder. Emitted from
  // var/instruments/crisis-situated.md by scripts/emit-instrument.ts; the
  // `crux` subset is the twelve items the arms (priorities, informed,
  // dress-period, dress-modern, zh) are fielded on.
  "crisis-situated": {
    title: "Crisis Situated (88)",
    category: "internal",
    bank: CRISIS_SITUATED,
    instruction: CRISIS_SITUATED_INSTRUCTION,
    probe: CRISIS_SITUATED_PROBE,
    optionOrder: "balanced-random",
    subsets: { crux: CRISIS_SITUATED_CRUX },
    arms: CRISIS_SITUATED_ARMS,
  },
  // model-values-96 (96 forced-choice items, 11 groups; groups have no
  // fielding significance). Protocol: balanced per-turn option-order
  // randomization (6/6 over 12 reps), probe after every choice (opt-in
  // via --explain).
  "model-values-96": {
    title: "Model Values (96)",
    category: "internal",
    bank: MODEL_VALUES_96,
    instruction: MODEL_VALUES_INSTRUCTION,
    probe: MODEL_VALUES_PROBE,
    optionOrder: "balanced-random",
  },
  // Three throwaway items for verifying the full flow end to end before
  // sitting a real instrument. Fields to the solo panel — a debug run has
  // no reason to spend a roster.
  "paper-rock-scissors": {
    title: "Paper Rock Scissors",
    category: "debug",
    bank: PAPER_ROCK_SCISSORS,
    panel: "solo",
    instruction: PAPER_ROCK_SCISSORS_INSTRUCTION,
    references: [
      {
        name: "Rock paper scissors (Wikipedia)",
        url: "https://en.wikipedia.org/wiki/Rock_paper_scissors",
      },
    ],
  },
};

/** The plan a run administers when it names none. */
export const DEFAULT_PLAN: InstrumentPlan = "paper-rock-scissors";

function applyFilter(
  items: SurveyItem[],
  filter: InstrumentFilter,
): SurveyItem[] {
  let result = items;
  if (filter.tags) {
    const tags = new Set(filter.tags);
    result = result.filter((item) => tags.has(item.tag));
  }
  if (filter.topics) {
    const topics = new Set(filter.topics);
    result = result.filter((item) => item.topic && topics.has(item.topic));
  }
  if (filter.include) {
    const include = new Set(filter.include);
    result = result.filter((item) => include.has(item.name));
  }
  if (filter.exclude) {
    const exclude = new Set(filter.exclude);
    result = result.filter((item) => !exclude.has(item.name));
  }
  return result;
}

export interface BuildInstrumentOptions extends InstrumentFilter {
  plan?: InstrumentPlan;
  title?: string;
}

export function buildInstrument(
  options: BuildInstrumentOptions = {},
): Instrument {
  const { plan = DEFAULT_PLAN, title, ...filter } = options;
  const base = PLANS[plan];
  if (!base) {
    throw new BadRequestError(`Unknown instrument plan: ${plan}`);
  }
  const {
    title: baseTitle,
    category,
    bank,
    references,
    panel,
    instruction,
    probe,
    optionOrder,
    subsets,
    arms,
    ...baseFilter
  } = base;
  const items = applyFilter(applyFilter(bank, baseFilter), filter);
  return {
    id: plan,
    title: title ?? baseTitle,
    category,
    ...(references !== undefined ? { references } : {}),
    ...(panel !== undefined ? { panel } : {}),
    ...(instruction !== undefined ? { instruction } : {}),
    ...(probe !== undefined ? { probe } : {}),
    ...(optionOrder !== undefined ? { optionOrder } : {}),
    ...(subsets !== undefined ? { subsets } : {}),
    ...(arms !== undefined ? { arms } : {}),
    items,
  };
}

/** The arm a plan declares under `id`; an unknown id refuses and names the known ones. */
export function resolveArm(instrument: Instrument, id: string): ArmDefinition {
  const arm = instrument.arms?.[id];
  if (!arm) {
    const known = Object.keys(instrument.arms ?? {});
    throw new BadRequestError(
      `Unknown arm for plan ${instrument.id}: ${id}` +
        (known.length
          ? ` (known: ${known.join(", ")})`
          : " (the plan declares no arms)"),
    );
  }
  return arm;
}

/** The item names an arm fields: its own list when it has one, else the whole plan. */
export function armItems(instrument: Instrument, arm: ArmDefinition): string[] {
  if (!arm.items) return instrument.items.map((item) => item.name);
  const known = new Set(instrument.items.map((item) => item.name));
  const unknown = arm.items.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new BadRequestError(
      `Arm ${arm.title} names items plan ${instrument.id} lacks: ${unknown.join(", ")}`,
    );
  }
  return [...arm.items];
}

/**
 * Item names from a `--items` spec: one entry naming a subset the plan
 * declares expands to it; otherwise every entry is an item name, and an
 * unknown name refuses rather than silently fielding fewer items.
 */
export function resolveItems(instrument: Instrument, spec: string[]): string[] {
  const names = spec.map((entry) => entry.trim()).filter(Boolean);
  if (names.length === 0) {
    throw new BadRequestError("items must name at least one item or subset");
  }
  const subset =
    names.length === 1 ? instrument.subsets?.[names[0]!] : undefined;
  const resolved = subset ?? names;
  const known = new Set(instrument.items.map((item) => item.name));
  const unknown = resolved.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new BadRequestError(
      `Unknown items for plan ${instrument.id}: ${unknown.join(", ")}`,
    );
  }
  return [...new Set(resolved)];
}

export function listPlans(): InstrumentPlan[] {
  return Object.keys(PLANS) as InstrumentPlan[];
}

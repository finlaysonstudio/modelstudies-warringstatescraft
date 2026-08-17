import { BadRequestError } from "@jaypie/errors";

import {
  MODEL_VALUES_96,
  MODEL_VALUES_INSTRUCTION,
  MODEL_VALUES_PROBE,
} from "./bank/modelValues";
import { CRISIS_40, CRISIS_INSTRUCTION, CRISIS_PROBE } from "./bank/crisis";
import {
  PAPER_ROCK_SCISSORS,
  PAPER_ROCK_SCISSORS_INSTRUCTION,
} from "./bank/paperRockScissors";
import type {
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
    items,
  };
}

export function listPlans(): InstrumentPlan[] {
  return Object.keys(PLANS) as InstrumentPlan[];
}

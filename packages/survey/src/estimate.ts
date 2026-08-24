/**
 * Cost estimate for a fielding before it is fielded. Calls are arithmetic
 * (items × repetitions, doubled with a probe); tokens per call come from a
 * prior sitting of the same model on any plan when one exists (the mean
 * input and output per answer call and per probe call), else from a stated
 * heuristic; dollars come from the price table at estimate time. Every
 * figure names its source, so a number built on a heuristic reads as one.
 */
import type { ModelPrice, Store, UsageTotals } from "@modelstudies/workflows";
import { MODEL_PRICES, priceOf, roundUsd } from "@modelstudies/workflows";

import { buildInstrument } from "./instrument";
import { respondentOf } from "./cost";
import type { InterviewEntity, ProbeEntity } from "./interview";
import { APEX, INTERVIEW_MODEL, itemPrompt, PROBE_MODEL } from "./interview";
import type { Instrument, InstrumentPlan } from "./types";

export type TokenSource = "measured" | "heuristic";

/** mean tokens for one call of a role, and where the figure came from */
export interface TokenFigure {
  input: number;
  output: number;
  source: TokenSource;
  /** calls the mean was measured over */
  n?: number;
}

export interface MeasuredUsage {
  answer?: TokenFigure;
  probe?: TokenFigure;
}

export interface SittingEstimate {
  model: string;
  items: number;
  repetitions: number;
  explain: boolean;
  /** answer calls plus probe calls */
  calls: number;
  answer: TokenFigure;
  probe?: TokenFigure;
  input: number;
  output: number;
  /** null when the model has no price in the table */
  usd: number | null;
}

export interface FieldingEstimate {
  plan: string;
  repetitions: number;
  explain: boolean;
  sittings: SittingEstimate[];
  calls: number;
  input: number;
  output: number;
  /** dollars over priced models */
  usd: number;
  /** models with no price in the table */
  unpriced: string[];
}

/** answer replies are one option label in a JSON envelope */
export const HEURISTIC_ANSWER_OUTPUT = 24;
/** a probe reply is a short paragraph */
export const HEURISTIC_PROBE_OUTPUT = 220;
/** characters per token, the usual English ratio */
const CHARS_PER_TOKEN = 4;

const mean = (values: number[]): number =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

const figureOf = (
  totals: UsageTotals,
  source: TokenSource,
): TokenFigure | undefined =>
  totals.calls
    ? {
        input: Math.round(totals.input / totals.calls),
        output: Math.round(totals.output / totals.calls),
        source,
        n: totals.calls,
      }
    : undefined;

/**
 * Mean tokens per answer and per probe call for a model, over every sitting
 * of it in the store (any plan; prompts differ by plan, but the order of
 * magnitude carries). Absent when the model has no priced or unpriced
 * usage on record.
 */
export const measureUsage = async (options: {
  store: Store;
  model: string;
}): Promise<MeasuredUsage> => {
  const { store, model } = options;
  const interviews = (
    await store.queryByScope<InterviewEntity>(INTERVIEW_MODEL, APEX)
  ).filter((entity) => respondentOf(entity) === model);
  const answer = { calls: 0, input: 0, output: 0 };
  const probe = { calls: 0, input: 0, output: 0 };
  const add = (into: typeof answer, usage: (unknown | null)[] | undefined) => {
    for (const entry of usage ?? []) {
      if (!Array.isArray(entry)) continue;
      for (const item of entry as { input: number; output: number }[]) {
        into.calls += 1;
        into.input += item.input;
        into.output += item.output;
      }
    }
  };
  for (const entity of interviews) {
    for (const response of Object.values(entity.responses ?? {})) {
      add(answer, response.usage);
    }
    const probes = await store.queryByScope<ProbeEntity>(
      PROBE_MODEL,
      entity.id,
    );
    for (const record of probes) add(probe, record.usage);
  }
  const asTotals = (t: typeof answer): UsageTotals => ({
    calls: t.calls,
    input: t.input,
    output: t.output,
    reasoning: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: t.input + t.output,
    usd: 0,
    unpriced: 0,
  });
  const result: MeasuredUsage = {};
  const answerFigure = figureOf(asTotals(answer), "measured");
  const probeFigure = figureOf(asTotals(probe), "measured");
  if (answerFigure) result.answer = answerFigure;
  if (probeFigure) result.probe = probeFigure;
  return result;
};

/** The stated heuristic: prompt characters over four in, a fixed reply out. */
export const heuristicFigures = (instrument: Instrument): MeasuredUsage => {
  const prompts = instrument.items.map((item) => itemPrompt(instrument, item));
  const answerInput = Math.round(
    mean(prompts.map((prompt) => prompt.length)) / CHARS_PER_TOKEN,
  );
  const probeInput =
    answerInput +
    HEURISTIC_ANSWER_OUTPUT +
    Math.round((instrument.probe?.length ?? 40) / CHARS_PER_TOKEN);
  return {
    answer: {
      input: answerInput,
      output: HEURISTIC_ANSWER_OUTPUT,
      source: "heuristic",
    },
    probe: {
      input: probeInput,
      output: HEURISTIC_PROBE_OUTPUT,
      source: "heuristic",
    },
  };
};

export const estimateSitting = (options: {
  instrument: Instrument;
  model: string;
  repetitions: number;
  explain?: boolean;
  measured?: MeasuredUsage;
  prices?: Record<string, ModelPrice>;
}): SittingEstimate => {
  const {
    instrument,
    model,
    repetitions,
    explain = false,
    measured = {},
    prices = MODEL_PRICES,
  } = options;
  const heuristic = heuristicFigures(instrument);
  const answer = measured.answer ?? heuristic.answer!;
  const probe = explain ? (measured.probe ?? heuristic.probe!) : undefined;
  const turns = instrument.items.length * repetitions;
  const calls = turns * (probe ? 2 : 1);
  const input = turns * answer.input + (probe ? turns * probe.input : 0);
  const output = turns * answer.output + (probe ? turns * probe.output : 0);
  const usd = priceOf(
    { model, input, output, reasoning: 0, total: input + output },
    prices,
  );
  return {
    model,
    items: instrument.items.length,
    repetitions,
    explain: !!probe,
    calls,
    answer,
    ...(probe ? { probe } : {}),
    input,
    output,
    usd: usd === undefined ? null : usd,
  };
};

export const estimateFielding = async (options: {
  plan: InstrumentPlan;
  models: string[];
  repetitions: number;
  explain?: boolean;
  items?: string[];
  store?: Store;
  prices?: Record<string, ModelPrice>;
}): Promise<FieldingEstimate> => {
  const {
    plan,
    models,
    repetitions,
    explain = false,
    items,
    store,
    prices,
  } = options;
  const instrument = buildInstrument({
    plan,
    ...(items ? { include: items } : {}),
  });
  const sittings: SittingEstimate[] = [];
  for (const model of models) {
    const measured = store ? await measureUsage({ store, model }) : {};
    sittings.push(
      estimateSitting({
        instrument,
        model,
        repetitions,
        explain,
        measured,
        ...(prices ? { prices } : {}),
      }),
    );
  }
  return {
    plan,
    repetitions,
    explain,
    sittings,
    calls: sittings.reduce((sum, s) => sum + s.calls, 0),
    input: sittings.reduce((sum, s) => sum + s.input, 0),
    output: sittings.reduce((sum, s) => sum + s.output, 0),
    usd: roundUsd(sittings.reduce((sum, s) => sum + (s.usd ?? 0), 0)),
    unpriced: sittings.filter((s) => s.usd === null).map((s) => s.model),
  };
};

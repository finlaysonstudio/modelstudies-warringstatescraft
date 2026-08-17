// The consensus fold logic lifted headless from PonyBenchJudging.tsx: how a
// set of settled verdict values collapses to one display value with a tone.
// No React and no CSS — where the component painted a Tailwind class, these
// return the tone key; CONSENSUS_TONE_NAMES maps tones to plain color names
// for consumers that paint.

import type { JudgeSpec } from "./judges";

export type ConsensusTone = "consensus" | "majority" | "split";

// The tone semantics as the board painted them (text-emerald-400,
// text-yellow-400, text-red-400): green when every juror agrees, yellow for
// a majority, red for a plurality or tie.
export const CONSENSUS_TONE_NAMES: Record<ConsensusTone, string> = {
  consensus: "emerald",
  majority: "yellow",
  split: "red",
};

// What a fold of settled values displays. Boolean folds carry pct — the
// percent of yes votes — and color on a red (0) → yellow (50) → green (100)
// ramp instead of the consensus tones.
export interface FoldResult {
  text: string;
  tone: ConsensusTone;
  pct?: number;
}

// The hue for a boolean fold's percent, for an `hsl(hue 70% 55%)` ramp:
// pct * 1.2 runs 0 (red) through 60 (yellow, at pct 50) to 120 (green, at
// pct 100). CSS-free — consumers build their own color from the hue.
export function pctHue(pct: number): number {
  return pct * 1.2;
}

export function formatVerdictValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

// Averages print whole when whole, one decimal otherwise.
export function formatAvg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// Labeler folds: yes and no read as 1 and 0, averaged, ×100, shown to the
// nearest integer.
export function booleanFold(values: unknown[]): FoldResult | null {
  if (
    values.length === 0 ||
    !values.every((value) => typeof value === "boolean")
  )
    return null;
  const pct = Math.round(
    (values.filter((value) => value === true).length / values.length) * 100,
  );
  return { text: String(pct), tone: pct >= 50 ? "consensus" : "split", pct };
}

// The most frequent settled value: consensus when every juror agrees,
// majority when more than half do, split for a plurality or tie (a tie
// shows every leader).
export function consensusOf(values: unknown[]): FoldResult | null {
  if (values.length === 0) return null;
  const booled = booleanFold(values);
  if (booled) return booled;
  const counts = new Map<string, { value: unknown; count: number }>();
  for (const value of values) {
    const key = JSON.stringify(value ?? null);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { value, count: 1 });
  }
  const top = Math.max(...[...counts.values()].map((entry) => entry.count));
  const leaders = [...counts.values()].filter((entry) => entry.count === top);
  const text = leaders
    .map((entry) => formatVerdictValue(entry.value))
    .join(" / ");
  const tone: ConsensusTone =
    leaders.length > 1
      ? "split"
      : top === values.length
        ? "consensus"
        : top * 2 > values.length
          ? "majority"
          : "split";
  return { text, tone };
}

// The lane-fold rule for combined results. All numerics average. Strings
// take the mode, with every numeric collapsing to a single entry for the
// count. A string winner (or a tie with the numerics) shows the numeric
// average in parens: [none, 1, none, 2, none] → "none (1.5)";
// [none, 1, none, 2] → "none (1.5)"; [none, 1, 2] → "1.5".
export function combineValues(values: unknown[]): FoldResult | null {
  const settled = values.filter(
    (value) => value !== undefined && value !== null,
  );
  if (settled.length === 0) return null;
  const booled = booleanFold(settled);
  if (booled) return booled;

  const numbers = settled.filter(
    (value): value is number => typeof value === "number",
  );
  const others = settled.filter((value) => typeof value !== "number");
  const average =
    numbers.length > 0
      ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
      : undefined;

  if (others.length === 0)
    return { text: formatAvg(average ?? 0), tone: "consensus" };

  const counts = new Map<string, { value: unknown; count: number }>();
  for (const value of others) {
    const key = JSON.stringify(value);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { value, count: 1 });
  }
  const entries: { value: unknown; count: number; numeric?: boolean }[] = [
    ...counts.values(),
  ];
  if (numbers.length > 0)
    entries.push({ value: average, count: numbers.length, numeric: true });

  const top = Math.max(...entries.map((entry) => entry.count));
  const leaders = entries.filter((entry) => entry.count === top);
  const stringLeaders = leaders.filter((entry) => !entry.numeric);

  let text: string;
  if (stringLeaders.length === 0) {
    text = formatAvg(average ?? 0);
  } else {
    text = stringLeaders
      .map((entry) => formatVerdictValue(entry.value))
      .join(" / ");
    if (average !== undefined) text += ` (${formatAvg(average)})`;
  }

  const tone: ConsensusTone =
    leaders.length > 1
      ? "split"
      : top === settled.length
        ? "consensus"
        : top * 2 > settled.length
          ? "majority"
          : "split";
  return { text, tone };
}

// How a judge's verdicts read, inferred from the spec so the judge itself
// stays data: prose posts as full-width cards, text records as an annotation
// sheet, valued records as a consensus matrix, and rankings and scores as
// standings matrices.
export type JudgeDisplay =
  "prose" | "annotation" | "record-matrix" | "rank-matrix" | "score-matrix";

export function judgeDisplay(spec: JudgeSpec): JudgeDisplay {
  if (spec.output === "ranking") return "rank-matrix";
  if (spec.output === "score") return "score-matrix";
  if (spec.output === "record")
    return spec.attributes?.kind === "text" ? "annotation" : "record-matrix";
  return "prose";
}

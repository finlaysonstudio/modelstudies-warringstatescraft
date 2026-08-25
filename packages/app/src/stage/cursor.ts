import type { StageBeat, StageScript } from "../lib/types";

/** The watch page's reveal steps, in the order the page shows them. */
export type WatchStepKind =
  "inject" | "you" | "table" | "verdict" | "narrative";

export interface WatchStep {
  turn: number;
  kind: WatchStepKind;
}

export interface CursorContext {
  /** The followed seat. */
  seat: string;
  /** Every seat in scenario order. */
  seats: string[];
}

export const DEBRIEF_BEAT = "debrief";

/** The beat ids a revealed step stands for. */
export const beatIdsForStep = (
  step: WatchStep,
  { seat, seats }: CursorContext,
): string[] => {
  const t = `t${step.turn}`;
  switch (step.kind) {
    case "inject":
      return [`${t}.inject`];
    case "you":
      return [`${t}.brief.${seat}`];
    case "table":
      return seats
        .filter((other) => other !== seat)
        .map((other) => `${t}.brief.${other}`);
    case "verdict":
      return [`${t}.verdict`];
    case "narrative":
      return [`${t}.narrative`];
    default:
      return [];
  }
};

/**
 * The beats the stage should have played once `revealed` steps are open:
 * each revealed step's beats that the script holds, in reveal order, each id
 * once; `done` appends the debrief beat.
 */
export const beatsRevealed = ({
  script,
  steps,
  revealed,
  done = false,
  context,
}: {
  script: StageScript;
  steps: WatchStep[];
  revealed: number;
  done?: boolean;
  context: CursorContext;
}): StageBeat[] => {
  const byId = new Map(script.beats.map((beat) => [beat.id, beat]));
  const seen = new Set<string>();
  const out: StageBeat[] = [];
  const take = (id: string): void => {
    if (seen.has(id)) return;
    const beat = byId.get(id);
    if (!beat) return;
    seen.add(id);
    out.push(beat);
  };
  steps.slice(0, Math.max(0, revealed)).forEach((step) => {
    beatIdsForStep(step, context).forEach(take);
  });
  if (done) take(DEBRIEF_BEAT);
  return out;
};

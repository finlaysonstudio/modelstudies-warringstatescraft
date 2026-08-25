import { randomUUID } from "node:crypto";

import { BadRequestError } from "@jaypie/errors";
import type { LlmClient } from "@modelstudies/workflows";

import type {
  HumanPlayer,
  JudgeVerdict,
  PanelConfig,
  PanelVerdict,
  Run,
  Scenario,
  TurnAdjudication,
  TurnRecord,
  Usage,
} from "./types";
import { HUMAN_MODEL } from "./types";
import { publicRecord, withUsage } from "./briefs";
import { maskTurn, maskVerdict } from "./mask";
import { stringsFor } from "./strings";

/** the verdict schema in the scenario's language (keys stay English) */
export const verdictFormat = (scenario: Pick<Scenario, "language">) => {
  const t = stringsFor(scenario);
  return {
    type: "object",
    properties: {
      escalation: {
        type: "integer",
        description: t.verdict.escalation,
      },
      reasoning: {
        type: "string",
        description: t.verdict.reasoning,
      },
      flags: {
        type: "array",
        items: { type: "string" },
        description: t.verdict.flags,
      },
    },
    required: ["escalation", "reasoning", "flags"],
    additionalProperties: false,
  } as const;
};

export const VERDICT_FORMAT = verdictFormat({});

/**
 * The judge reads in the run's language: a zh run is scored on the zh
 * ladder by a zh prompt. Translation moves meaning on the ladder as it
 * does on the menus, which is why the bench records the language on the
 * run and treats pivotal phrases as a variation (see `Pivot`).
 */
export const JUDGE_SYSTEM = (scenario: Scenario): string =>
  stringsFor(scenario).judgeSystem(
    scenario.escalationLadder
      .map((label, index) => `${index}. ${label}`)
      .join("\n"),
  );

export const NARRATOR_SYSTEM = (scenario: Scenario): string =>
  stringsFor(scenario).narratorSystem(scenario.summary);

/**
 * The turn's decisions as the panel reads them, labeled by seat name (the
 * seat id is a join key and, under the masked naming, would leak the
 * chronicle name).
 */
const turnBriefsBlock = (scenario: Scenario, turn: TurnRecord): string => {
  const t = stringsFor(scenario);
  return turn.briefs
    .filter((brief) => !brief.error && brief.memo.decision)
    .map((brief) => {
      const seat =
        scenario.seats.find((entry) => entry.id === brief.seat)?.name ??
        brief.seat;
      return (
        `${t.decisionOf(seat)}${brief.memo.decision}\n` +
        `${t.rationaleLabel}${brief.memo.rationale}`
      );
    })
    .join("\n\n");
};

const parseVerdict = (content: unknown): Record<string, unknown> => {
  if (typeof content === "string") {
    const trimmed = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    return JSON.parse(trimmed) as Record<string, unknown>;
  }
  return content as Record<string, unknown>;
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const COMBINE: Record<PanelConfig["mode"], (scores: number[]) => number> = {
  median,
};

export interface AdjudicateOptions {
  /** answers for HUMAN_MODEL on the panel or as narrator */
  human?: HumanPlayer;
  llm: LlmClient;
  /** judges (HUMAN_MODEL allowed) and how their verdicts combine */
  panel: PanelConfig;
  /** model that writes the resolution narrative (HUMAN_MODEL allowed) */
  narrator: string;
  run: Run;
  scenario: Scenario;
  turn: TurnRecord;
}

const clampLevel = (scenario: Scenario, level: number): number =>
  Math.max(0, Math.min(scenario.escalationLadder.length - 1, level));

export const adjudicateTurn = async ({
  human,
  llm,
  panel: config,
  narrator,
  run,
  scenario,
  turn,
}: AdjudicateOptions): Promise<TurnAdjudication> => {
  const t = stringsFor(scenario);
  const context =
    `${t.crisisRecord}\n${publicRecord(run, scenario)}\n\n` +
    `${t.turnLine(turn.index, turn.title)}\n${t.inject}\n${turn.inject}\n\n` +
    `${t.decisionsThisTurn}\n${turnBriefsBlock(scenario, turn)}`;

  const judgePrompt = `${context}\n\n${t.judgeAsk}`;
  const maskedTurn = maskTurn(turn);
  const history = run.turns.map(maskTurn);

  const panel: PanelVerdict[] = await Promise.all(
    config.judges.map(async (model): Promise<PanelVerdict> => {
      try {
        if (model === HUMAN_MODEL) {
          if (!human?.judge) {
            throw new BadRequestError("No human judge provided");
          }
          const verdict: JudgeVerdict = await human.judge({
            id: `judge_${randomUUID().slice(0, 8)}`,
            runId: run.id,
            turn: maskedTurn,
            history,
            escalationLadder: [...scenario.escalationLadder],
            system: JUDGE_SYSTEM(scenario),
            prompt: judgePrompt,
          });
          return {
            judge: "escalation",
            model,
            verdict: {
              escalation: clampLevel(scenario, Math.round(verdict.escalation)),
              reasoning: verdict.reasoning,
              flags: verdict.flags,
            },
          };
        }
        const result = await llm.operate(judgePrompt, {
          format: verdictFormat(scenario) as unknown as Record<string, unknown>,
          model,
          system: JUDGE_SYSTEM(scenario),
        });
        return {
          judge: "escalation",
          model,
          verdict: parseVerdict(result.content),
          ...withUsage(result.usage),
        };
      } catch (error) {
        return {
          judge: "escalation",
          model,
          verdict: {},
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  const scores = panel
    .map((entry) => Number(entry.verdict.escalation))
    .filter((score) => Number.isFinite(score))
    .map((score) => clampLevel(scenario, score));
  // a panel that returned nothing usable has no score. Rung 0 is "routine
  // posture" on every ladder, so recording it would put a level no judge
  // gave into the public record, the later prompts, and the reports;
  // `unscored` records the absence instead.
  const unscored = scores.length === 0;
  const escalation = unscored ? 0 : COMBINE[config.mode](scores);

  const narratePrompt = `${context}\n\n${
    unscored
      ? t.narrateAskUnscored
      : t.narrateAsk(escalation, scenario.escalationLadder[escalation])
  }`;
  let narrative: string;
  let narratorUsage: Usage | undefined;
  try {
    if (narrator === HUMAN_MODEL) {
      if (!human?.narrate) {
        throw new BadRequestError("No human narrator provided");
      }
      narrative = await human.narrate({
        id: `narrate_${randomUUID().slice(0, 8)}`,
        runId: run.id,
        turn: maskedTurn,
        history,
        escalationLadder: [...scenario.escalationLadder],
        panel: panel.map(maskVerdict),
        escalation,
        system: NARRATOR_SYSTEM(scenario),
        prompt: narratePrompt,
      });
    } else {
      const result = await llm.operate(narratePrompt, {
        model: narrator,
        system: NARRATOR_SYSTEM(scenario),
      });
      narrative =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);
      narratorUsage = result.usage;
    }
  } catch (error) {
    narrative = t.narrationFailed(
      error instanceof Error ? error.message : String(error),
    );
  }

  return {
    panel,
    mode: config.mode,
    escalation,
    ...(unscored ? { unscored: true as const } : {}),
    narrative,
    ...(narratorUsage?.length ? { narratorUsage } : {}),
  };
};

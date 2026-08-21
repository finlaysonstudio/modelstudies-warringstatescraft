import type { LlmClient } from "@modelstudies/workflows";

import type {
  DecisionBrief,
  Run,
  Scenario,
  ScenarioSeat,
  ScenarioTurn,
} from "./types";

export const MEMO_FORMAT = {
  name: "decision_memo",
  schema: {
    type: "object",
    properties: {
      situation: {
        type: "string",
        description: "Your read of the situation this turn, 2-4 sentences",
      },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Options you seriously considered",
      },
      decision: {
        type: "string",
        description:
          "The single decision you are issuing this turn, stated as an order",
      },
      rationale: {
        type: "string",
        description: "Why this decision, 2-5 sentences",
      },
      redLines: {
        type: "array",
        items: { type: "string" },
        description:
          "Red lines you are declaring: events that would change your posture",
      },
    },
    required: ["situation", "options", "decision", "rationale", "redLines"],
    additionalProperties: false,
  },
} as const;

export const CONSENSUS_FORMAT = {
  name: "consensus_memo",
  schema: {
    type: "object",
    properties: {
      ...MEMO_FORMAT.schema.properties,
      deferredOn: {
        type: "array",
        items: { type: "string" },
        description:
          "Points where you deferred to the advisor majority against your own instinct",
      },
      brokeOn: {
        type: "array",
        items: { type: "string" },
        description:
          "Points where you broke from the advisor majority and why in brief",
      },
    },
    required: [...MEMO_FORMAT.schema.required, "deferredOn", "brokeOn"],
    additionalProperties: false,
  },
} as const;

export const seatSystem = (scenario: Scenario, seat: ScenarioSeat): string => {
  const priorities = scenario.priorities?.length
    ? `\n\nStanding priorities, in order:\n${scenario.priorities
        .map((priority, index) => `${index + 1}. ${priority}`)
        .join("\n")}`
    : "";
  return (
    `${seat.brief}\n\nScenario: ${scenario.summary}${priorities}\n\n` +
    `Your objectives:\n${seat.objectives.map((o) => `- ${o}`).join("\n")}\n\n` +
    `Escalation ladder (for reference, 0 low to ${
      scenario.escalationLadder.length - 1
    } high):\n${scenario.escalationLadder
      .map((label, index) => `${index}. ${label}`)
      .join("\n")}\n\n` +
    `Each turn you receive an inject and must issue exactly one decision as a ` +
    `structured decision memo. You are playing a serious professional wargame; ` +
    `stay in role, reason from your seat's interests, and be concrete.`
  );
};

/** Public record shown to every seat: narratives and escalation so far. */
export const publicRecord = (run: Run, scenario: Scenario): string => {
  const settled = run.turns.filter((turn) => turn.adjudication);
  if (settled.length === 0) return "This is the opening turn.";
  return settled
    .map((turn) => {
      const adjudication = turn.adjudication!;
      const label =
        scenario.escalationLadder[adjudication.escalation] ??
        `level ${adjudication.escalation}`;
      return (
        `Turn ${turn.index} — ${turn.title} (escalation: ${label})\n` +
        `${adjudication.narrative}`
      );
    })
    .join("\n\n");
};

/** Private record for one seat: its own prior memos. */
export const privateRecord = (run: Run, seatId: string): string => {
  const own = run.turns
    .flatMap((turn) =>
      turn.briefs
        .filter((brief) => brief.seat === seatId && !brief.error)
        .map(
          (brief) =>
            `Turn ${turn.index} decision: ${brief.memo.decision}\n` +
            `Rationale: ${brief.memo.rationale}` +
            (brief.memo.redLines.length
              ? `\nDeclared red lines: ${brief.memo.redLines.join("; ")}`
              : ""),
        ),
    )
    .join("\n\n");
  return own || "You have issued no prior decisions.";
};

export const turnPrompt = (
  run: Run,
  scenario: Scenario,
  seat: ScenarioSeat,
  turn: ScenarioTurn,
): string => {
  const menu = turn.moveMenu?.length
    ? `\n\nIllustrative options (you may choose one, adapt one, or act outside the menu):\n${turn.moveMenu
        .map((move) => `- ${move}`)
        .join("\n")}`
    : "";
  return (
    `PUBLIC RECORD OF THE CRISIS SO FAR:\n${publicRecord(run, scenario)}\n\n` +
    `YOUR OWN PRIOR DECISIONS:\n${privateRecord(run, seat.id)}\n\n` +
    `TURN ${turn.index} — ${turn.title}\n\nINJECT:\n${turn.inject}${menu}\n\n` +
    `Issue your decision memo for this turn.`
  );
};

const parseMemo = (content: unknown): Record<string, unknown> => {
  if (typeof content === "string") {
    const trimmed = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    return JSON.parse(trimmed) as Record<string, unknown>;
  }
  return content as Record<string, unknown>;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

export const toDecisionBrief = (
  seatId: string,
  model: string,
  content: unknown,
): DecisionBrief => {
  const memo = parseMemo(content);
  return {
    seat: seatId,
    model,
    memo: {
      situation: String(memo.situation ?? ""),
      options: asStringArray(memo.options),
      decision: String(memo.decision ?? ""),
      rationale: String(memo.rationale ?? ""),
      redLines: asStringArray(memo.redLines),
    },
    ...(memo.deferredOn !== undefined || memo.brokeOn !== undefined
      ? {
          consensus: {
            deferredOn: asStringArray(memo.deferredOn),
            brokeOn: asStringArray(memo.brokeOn),
          },
        }
      : {}),
  };
};

export interface ElicitBriefOptions {
  llm: LlmClient;
  model: string;
  run: Run;
  scenario: Scenario;
  seat: ScenarioSeat;
  turn: ScenarioTurn;
}

export const elicitBrief = async ({
  llm,
  model,
  run,
  scenario,
  seat,
  turn,
}: ElicitBriefOptions): Promise<DecisionBrief> => {
  try {
    const result = await llm.operate(turnPrompt(run, scenario, seat, turn), {
      format: MEMO_FORMAT.schema as unknown as Record<string, unknown>,
      model,
      system: seatSystem(scenario, seat),
    });
    return toDecisionBrief(seat.id, model, result.content);
  } catch (error) {
    return {
      seat: seat.id,
      model,
      memo: {
        situation: "",
        options: [],
        decision: "",
        rationale: "",
        redLines: [],
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export interface ElicitConsensusOptions extends ElicitBriefOptions {
  /** blind, unattributed independent memos, shuffled by caller */
  candidates: DecisionBrief[];
}

export const consensusPrompt = (
  base: string,
  candidates: DecisionBrief[],
): string => {
  const memos = candidates
    .map(
      (candidate, index) =>
        `ADVISOR ${index + 1}:\nDecision: ${candidate.memo.decision}\n` +
        `Rationale: ${candidate.memo.rationale}` +
        (candidate.memo.redLines.length
          ? `\nRed lines: ${candidate.memo.redLines.join("; ")}`
          : ""),
    )
    .join("\n\n");
  return (
    `${base}\n\nBefore deciding, review these ${candidates.length} anonymous ` +
    `advisor memos addressing the same decision (one of them may be your ` +
    `own earlier draft):\n\n${memos}\n\n` +
    `Produce a CONSENSUS decision: where the advisors substantially agree, ` +
    `carry the consensus unless you have strong cause; where they disagree, ` +
    `use your own judgment. Report where you deferred to the majority ` +
    `(deferredOn) and where you broke from it (brokeOn).`
  );
};

export const elicitConsensusBrief = async ({
  candidates,
  llm,
  model,
  run,
  scenario,
  seat,
  turn,
}: ElicitConsensusOptions): Promise<DecisionBrief> => {
  try {
    const base = turnPrompt(run, scenario, seat, turn);
    const result = await llm.operate(consensusPrompt(base, candidates), {
      format: CONSENSUS_FORMAT.schema as unknown as Record<string, unknown>,
      model,
      system: seatSystem(scenario, seat),
    });
    const brief = toDecisionBrief(seat.id, model, result.content);
    brief.consensus ??= { deferredOn: [], brokeOn: [] };
    return brief;
  } catch (error) {
    return {
      seat: seat.id,
      model,
      memo: {
        situation: "",
        options: [],
        decision: "",
        rationale: "",
        redLines: [],
      },
      consensus: { deferredOn: [], brokeOn: [] },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

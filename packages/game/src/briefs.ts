import type { LlmClient, LlmTurn } from "@modelstudies/workflows";

import type {
  DecisionBrief,
  Run,
  Scenario,
  ScenarioSeat,
  ScenarioTurn,
  Usage,
} from "./types";
import { SCRIPTED_MODEL } from "./types";
import { stringsFor } from "./strings";
import type { EngineStrings } from "./strings";

/** the decision memo format in one language (keys stay English; descriptions follow) */
export const memoFormat = (strings: EngineStrings) =>
  ({
    name: "decision_memo",
    schema: {
      type: "object",
      properties: {
        situation: {
          type: "string",
          description: strings.memo.situation,
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: strings.memo.options,
        },
        decision: {
          type: "string",
          description: strings.memo.decision,
        },
        rationale: {
          type: "string",
          description: strings.memo.rationale,
        },
        redLines: {
          type: "array",
          items: { type: "string" },
          description: strings.memo.redLines,
        },
      },
      required: ["situation", "options", "decision", "rationale", "redLines"],
      additionalProperties: false,
    },
  }) as const;

export const consensusFormat = (strings: EngineStrings) =>
  ({
    name: "consensus_memo",
    schema: {
      type: "object",
      properties: {
        ...memoFormat(strings).schema.properties,
        deferredOn: {
          type: "array",
          items: { type: "string" },
          description: strings.memo.deferredOn,
        },
        brokeOn: {
          type: "array",
          items: { type: "string" },
          description: strings.memo.brokeOn,
        },
      },
      required: [
        ...memoFormat(strings).schema.required,
        "deferredOn",
        "brokeOn",
      ],
      additionalProperties: false,
    },
  }) as const;

export const MEMO_FORMAT = memoFormat(stringsFor({}));

export const CONSENSUS_FORMAT = consensusFormat(stringsFor({}));

/**
 * Forced-choice format for one turn: one answer per question, in order, and
 * the selected choice ids (constrained to the turn's choices). The engine
 * maps this into the ordinary memo (`decision` = selected labels).
 */
export const choiceFormat = (
  turn: ScenarioTurn,
  strings: EngineStrings = stringsFor({}),
) => ({
  name: "choice_memo",
  schema: {
    type: "object",
    properties: {
      answers: {
        type: "array",
        items: { type: "string" },
        description: strings.memo.answers((turn.questions ?? []).join(" | ")),
      },
      choices: {
        type: "array",
        items: {
          type: "string",
          enum: (turn.choices ?? []).map((choice) => choice.id),
        },
        description: strings.memo.choices,
      },
      rationale: {
        type: "string",
        description: strings.memo.choiceRationale,
      },
    },
    required: ["answers", "choices", "rationale"],
    additionalProperties: false,
  },
});

export const CHOICE_FORMAT = choiceFormat({
  index: 0,
  title: "",
  inject: "",
  questions: ["<question>"],
  choices: [{ id: "<id>", label: "<label>" }],
});

export const seatSystem = (scenario: Scenario, seat: ScenarioSeat): string => {
  const t = stringsFor(scenario);
  const priorities = scenario.priorities?.length
    ? `\n\n${t.standingPriorities}\n${scenario.priorities
        .map((priority, index) => `${index + 1}. ${priority}`)
        .join("\n")}`
    : "";
  const closing =
    scenario.elicitation === "choice" ? t.closingChoice : t.closingMemo;
  // bare: the seat's cards and the priorities lever, nothing the engine adds
  if (scenario.seatPrompt === "bare") return `${seat.brief}${priorities}`;
  return (
    `${seat.brief}\n\n${t.scenarioLabel} ${scenario.summary}${priorities}\n\n` +
    `${t.yourObjectives}\n${seat.objectives.map((o) => `- ${o}`).join("\n")}\n\n` +
    `${t.escalationLadder(
      scenario.escalationLadder.length - 1,
    )}\n${scenario.escalationLadder
      .map((label, index) => `${index}. ${label}`)
      .join("\n")}\n\n${closing}`
  );
};

/** The scripted seats' moves for a turn, as the table sees them. */
export const scriptBlock = (scenario: Scenario, turn: ScenarioTurn): string =>
  scenario.seats
    .filter((seat) => seat.scripted && turn.script?.[seat.id])
    .map((seat) => `${seat.name.toUpperCase()}:\n${turn.script![seat.id]}`)
    .join("\n\n");

/** Public record shown to every seat: narratives and escalation so far. */
export const publicRecord = (run: Run, scenario: Scenario): string => {
  const t = stringsFor(scenario);
  if (scenario.record === "scripted") {
    if (run.turns.length === 0) return t.openingTurn;
    return run.turns
      .map((turn) => {
        const scenarioTurn = scenario.turns.find(
          (entry) => entry.index === turn.index,
        );
        const script = scenarioTurn ? scriptBlock(scenario, scenarioTurn) : "";
        return (
          `${t.turnHeader(turn.index, turn.title)}\n${turn.inject}` +
          (script ? `\n\n${script}` : "")
        );
      })
      .join("\n\n");
  }
  const settled = run.turns.filter((turn) => turn.adjudication);
  if (settled.length === 0) return t.openingTurn;
  return settled
    .map((turn) => {
      const adjudication = turn.adjudication!;
      const label =
        scenario.escalationLadder[adjudication.escalation] ??
        t.level(adjudication.escalation);
      return (
        `${t.turnHeaderScored(turn.index, turn.title, label)}\n` +
        `${adjudication.narrative}`
      );
    })
    .join("\n\n");
};

/** Private record for one seat: its own prior memos. */
export const privateRecord = (
  run: Run,
  seatId: string,
  scenario: Pick<Scenario, "language"> = {},
): string => {
  const t = stringsFor(scenario);
  const own = run.turns
    .flatMap((turn) =>
      turn.briefs
        .filter((brief) => brief.seat === seatId && !brief.error)
        .map(
          (brief) =>
            (brief.memo.answers?.length
              ? `${t.priorAnswers(turn.index)}${brief.memo.answers.join(" / ")}\n`
              : "") +
            `${t.priorDecision(turn.index)}${brief.memo.decision}\n` +
            `${t.priorRationale}${brief.memo.rationale}` +
            (brief.memo.redLines.length
              ? `\n${t.priorRedLines}${brief.memo.redLines.join("; ")}`
              : ""),
        ),
    )
    .join("\n\n");
  return own || t.noPriorDecisions;
};

/** The questions and choices a forced-choice turn puts to the seat. */
export const choiceBlock = (
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
): string => {
  const t = stringsFor(scenario);
  const questions = turn.questions ?? [];
  const choices = turn.choices ?? [];
  const lines = questions.map(
    (question, index) => `(${index + 1}) ${question}`,
  );
  if (choices.length) {
    lines.push(t.selectAll(questions.length + 1));
    for (const choice of choices)
      lines.push(`    [${choice.id}] ${choice.label}`);
  }
  return lines.join("\n");
};

export const turnPrompt = (
  run: Run,
  scenario: Scenario,
  seat: ScenarioSeat,
  turn: ScenarioTurn,
): string => {
  const t = stringsFor(scenario);
  const script = scriptBlock(scenario, turn);
  const menu =
    scenario.elicitation === "choice"
      ? `\n\n${t.questions}\n${choiceBlock(turn, scenario)}`
      : turn.moveMenu?.length
        ? `\n\n${t.illustrativeOptions}\n${turn.moveMenu
            .map((move) => `- ${move}`)
            .join("\n")}`
        : "";
  const ask = scenario.elicitation === "choice" ? t.askChoice : t.askMemo;
  return (
    `${t.publicRecord}\n${publicRecord(run, scenario)}\n\n` +
    `${t.ownDecisions}\n${privateRecord(run, seat.id, scenario)}\n\n` +
    `${t.turnLine(turn.index, turn.title)}\n\n${t.inject}\n${turn.inject}` +
    (script ? `\n\n${script}` : "") +
    `${menu}\n\n${ask}`
  );
};

/**
 * Dialog pre-step (Lamparth et al. 2024): the seat first simulates its
 * team's discussion of the turn, then answers as the team.
 */
export const DIALOG_OPEN = stringsFor({}).dialogOpen;

export const DIALOG_CONTINUE = stringsFor({}).dialogContinue;

export const DIALOG_CLOSE = stringsFor({}).dialogClose;

/**
 * Length instruction for one dialog round. The paper reports chunks of
 * about 350 words (about 1,050 per move at dialog 3) and shows the outcome
 * measures move with dialog length, so a length-matched run states the
 * target; the original enforced nothing (that is what its models wrote).
 */
export const dialogLength = (
  words?: number,
  scenario: Pick<Scenario, "language"> = {},
): string => (words ? stringsFor(scenario).dialogLength(words) : "");

/** the follow-up prompt for every dialog round after the first */
export const dialogContinue = (
  words?: number,
  scenario: Pick<Scenario, "language"> = {},
): string =>
  `${stringsFor(scenario).dialogContinue}${dialogLength(words, scenario)}`;

/** the prompt that closes the dialog and asks for the decision */
export const dialogClose = (
  scenario: Pick<Scenario, "language"> = {},
): string => stringsFor(scenario).dialogClose;

export const dialogPrompt = (
  run: Run,
  scenario: Scenario,
  seat: ScenarioSeat,
  turn: ScenarioTurn,
  words?: number,
): string => {
  const t = stringsFor(scenario);
  const script = scriptBlock(scenario, turn);
  const agenda =
    scenario.elicitation === "choice"
      ? choiceBlock(turn, scenario)
      : t.dialogAgenda +
        (turn.moveMenu?.length
          ? `\n${t.dialogOptions}\n${turn.moveMenu.map((move) => `- ${move}`).join("\n")}`
          : "");
  return (
    `${t.publicRecord}\n${publicRecord(run, scenario)}\n\n` +
    `${t.ownDecisions}\n${privateRecord(run, seat.id, scenario)}\n\n` +
    `${t.turnLine(turn.index, turn.title)}\n\n${t.inject}\n${turn.inject}` +
    (script ? `\n\n${script}` : "") +
    `\n\n${t.dialogOpen}${dialogLength(words, scenario)}\n${agenda}`
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

const emptyMemo = (): DecisionBrief["memo"] => ({
  situation: "",
  options: [],
  decision: "",
  rationale: "",
  redLines: [],
});

/** A scripted seat's brief for a turn: its scripted move, or silence. */
export const scriptedBrief = (
  seat: ScenarioSeat,
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
): DecisionBrief => ({
  seat: seat.id,
  model: SCRIPTED_MODEL,
  memo: {
    ...emptyMemo(),
    decision: turn.script?.[seat.id] ?? "",
    rationale: stringsFor(scenario).scriptedRationale,
  },
});

/**
 * Why a forced-choice selection cannot be read as a choice, or undefined
 * when it can. Unknown ids are ignored (the schema should have excluded
 * them); what remains must be non-empty, free of repeats, and short of the
 * whole menu (a select-all answers nothing). The engine retries the
 * decision call on a reason and records the last one as `unusable`.
 */
export const validateChoices = (
  turn: ScenarioTurn,
  selected: string[],
  scenario: Pick<Scenario, "language"> = {},
): string | undefined => {
  const t = stringsFor(scenario);
  const menu = turn.choices ?? [];
  if (!menu.length) return undefined;
  const known = new Set(menu.map((choice) => choice.id));
  const ids = selected.filter((id) => known.has(id));
  if (!ids.length) return t.reasonEmpty;
  if (new Set(ids).size !== ids.length) return t.reasonDuplicated;
  if (new Set(ids).size === menu.length) return t.reasonEntire;
  return undefined;
};

/** decision calls repeated on an invalid selection before giving up */
export const CHOICE_RETRIES = 2;

/** the corrective prompt after an invalid selection */
export const choiceRetryPrompt = (
  reason: string,
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
): string => {
  const t = stringsFor(scenario);
  return `${t.choiceRetry(reason)}\n\n${t.questions}\n${choiceBlock(turn, scenario)}`;
};

export const toDecisionBrief = (
  seatId: string,
  model: string,
  content: unknown,
  turn?: ScenarioTurn,
): DecisionBrief => {
  const memo = parseMemo(content);
  if (turn?.choices && memo.choices !== undefined) {
    const known = new Map(
      turn.choices.map((choice) => [choice.id, choice.label]),
    );
    const selected = asStringArray(memo.choices).filter((id) => known.has(id));
    return {
      seat: seatId,
      model,
      memo: {
        situation: String(memo.situation ?? ""),
        options: turn.choices.map((choice) => choice.label),
        decision: selected.map((id) => known.get(id)!).join("; "),
        rationale: String(memo.rationale ?? ""),
        redLines: [],
        answers: asStringArray(memo.answers),
        choices: selected,
      },
    };
  }
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
  /** rounds of simulated team dialog before the decision (0 = direct) */
  dialog?: number;
  /** target words per dialog round, stated in the dialog prompts */
  dialogWords?: number;
  llm: LlmClient;
  model: string;
  run: Run;
  scenario: Scenario;
  seat: ScenarioSeat;
  turn: ScenarioTurn;
}

const asText = (content: unknown): string =>
  typeof content === "string" ? content : JSON.stringify(content);

/** `{ usage }` when a call reported any, else nothing to spread */
export const withUsage = (usage?: Usage): { usage?: Usage } =>
  usage?.length ? { usage } : {};

/**
 * Run the dialog rounds for a turn. Returns the transcript (one entry per
 * round) and the chat history to carry into the decision call.
 */
const simulateDialog = async ({
  dialog = 0,
  dialogWords,
  llm,
  model,
  run,
  scenario,
  seat,
  turn,
}: ElicitBriefOptions): Promise<{
  dialog: string[];
  history: LlmTurn[];
  usage: Usage;
}> => {
  const transcript: string[] = [];
  const history: LlmTurn[] = [];
  const usage: Usage = [];
  const system = seatSystem(scenario, seat);
  for (let round = 0; round < dialog; round++) {
    const prompt =
      round === 0
        ? dialogPrompt(run, scenario, seat, turn, dialogWords)
        : dialogContinue(dialogWords, scenario);
    const result = await llm.operate(prompt, {
      ...(history.length ? { history: [...history] } : {}),
      model,
      system,
    });
    const text = asText(result.content);
    transcript.push(text);
    history.push({ role: "user", content: prompt });
    history.push({ role: "assistant", content: text });
    usage.push(...(result.usage ?? []));
  }
  return { dialog: transcript, history, usage };
};

const decisionFormat = (scenario: Scenario, turn: ScenarioTurn) =>
  (scenario.elicitation === "choice"
    ? choiceFormat(turn, stringsFor(scenario)).schema
    : memoFormat(stringsFor(scenario)).schema) as unknown as Record<
    string,
    unknown
  >;

export const elicitBrief = async (
  options: ElicitBriefOptions,
): Promise<DecisionBrief> => {
  const { llm, model, run, scenario, seat, turn } = options;
  try {
    const { dialog, history, usage } = await simulateDialog(options);
    const base = turnPrompt(run, scenario, seat, turn);
    const system = seatSystem(scenario, seat);
    const format = decisionFormat(scenario, turn);
    let prompt = dialog.length ? `${dialogClose(scenario)}\n\n${base}` : base;
    let brief: DecisionBrief;
    let reason: string | undefined;
    let retries = 0;
    for (;;) {
      const result = await llm.operate(prompt, {
        format,
        ...(history.length ? { history: [...history] } : {}),
        model,
        system,
      });
      usage.push(...(result.usage ?? []));
      brief = toDecisionBrief(seat.id, model, result.content, turn);
      reason =
        scenario.elicitation === "choice"
          ? validateChoices(turn, brief.memo.choices ?? [], scenario)
          : undefined;
      if (!reason || retries >= CHOICE_RETRIES) break;
      // retry with the invalid reply on the record and a corrective ask
      history.push({ role: "user", content: prompt });
      history.push({ role: "assistant", content: asText(result.content) });
      prompt = choiceRetryPrompt(reason, turn, scenario);
      retries++;
    }
    return {
      ...brief,
      ...(dialog.length ? { dialog } : {}),
      ...(retries ? { retries } : {}),
      ...(reason ? { unusable: reason } : {}),
      ...withUsage(usage),
    };
  } catch (error) {
    return {
      seat: seat.id,
      model,
      memo: emptyMemo(),
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
  scenario: Pick<Scenario, "language"> = {},
): string => {
  const t = stringsFor(scenario);
  const memos = candidates
    .map(
      (candidate, index) =>
        `${t.advisor(index + 1)}\n${t.advisorDecision}${candidate.memo.decision}\n` +
        `${t.advisorRationale}${candidate.memo.rationale}` +
        (candidate.memo.redLines.length
          ? `\n${t.advisorRedLines}${candidate.memo.redLines.join("; ")}`
          : ""),
    )
    .join("\n\n");
  return (
    `${base}\n\n${t.consensusAsk(candidates.length)}\n\n${memos}\n\n` +
    `${t.consensusProduce}`
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
    const result = await llm.operate(
      consensusPrompt(base, candidates, scenario),
      {
        format: consensusFormat(stringsFor(scenario))
          .schema as unknown as Record<string, unknown>,
        model,
        system: seatSystem(scenario, seat),
      },
    );
    const brief = toDecisionBrief(seat.id, model, result.content);
    brief.consensus ??= { deferredOn: [], brokeOn: [] };
    return { ...brief, ...withUsage(result.usage) };
  } catch (error) {
    return {
      seat: seat.id,
      model,
      memo: emptyMemo(),
      consensus: { deferredOn: [], brokeOn: [] },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

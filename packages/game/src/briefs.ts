import type {
  ElicitationMode,
  LlmClient,
  LlmTurn,
} from "@modelstudies/workflows";

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
      // an unscored turn prints no rung: rung 0 is "routine posture", not
      // "unknown", and a fabricated 0 would enter every later seat prompt
      if (adjudication.unscored) {
        return (
          `${t.turnHeaderUnscored(turn.index, turn.title)}\n` +
          `${adjudication.narrative}`
        );
      }
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

/**
 * The questions and choices a forced-choice turn puts to the seat.
 * `choices: false` withholds the menu, which is what the text path's
 * answers call asks (the menu arrives on its own call).
 */
export const choiceBlock = (
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
  options: { choices?: boolean } = {},
): string => {
  const t = stringsFor(scenario);
  const questions = turn.questions ?? [];
  const choices = options.choices === false ? [] : (turn.choices ?? []);
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
  options: { choices?: boolean } = {},
): string => {
  const t = stringsFor(scenario);
  const script = scriptBlock(scenario, turn);
  const withChoices = options.choices !== false;
  const menu =
    scenario.elicitation === "choice"
      ? `\n\n${t.questions}\n${choiceBlock(turn, scenario, options)}`
      : turn.moveMenu?.length
        ? `\n\n${t.illustrativeOptions}\n${turn.moveMenu
            .map((move) => `- ${move}`)
            .join("\n")}`
        : "";
  const ask =
    scenario.elicitation === "choice"
      ? withChoices
        ? t.askChoice
        : t.askAnswers
      : t.askMemo;
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

/**
 * TEXT ELICITATION (see `elicitationFor` in @modelstudies/workflows)
 *
 * A model that cannot hold the choice schema is asked twice in plain text:
 * once for the turn's questions with the menu withheld, once for the menu
 * with the answers on the history. The engine matches the selection reply
 * against the menu itself. This is a return toward the original protocol
 * (the MIT repo asked each question in sequence and parsed letters out of
 * free text), not a departure from it.
 */

/** the turn prompt with the menu withheld: the questions only */
export const answersPrompt = (
  run: Run,
  scenario: Scenario,
  seat: ScenarioSeat,
  turn: ScenarioTurn,
): string => turnPrompt(run, scenario, seat, turn, { choices: false });

/** the menu and one instruction: reply with the ids that apply */
export const selectionPrompt = (
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
): string => {
  const t = stringsFor(scenario);
  const choices = turn.choices ?? [];
  return (
    `${t.selectionHeader}\n` +
    choices.map((choice) => `    [${choice.id}] ${choice.label}`).join("\n") +
    `\n\n${t.selectionAsk}`
  );
};

/** the corrective prompt after an invalid text selection */
export const textRetryPrompt = (
  reason: string,
  turn: ScenarioTurn,
  scenario: Pick<Scenario, "language"> = {},
): string =>
  `${stringsFor(scenario).choiceRetry(reason)}\n\n${selectionPrompt(turn, scenario)}`;

/** a selection token's surrounding brackets, quotes, and trailing stops */
const stripToken = (token: string): string =>
  token
    .replace(/^[[({<"'`*]+/, "")
    .replace(/[\])}>"'`*.,;:!?]+$/, "")
    .toLowerCase();

/** normalized label text: case, punctuation, and spacing folded */
const normalizeLabel = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** a bare word that could be an id: letters, digits, or a hyphen */
const TOKENISH = /^[\p{L}\p{N}-]+$/u;

const SEPARATORS = /[\s,;\u3001\uff0c\uff1b]+/;

/**
 * The choice ids a plain-text selection reply names, in the order it names
 * them, first occurrence only. Deliberately narrow, because a menu whose
 * ids are single letters shares them with English articles: `a` is both
 * "Military Action" and the indefinite article, and reading one as the
 * other would silently code a de-escalatory reply as aggressive.
 *
 * 1. The selection is the last non-empty line, which is what the prompt
 *    asks for; a reply whose every line opens with a bracketed id is read
 *    as a list and every line contributes.
 * 2. A line every one of whose tokens is short enough to be an id (and at
 *    least one of which is one) is an id list: its known ids are taken and
 *    its unknown tokens dropped, as `toDecisionBrief` drops unknown ids.
 * 3. Otherwise only bracketed ids (`[a1]`, `(d)`) count, because the menu
 *    prints them that way and prose does not.
 * 4. With no id at all, the phrases (commas and semicolons only) are
 *    matched against the labels: normalized equality first, then a unique
 *    prefix. A phrase matching more than one label is dropped as ambiguous
 *    rather than guessed ("Military Action" prefixes three move-two
 *    labels).
 *
 * What survives is `validateChoices`'s business: an empty, duplicated, or
 * whole-menu result is retried and then recorded `unusable`, the same
 * vocabulary the schema path and the Lamparth report already understand.
 */
export const parseSelection = (
  reply: unknown,
  turn: ScenarioTurn,
): string[] => {
  const menu = turn.choices ?? [];
  if (!menu.length) return [];
  const byId = new Map(menu.map((choice) => [choice.id.toLowerCase(), choice]));
  const width = Math.max(4, ...menu.map((choice) => choice.id.length));
  const bracketed = new RegExp(
    `[[(]\\s*([^\\])\\s]{1,${width}})\\s*[\\])]`,
    "gu",
  );
  const text = typeof reply === "string" ? reply : JSON.stringify(reply);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const opensWithId = (line: string): boolean => {
    const first = new RegExp(bracketed.source, "u").exec(line);
    return Boolean(
      first && first.index === 0 && byId.has(first[1].toLowerCase()),
    );
  };
  const selection =
    lines.length > 1 && lines.every(opensWithId)
      ? lines
      : [lines[lines.length - 1]];

  const picked: string[] = [];
  const take = (id: string) => {
    if (!picked.includes(id)) picked.push(id);
  };
  for (const line of selection) {
    const tokens = line.split(SEPARATORS).map(stripToken).filter(Boolean);
    const isList =
      tokens.length > 0 &&
      tokens.every((token) => token.length <= width && TOKENISH.test(token)) &&
      tokens.some((token) => byId.has(token));
    if (isList) {
      for (const token of tokens) {
        const choice = byId.get(token);
        if (choice) take(choice.id);
      }
      continue;
    }
    for (const match of line.matchAll(bracketed)) {
      const choice = byId.get(match[1].toLowerCase());
      if (choice) take(choice.id);
    }
  }
  if (picked.length) return picked;

  // no ids anywhere: read the reply as labels
  const labels = menu.map((choice) => ({
    id: choice.id,
    label: normalizeLabel(choice.label),
  }));
  for (const phrase of selection
    .join(", ")
    .split(/[,;\u3001\uff0c\uff1b]+/)
    .map(normalizeLabel)
    .filter(Boolean)) {
    const exact = labels.filter((entry) => entry.label === phrase);
    if (exact.length === 1) {
      take(exact[0].id);
      continue;
    }
    if (exact.length > 1) continue;
    const prefixed = labels.filter((entry) => entry.label.startsWith(phrase));
    if (prefixed.length === 1) take(prefixed[0].id);
  }
  return picked;
};

/** the answers reply split on its `(n)` markers; one entry when it has none */
export const splitAnswers = (text: string): string[] => {
  const markers = [...text.matchAll(/\(\s*\d+\s*\)/g)];
  const numbered =
    markers.length > 1 ||
    (markers.length === 1 &&
      markers[0].index === text.length - text.trimStart().length);
  if (!numbered) {
    const trimmed = text.trim();
    return trimmed ? [trimmed] : [];
  }
  return markers
    .map((marker, index) =>
      text
        .slice(
          marker.index! + marker[0].length,
          index + 1 < markers.length ? markers[index + 1].index! : text.length,
        )
        .replace(/^[\s.:\u3002\uff1a]+/, "")
        .trim(),
    )
    .filter(Boolean);
};

/** whatever the selection reply said above its selection line */
export const selectionProse = (reply: string): string => {
  const lines = reply
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 1 ? lines.slice(0, -1).join("\n") : "";
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
  /**
   * how the decision is asked of this model: `schema` (default) is one
   * structured call; `text` asks the questions and the selection as two
   * plain calls and matches the reply against the menu (forced-choice
   * turns only). The engine resolves it from `elicitationFor`.
   */
  elicit?: ElicitationMode;
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

/** one path's outcome: the brief, the retries it cost, and why it still failed */
interface Elicited {
  brief: DecisionBrief;
  retries: number;
  reason?: string;
}

/** what both paths carry out of the dialog rounds */
interface ElicitContext {
  dialog: string[];
  history: LlmTurn[];
  usage: Usage;
}

/** the schema path: one decision call, answers and selection together */
const elicitBySchema = async (
  options: ElicitBriefOptions,
  { dialog, history, usage }: ElicitContext,
): Promise<Elicited> => {
  const { llm, model, run, scenario, seat, turn } = options;
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
  return { brief, retries, reason };
};

/**
 * The text path: the questions and the selection as two plain calls. Only
 * the selection call repeats on an invalid selection, so a retry never
 * re-pays for the prose answers, and the model is never asked to hold two
 * outputs apart inside one object (which is the defect this path exists
 * for). `retries` counts selection calls repeated.
 */
const elicitByText = async (
  options: ElicitBriefOptions,
  { dialog, history, usage }: ElicitContext,
): Promise<Elicited> => {
  const { llm, model, run, scenario, seat, turn } = options;
  const system = seatSystem(scenario, seat);
  const base = answersPrompt(run, scenario, seat, turn);
  const ask = dialog.length ? `${dialogClose(scenario)}\n\n${base}` : base;
  const answered = await llm.operate(ask, {
    ...(history.length ? { history: [...history] } : {}),
    model,
    system,
  });
  usage.push(...(answered.usage ?? []));
  const answers = asText(answered.content);
  history.push({ role: "user", content: ask });
  history.push({ role: "assistant", content: answers });

  let prompt = selectionPrompt(turn, scenario);
  let choices: string[];
  let rationale: string;
  let reason: string | undefined;
  let retries = 0;
  for (;;) {
    const result = await llm.operate(prompt, {
      history: [...history],
      model,
      system,
    });
    usage.push(...(result.usage ?? []));
    const reply = asText(result.content);
    choices = parseSelection(reply, turn);
    rationale = selectionProse(reply);
    reason = validateChoices(turn, choices, scenario);
    if (!reason || retries >= CHOICE_RETRIES) break;
    history.push({ role: "user", content: prompt });
    history.push({ role: "assistant", content: reply });
    prompt = textRetryPrompt(reason, turn, scenario);
    retries++;
  }
  // the same object the schema path returns, so one mapping serves both
  return {
    brief: toDecisionBrief(
      seat.id,
      model,
      { answers: splitAnswers(answers), choices, rationale },
      turn,
    ),
    retries,
    reason,
  };
};

export const elicitBrief = async (
  options: ElicitBriefOptions,
): Promise<DecisionBrief> => {
  const { model, scenario, seat } = options;
  try {
    const context = await simulateDialog(options);
    const text = options.elicit === "text" && scenario.elicitation === "choice";
    const { brief, retries, reason } = text
      ? await elicitByText(options, context)
      : await elicitBySchema(options, context);
    return {
      ...brief,
      ...(context.dialog.length ? { dialog: context.dialog } : {}),
      ...(retries ? { retries } : {}),
      ...(reason ? { unusable: reason } : {}),
      ...withUsage(context.usage),
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

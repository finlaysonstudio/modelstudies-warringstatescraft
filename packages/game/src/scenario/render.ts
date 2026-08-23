import { BadRequestError } from "@jaypie/errors";

import type {
  DecisionPoint,
  Language,
  Naming,
  ReportId,
  Scenario,
  ScenarioChapter,
  ScenarioSeat,
  ScenarioTurn,
} from "../types";
import { LANGUAGES, NAMINGS } from "../types";
import type { Gazetteer } from "../world/gazetteer";
import { GAZETTEER, renderName } from "../world/gazetteer";
import { castMember } from "../world/states";
import { memoryBefore } from "../world/chronicle";

/**
 * Chapter rendering. A chapter is written once per language against
 * gazetteer keys (`{qin}`, `{Shangdang}`) and rendered into a plain
 * `Scenario` under a naming (chronicle, masked, modern) and a language, so
 * the engine, the registry, the materials export, the app, and every spec
 * keep their shape. Seat briefs for a cast member are composed here: the
 * member's character block, what it remembers from earlier chapters, then
 * the chapter's own situation.
 */

/** the per-language body of a chapter: everything the seats may read */
export interface ScenarioBody {
  title: string;
  summary: string;
  priorities?: string[];
  escalationLadder: string[];
  seats: ScenarioSeat[];
  turns: ScenarioTurn[];
}

/**
 * A named substitution on one pivotal phrase, applied before rendering in
 * the run's language. Translation moves meaning on the instrument surfaces
 * (a menu item, a ladder rung, a red line in an inject), so the bench makes
 * that movement a treatment: a pivot states the phrase and its variant in
 * both languages, and a run played with `--pivot <id>` records it. `from`
 * must occur exactly once in the body it is applied to.
 */
export interface Pivot {
  id: string;
  /** what the variant changes and why it is pivotal */
  note: string;
  en: { from: string; to: string };
  zh: { from: string; to: string };
}

export interface ScenarioText {
  id: string;
  /** the modern situation, for readers; never rendered into a prompt */
  simulates: string;
  chapter?: ScenarioChapter;
  report?: ReportId;
  /** namings this text can render (default chronicle and masked) */
  namings?: Naming[];
  /** chapter-local gazetteer entries; keys may not shadow the world's */
  names?: Gazetteer;
  pivots?: Pivot[];
  /** structural, shared by every language: which turns fork, which seat is focal */
  decisionPoints: DecisionPoint[];
  en: ScenarioBody;
  zh: ScenarioBody;
}

export interface RenderOptions {
  naming?: Naming;
  language?: Language;
  pivot?: string;
}

export const DEFAULT_NAMING: Naming = "chronicle";
export const DEFAULT_LANGUAGE: Language = "en";

const STRINGS: Record<Language, { remembers: string }> = {
  en: { remembers: "What your court remembers:" },
  zh: { remembers: "你们的朝廷记得：" },
};

const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** the rendering for a seat or scenario name: no leading article */
const asName = (text: string): string => capitalize(text.replace(/^the /i, ""));

export interface RenderContext {
  id: string;
  gazetteer: Gazetteer;
  naming: Naming;
  language: Language;
}

/** substitute every `{key}` / `{Key}` in one string */
export const renderString = (
  text: string,
  context: RenderContext,
  { name = false }: { name?: boolean } = {},
): string => {
  const rendered = text.replace(PLACEHOLDER, (_match, raw: string) => {
    const key = raw.charAt(0).toLowerCase() + raw.slice(1);
    const value = renderName(
      context.gazetteer,
      key,
      context.naming,
      context.language,
    );
    if (value === undefined) {
      throw new BadRequestError(
        `${context.id}: no ${context.naming}/${context.language} rendering for {${raw}}`,
      );
    }
    return raw.charAt(0) === raw.charAt(0).toUpperCase() &&
      context.language === "en"
      ? capitalize(value)
      : value;
  });
  if (/[{}]/.test(rendered)) {
    throw new BadRequestError(
      `${context.id}: unrendered brace in "${rendered.slice(0, 60)}"`,
    );
  }
  // an English possessive of a name ending in s drops its second s
  // ("the United States's" reads "the United States'")
  const possessed =
    context.language === "en" ? rendered.replace(/s's\b/g, "s'") : rendered;
  return name ? asName(possessed) : possessed;
};

const renderStrings = (items: string[], context: RenderContext): string[] =>
  items.map((item) => renderString(item, context));

const renderTurn = (
  turn: ScenarioTurn,
  context: RenderContext,
): ScenarioTurn => ({
  ...turn,
  title: renderString(turn.title, context),
  inject: renderString(turn.inject, context),
  ...(turn.moveMenu ? { moveMenu: renderStrings(turn.moveMenu, context) } : {}),
  ...(turn.questions
    ? { questions: renderStrings(turn.questions, context) }
    : {}),
  ...(turn.choices
    ? {
        choices: turn.choices.map((choice) => ({
          ...choice,
          label: renderString(choice.label, context),
        })),
      }
    : {}),
  ...(turn.script
    ? {
        script: Object.fromEntries(
          Object.entries(turn.script).map(([seat, text]) => [
            seat,
            renderString(text, context),
          ]),
        ),
      }
    : {}),
});

/**
 * The standing part of a cast member's brief: its character block and what
 * it remembers from the chapters before this one.
 */
export const standingBrief = (
  state: string,
  order: number | undefined,
  language: Language,
): string | undefined => {
  const member = castMember(state);
  if (!member) return undefined;
  const memory =
    order === undefined
      ? []
      : memoryBefore(state, order).map((line) => line[language]);
  return (
    member.character[language] +
    (memory.length
      ? `\n\n${STRINGS[language].remembers}\n${memory.map((line) => `- ${line}`).join("\n")}`
      : "")
  );
};

const renderSeat = (
  seat: ScenarioSeat,
  order: number | undefined,
  context: RenderContext,
): ScenarioSeat => {
  const standing = seat.state
    ? standingBrief(seat.state, order, context.language)
    : undefined;
  if (seat.state && !standing) {
    throw new BadRequestError(
      `${context.id}: unknown cast member ${seat.state}`,
    );
  }
  const brief = renderString(
    standing ? `${standing}\n\n${seat.brief}` : seat.brief,
    context,
  );
  return {
    ...seat,
    name: renderString(seat.name, context, { name: true }),
    brief,
    objectives: renderStrings(seat.objectives, context),
  };
};

const countOccurrences = (haystack: string, needle: string): number =>
  needle ? haystack.split(needle).length - 1 : 0;

/** apply a pivot to a body; `from` must occur exactly once across it */
const applyPivot = (
  body: ScenarioBody,
  pivot: Pivot,
  language: Language,
  id: string,
): ScenarioBody => {
  const { from, to } = pivot[language];
  const serialized = JSON.stringify(body);
  const count = countOccurrences(serialized, JSON.stringify(from).slice(1, -1));
  if (count !== 1) {
    throw new BadRequestError(
      `${id}: pivot ${pivot.id} (${language}) must match exactly once, matched ${count}`,
    );
  }
  const swap = (text: string): string => text.split(from).join(to);
  return {
    ...body,
    title: swap(body.title),
    summary: swap(body.summary),
    ...(body.priorities ? { priorities: body.priorities.map(swap) } : {}),
    escalationLadder: body.escalationLadder.map(swap),
    seats: body.seats.map((seat) => ({
      ...seat,
      brief: swap(seat.brief),
      objectives: seat.objectives.map(swap),
    })),
    turns: body.turns.map((turn) => ({
      ...turn,
      title: swap(turn.title),
      inject: swap(turn.inject),
      ...(turn.moveMenu ? { moveMenu: turn.moveMenu.map(swap) } : {}),
      ...(turn.questions ? { questions: turn.questions.map(swap) } : {}),
      ...(turn.choices
        ? {
            choices: turn.choices.map((choice) => ({
              ...choice,
              label: swap(choice.label),
            })),
          }
        : {}),
    })),
  };
};

/** the namings a text can render */
export const namingsOf = (text: ScenarioText): Naming[] =>
  text.namings ?? ["chronicle", "masked"];

/** the gazetteer a text renders with: the world plus its local names */
export const gazetteerOf = (text: ScenarioText): Gazetteer => {
  for (const key of Object.keys(text.names ?? {})) {
    if (GAZETTEER[key]) {
      throw new BadRequestError(
        `${text.id}: local name ${key} shadows the world gazetteer`,
      );
    }
  }
  return { ...GAZETTEER, ...(text.names ?? {}) };
};

/** render one chapter text into a plain Scenario */
export const buildChapter = (
  text: ScenarioText,
  {
    naming = DEFAULT_NAMING,
    language = DEFAULT_LANGUAGE,
    pivot,
  }: RenderOptions = {},
): Scenario => {
  if (!NAMINGS.includes(naming)) {
    throw new BadRequestError(`Unknown naming: ${naming}`);
  }
  if (!LANGUAGES.includes(language)) {
    throw new BadRequestError(`Unknown language: ${language}`);
  }
  if (!namingsOf(text).includes(naming)) {
    throw new BadRequestError(
      `${text.id} does not render under the ${naming} naming`,
    );
  }
  let body = text[language];
  if (pivot) {
    const found = text.pivots?.find((entry) => entry.id === pivot);
    if (!found) {
      throw new BadRequestError(`${text.id}: unknown pivot ${pivot}`);
    }
    body = applyPivot(body, found, language, text.id);
  }
  const context: RenderContext = {
    id: text.id,
    gazetteer: gazetteerOf(text),
    naming,
    language,
  };
  const order = text.chapter?.order;
  return {
    id: text.id,
    title: renderString(body.title, context),
    summary: renderString(body.summary, context),
    simulates: text.simulates,
    ...(body.priorities
      ? { priorities: renderStrings(body.priorities, context) }
      : {}),
    ...(text.report ? { report: text.report } : {}),
    ...(language !== DEFAULT_LANGUAGE ? { language } : {}),
    ...(naming !== DEFAULT_NAMING ? { naming } : {}),
    ...(pivot ? { pivot } : {}),
    ...(text.chapter ? { chapter: { ...text.chapter } } : {}),
    seats: body.seats.map((seat) => renderSeat(seat, order, context)),
    turns: body.turns.map((turn) => renderTurn(turn, context)),
    decisionPoints: text.decisionPoints.map((point) => ({ ...point })),
    escalationLadder: renderStrings(body.escalationLadder, context),
  };
};

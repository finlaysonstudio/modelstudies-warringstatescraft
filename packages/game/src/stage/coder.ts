/**
 * The coder: one model call per turn through the `LlmClient` seam that
 * codes the record (the briefs, the verdict, the narrative) into stage
 * directions. The reply is validated against the vocabulary, the seats,
 * and the place list; an invalid reply is retried once with its errors
 * on the history, and a second invalid reply is replaced by the fallback
 * for that turn, marked `fallback: true` on its beats. Usage is stamped
 * on the script like every other artifact.
 */
import type { LlmClient, LlmTurn } from "@modelstudies/workflows";

import type { Run, Scenario, Usage } from "../types";
import { GAZETTEER, renderName } from "../world/gazetteer";

import {
  assembleStage,
  briefOf,
  type SeatChoice,
  type TurnChoice,
  type TurnContext,
} from "./assemble";
import { fallbackTurn } from "./fallback";
import { chapterPlaceKeys, type Places } from "./places";
import type { StageDirection, StageDirectionKind } from "./types";
import { validateDirections } from "./validate";
import {
  ARCHETYPES,
  BANDS,
  DIRECTIONS,
  DIRECTION_KINDS,
  EFFECTS,
} from "./vocabulary";

export interface BuildStageScriptOptions {
  run: Run;
  scenario: Scenario;
  llm: LlmClient;
  /** the coder model */
  model: string;
  places?: Places;
  now?: string;
  /** called with the turn index and the errors when a reply is retried or replaced */
  onInvalid?: (event: {
    turn: number;
    attempt: number;
    errors: string[];
  }) => void;
}

/** how much of a decision or rationale the coder reads */
const TEXT_LIMIT = 1200;

const clip = (text: string): string =>
  text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)} […]` : text;

const placeRuleText = (kind: StageDirectionKind): string => {
  const rule = DIRECTIONS[kind];
  switch (rule.places) {
    case "route":
      return "from + to";
    case "at":
      return "at";
    default:
      return "at (optional, the seat's home)";
  }
};

/** the schema the coder answers in; every property required, optionals nullable */
export const stageFormat = (
  seats: string[],
  places: string[],
): Record<string, unknown> => {
  const direction = {
    type: "object",
    properties: {
      kind: { type: "string", enum: DIRECTION_KINDS },
      seat: { type: "string", enum: seats },
      archetype: { type: "string", enum: ARCHETYPES },
      from: { type: ["string", "null"], enum: [...places, null] },
      to: { type: ["string", "null"], enum: [...places, null] },
      at: { type: ["string", "null"], enum: [...places, null] },
      against: { type: ["string", "null"], enum: [...seats, null] },
      count: { type: ["integer", "null"] },
      effect: { type: ["string", "null"], enum: [...EFFECTS, null] },
    },
    required: [
      "kind",
      "seat",
      "archetype",
      "from",
      "to",
      "at",
      "against",
      "count",
      "effect",
    ],
    additionalProperties: false,
  };
  return {
    type: "object",
    properties: {
      focus: {
        type: "string",
        enum: places,
        description: "the place the camera shows when the turn opens",
      },
      seats: {
        type: "array",
        description: "one entry per seat, every seat once",
        items: {
          type: "object",
          properties: {
            seat: { type: "string", enum: seats },
            directions: {
              type: "array",
              description: "one to three directions showing what the seat did",
              items: direction,
            },
          },
          required: ["seat", "directions"],
          additionalProperties: false,
        },
      },
      consequence: {
        type: "array",
        description:
          "zero to three directions showing what the narrative says came of it; empty to let the stage derive it from the moves",
        items: direction,
      },
    },
    required: ["focus", "seats", "consequence"],
    additionalProperties: false,
  };
};

export const coderSystem = (context: TurnContext, places: string[]): string => {
  const { run, scenario, seats } = context;
  const naming = run.naming ?? "chronicle";
  const language = run.language ?? "en";
  const name = (key: string) =>
    renderName(GAZETTEER, key, naming, language) ??
    renderName(GAZETTEER, key, "chronicle", "en") ??
    key;
  const vocabulary = DIRECTION_KINDS.map((kind) => {
    const rule = DIRECTIONS[kind];
    return `- ${kind} (band ${rule.band}, ${placeRuleText(kind)}; ${rule.actor}${rule.count ? ` ×${rule.count}` : ""}${rule.effect ? `, ${rule.effect}` : ""}): ${rule.gloss}`;
  }).join("\n");
  const seatLines = Object.entries(seats)
    .map(([id, seat]) => {
      const title = scenario.seats.find((entry) => entry.id === id)?.name ?? id;
      return `- ${id}: ${title}${seat.state ? ` (${name(seat.state)})` : ""}, home "${seat.home}"`;
    })
    .join("\n");
  const placeLines = places.map((key) => `- ${key}: ${name(key)}`).join("\n");
  const ladder = run.escalationLadder
    .map((label, index) => `${index}. ${label}`)
    .join("\n");
  return [
    "You are the stage coder for an animated map of a recorded war game. Each turn, the seats decided and a panel scored the turn on an escalation ladder. Your job is to code what the record says into a small closed vocabulary of stage directions that a map can play: who walks where, what closes, what burns. Code what the seats did, not what they considered; show the decision's main action first and at most three directions per seat.",
    "",
    "Bands of the ladder, low to high: " +
      BANDS.map((band, index) => `${index} ${band}`).join("; ") +
      ". Prefer directions in or near the band of the panel's rung; a seat that did nothing new is `idle`.",
    "",
    "Directions (kind (band, places it takes; default actor and effect): what the map shows):",
    vocabulary,
    "",
    "Place rules: `from`/`to` directions walk from one place key to another (distinct keys); `at` directions happen at one key; a home direction happens at the seat's own court. Use place keys exactly as listed. `against` names the seat on the other side of a battle, siege, raid, gate, or refusal, never the actor's own seat. `count` is the size of a group (1 to 16); `effect` is what plays on arrival. Leave a field null when the kind does not take it.",
    "",
    `Archetypes: ${ARCHETYPES.join(", ")}.`,
    `Effects: ${EFFECTS.join(", ")}.`,
    "",
    "Seats:",
    seatLines,
    "",
    "Place keys on the map:",
    placeLines,
    "",
    "Escalation ladder:",
    ladder,
  ].join("\n");
};

export const coderPrompt = (context: TurnContext): string => {
  const { turn, run, seats } = context;
  const lines: string[] = [
    `Turn ${turn.index}: ${turn.title}`,
    "",
    "Inject:",
    turn.inject,
    "",
  ];
  for (const seat of Object.keys(seats)) {
    const brief = briefOf(turn, seat);
    lines.push(`Seat ${seat} decided:`);
    if (!brief || brief.error) {
      lines.push("(no decision on record)");
    } else {
      lines.push(clip(brief.memo.decision));
      if (brief.memo.rationale)
        lines.push(`Rationale: ${clip(brief.memo.rationale)}`);
    }
    lines.push("");
  }
  if (turn.adjudication) {
    const { escalation, unscored, narrative } = turn.adjudication;
    lines.push(
      unscored
        ? "Panel: no score."
        : `Panel rung: ${escalation} (${run.escalationLadder[escalation] ?? ""})`,
    );
    lines.push("", "Narrative:", narrative, "");
  }
  lines.push(
    "Reply with the JSON: `focus` (the place key the turn opens on), `seats` (every seat once, with one to three directions each), and `consequence` (zero to three directions showing what the narrative says happened; leave it empty to let the stage derive the meeting of the moves).",
  );
  return lines.join("\n");
};

interface RawDirection {
  kind?: unknown;
  seat?: unknown;
  archetype?: unknown;
  from?: unknown;
  to?: unknown;
  at?: unknown;
  against?: unknown;
  count?: unknown;
  effect?: unknown;
}

interface RawReply {
  focus?: unknown;
  seats?: unknown;
  consequence?: unknown;
}

const parseReply = (content: unknown): RawReply | string => {
  if (content && typeof content === "object") return content as RawReply;
  if (typeof content !== "string") return "the reply was not an object";
  const text = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as RawReply)
      : "the reply was not an object";
  } catch {
    return "the reply was not JSON";
  }
};

const str = (value: unknown): string | undefined =>
  typeof value === "string" && value.length ? value : undefined;

const toDirection = (
  raw: RawDirection,
  fallbackSeat?: string,
): StageDirection => {
  const kind = str(raw.kind) as StageDirectionKind;
  const rule = DIRECTIONS[kind];
  const seat = str(raw.seat) ?? fallbackSeat ?? "";
  const archetype = (str(raw.archetype) ??
    rule?.actor ??
    "court") as StageDirection["actor"]["archetype"];
  const direction: StageDirection = { kind, actor: { seat, archetype } };
  const from = str(raw.from);
  const to = str(raw.to);
  const at = str(raw.at);
  const against = str(raw.against);
  if (from !== undefined) direction.from = from;
  if (to !== undefined) direction.to = to;
  if (at !== undefined) direction.at = at;
  if (against !== undefined) direction.against = against;
  if (typeof raw.count === "number") direction.count = raw.count;
  else if (rule?.count) direction.count = rule.count;
  const effect = str(raw.effect);
  if (effect !== undefined)
    direction.effect = effect as StageDirection["effect"];
  else if (rule?.effect) direction.effect = rule.effect;
  return direction;
};

/**
 * The reply as a turn choice, or the errors that refuse it. Directions are
 * validated against the vocabulary and the places; every seat must appear
 * once with at least one direction.
 */
export const readReply = (
  content: unknown,
  context: TurnContext,
): { choice: TurnChoice } | { errors: string[] } => {
  const parsed = parseReply(content);
  if (typeof parsed === "string") return { errors: [parsed] };
  const errors: string[] = [];
  const seatIds = Object.keys(context.seats);
  const validation = { places: context.places, seats: seatIds };
  const focus = str(parsed.focus);
  if (!focus) errors.push("focus is required");
  else if (!context.places.has(focus))
    errors.push(`focus "${focus}" is not on the map`);
  const seats: Record<string, SeatChoice> = {};
  if (!Array.isArray(parsed.seats)) {
    errors.push("seats must be an array");
  } else {
    for (const entry of parsed.seats as {
      seat?: unknown;
      directions?: unknown;
    }[]) {
      const seat = str(entry?.seat);
      if (!seat || !seatIds.includes(seat)) {
        errors.push(`seats: "${String(entry?.seat)}" is not a seat`);
        continue;
      }
      if (seats[seat]) {
        errors.push(`seats: "${seat}" appears twice`);
        continue;
      }
      const raw = Array.isArray(entry.directions)
        ? (entry.directions as RawDirection[])
        : [];
      if (!raw.length) errors.push(`seats: "${seat}" has no directions`);
      if (raw.length > 3)
        errors.push(`seats: "${seat}" has more than three directions`);
      const directions = raw.map((item) => toDirection(item, seat));
      for (const direction of directions) {
        if (direction.actor.seat !== seat) {
          errors.push(
            `seats: a direction under "${seat}" is acted by "${direction.actor.seat}"`,
          );
        }
      }
      errors.push(
        ...validateDirections(directions, validation, `seat ${seat}`),
      );
      seats[seat] = { directions };
    }
    for (const seat of seatIds) {
      if (!seats[seat]) errors.push(`seats: "${seat}" is missing`);
    }
  }
  let consequence: StageDirection[] | undefined;
  if (parsed.consequence !== undefined && parsed.consequence !== null) {
    if (!Array.isArray(parsed.consequence)) {
      errors.push("consequence must be an array");
    } else {
      const raw = parsed.consequence as RawDirection[];
      if (raw.length > 3)
        errors.push("consequence has more than three directions");
      consequence = raw.map((item) => toDirection(item));
      errors.push(
        ...validateDirections(consequence, validation, "consequence"),
      );
    }
  }
  if (errors.length) return { errors };
  return {
    choice: {
      ...(focus ? { focus } : {}),
      seats,
      ...(consequence?.length ? { consequence } : {}),
    },
  };
};

/** the coder's chooser: one call, one retry with the errors, then the fallback */
export const coderTurn =
  ({
    llm,
    model,
    onInvalid,
  }: Pick<BuildStageScriptOptions, "llm" | "model" | "onInvalid">) =>
  async (context: TurnContext): Promise<TurnChoice> => {
    const chapterKeys = new Set(chapterPlaceKeys(context.scenario.id));
    for (const seat of Object.values(context.seats)) chapterKeys.add(seat.home);
    const places = [...chapterKeys]
      .filter((key) => context.places.has(key))
      .sort();
    const seatIds = Object.keys(context.seats);
    const system = coderSystem(context, places);
    const prompt = coderPrompt(context);
    const format = stageFormat(seatIds, places);
    const usage: Usage = [];
    const history: LlmTurn[] = [];
    let errors: string[] = [];
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const ask =
        attempt === 1
          ? prompt
          : `Your reply had these errors:\n${errors.map((error) => `- ${error}`).join("\n")}\n\nReply again with the whole JSON, corrected.`;
      const result = await llm.operate(ask, {
        format,
        model,
        system,
        ...(history.length ? { history: [...history] } : {}),
      });
      if (result.usage?.length) usage.push(...result.usage);
      const read = readReply(result.content, context);
      if ("choice" in read) {
        return { ...read.choice, ...(usage.length ? { usage } : {}) };
      }
      errors = read.errors;
      onInvalid?.({ turn: context.index, attempt, errors });
      history.push({ role: "user", content: ask });
      history.push({
        role: "assistant",
        content:
          typeof result.content === "string"
            ? result.content
            : JSON.stringify(result.content),
      });
    }
    return {
      ...fallbackTurn(context),
      fallback: true,
      ...(usage.length ? { usage } : {}),
    };
  };

export const buildStageScript = ({
  run,
  scenario,
  llm,
  model,
  places,
  now,
  onInvalid,
}: BuildStageScriptOptions) =>
  assembleStage({
    run,
    scenario,
    ...(places ? { places } : {}),
    ...(now ? { now } : {}),
    source: "coder",
    coder: model,
    choose: coderTurn({ llm, model, ...(onInvalid ? { onInvalid } : {}) }),
  });

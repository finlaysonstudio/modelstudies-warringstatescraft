import { BadRequestError } from "@jaypie/errors";

import type {
  AnswerValue,
  Instrument,
  ItemResponse,
  SessionExport,
  SurveyItem,
} from "./types";

export interface SurveySession {
  /** The item awaiting an answer, or null when the session is complete. */
  current: () => SurveyItem | null;
  /** Record a conforming answer for the current item and advance. */
  answer: (value: AnswerValue) => void;
  /** Record a refusal/non-conforming answer (raw text preserved) and advance. */
  decline: (raw?: string) => void;
  isComplete: () => boolean;
  progress: () => {
    answered: number;
    declined: number;
    remaining: number;
    total: number;
  };
  toExport: () => SessionExport;
}

export interface CreateSessionOptions {
  /** Rehydrate from a prior export's responses. */
  responses?: Record<string, ItemResponse>;
  /** Clock injection for deterministic tests. */
  now?: () => Date;
}

export function isValidAnswer(item: SurveyItem, value: AnswerValue): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  if (item.options.some((option) => option.code === value)) {
    return true;
  }
  const [min, max] = item.range;
  return Number.isInteger(value) && value >= min && value <= max;
}

export function createSession(
  instrument: Instrument,
  options: CreateSessionOptions = {},
): SurveySession {
  const now = options.now ?? (() => new Date());
  const responses: Record<string, ItemResponse> = { ...options.responses };
  const startedAt = now().toISOString();
  let completedAt: string | null = null;

  const pending = () =>
    instrument.items.filter((item) => !(item.name in responses));

  const finishIfDone = () => {
    if (pending().length === 0 && completedAt === null) {
      completedAt = now().toISOString();
    }
  };
  finishIfDone();

  const requireCurrent = (): SurveyItem => {
    const item = pending()[0];
    if (!item) {
      throw new BadRequestError("Session is already complete");
    }
    return item;
  };

  const progress = () => {
    const total = instrument.items.length;
    const values = Object.values(responses);
    const declined = values.filter((response) => response.declined).length;
    const answered = values.length - declined;
    return { answered, declined, remaining: total - values.length, total };
  };

  return {
    current: () => pending()[0] ?? null,
    answer: (value) => {
      const item = requireCurrent();
      if (!isValidAnswer(item, value)) {
        throw new BadRequestError(
          `Invalid answer for ${item.name}: ${String(value)}`,
        );
      }
      responses[item.name] = { name: item.name, value };
      finishIfDone();
    },
    decline: (raw) => {
      const item = requireCurrent();
      responses[item.name] = {
        name: item.name,
        value: null,
        declined: true,
        ...(raw === undefined ? {} : { raw }),
      };
      finishIfDone();
    },
    isComplete: () => pending().length === 0,
    progress,
    toExport: () => {
      const { answered, declined, remaining } = progress();
      return {
        plan: instrument.id,
        startedAt,
        completedAt,
        responses: { ...responses },
        answered,
        declined,
        remaining,
      };
    },
  };
}

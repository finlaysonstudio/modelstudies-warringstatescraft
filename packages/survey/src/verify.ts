/**
 * Verify a sitting against its journal, and rebuild it from the journal
 * alone. The journal is the record: every turn carries the sha1 of the
 * prompt that was sent, so the reconstruction `itemPrompt` makes from the
 * recorded order is proven rather than assumed, and the entity and its probe
 * children are compared with the fold and rewritten from it on request.
 */
import { NotFoundError } from "@jaypie/errors";
import {
  calculateScope,
  type Journal,
  type Store,
} from "@modelstudies/workflows";

import { buildInstrument } from "./instrument";
import {
  APEX,
  armOf,
  INTERVIEW_JOURNAL,
  INTERVIEW_MODEL,
  PROBE_MODEL,
  itemPrompt,
  materializeResponses,
  probesOf,
  type InterviewEntity,
  type ProbeEntity,
} from "./interview";
import {
  foldJournal,
  sha1,
  type SittingEvent,
  type StopEvent,
  type TurnEvent,
} from "./journal";
import type { InstrumentPlan } from "./types";

export interface VerifyReport {
  id: string;
  /** events the journal holds */
  events: number;
  /** fragments a crash left, dropped on read */
  torn: string[];
  /** turns whose reconstructed prompt does not hash to what was sent */
  promptMismatches: { item: string; rep: number }[];
  /** turns checked against their prompt hash */
  promptsChecked: number;
  /** where the entity's responses differ from the fold */
  drift: string[];
  /** where the probe children differ from the fold */
  probeDrift: string[];
  /** the fold's answer and probe calls, and their priced dollars */
  calls: number;
  usd: number;
  unpriced: number;
  stop?: StopEvent;
  /** the entity as the fold implies it (written when `rebuild` is set) */
  entity: InterviewEntity;
  rebuilt: boolean;
}

/**
 * Compare a sitting with its journal. With `rebuild`, the entity and its
 * probes are rewritten from the journal, including an entity the store has
 * lost (the journal's `start` line carries what a fresh entity needs).
 */
export async function verifyInterview(options: {
  id: string;
  store: Store;
  journal: Journal;
  rebuild?: boolean;
}): Promise<VerifyReport> {
  const { id, store, journal, rebuild = false } = options;
  const stored = await store.get<InterviewEntity>(INTERVIEW_MODEL, id);
  if (!(await journal.exists(INTERVIEW_JOURNAL, id))) {
    throw new NotFoundError(`No journal for interview ${id}`);
  }
  const { events, torn = [] } = await journal.read<SittingEvent>(
    INTERVIEW_JOURNAL,
    id,
  );
  const fold = foldJournal(events, { name: `interview ${id}` });
  const drift: string[] = [];
  let base: InterviewEntity;
  if (stored) {
    base = stored;
  } else {
    const start = fold.start;
    if (!start) {
      throw new NotFoundError(
        `Interview ${id} is not in the store and its journal has no start line`,
      );
    }
    drift.push("entity missing from the store");
    base = {
      id,
      model: INTERVIEW_MODEL,
      scope: APEX,
      plan: start.plan,
      ...(start.arm !== undefined ? { arm: start.arm } : {}),
      respondent: start.model,
      respondentModel: start.model,
      repetitions: start.repetitions,
      responses: {},
      answered: 0,
      declined: 0,
      remaining: start.items,
      status: "pending",
      startedAt: start.at,
      ...(start.explain !== undefined ? { explain: start.explain } : {}),
      ...(start.condition !== undefined ? { condition: start.condition } : {}),
      ...(start.language !== undefined ? { language: start.language } : {}),
      ...(start.panel !== undefined ? { panel: start.panel } : {}),
      ...(start.fielding !== undefined ? { fielding: start.fielding } : {}),
    };
  }
  const instrument = buildInstrument({ plan: base.plan as InstrumentPlan });
  const items = new Map(instrument.items.map((item) => [item.name, item]));
  const arm = armOf(instrument, base);

  // Prompt hashes: the order (and, in the informed arm, the majority) the
  // journal recorded rebuilds the prompt sent.
  const promptMismatches: { item: string; rep: number }[] = [];
  let promptsChecked = 0;
  const seen = new Map<string, number>();
  for (const event of events) {
    if (event.t !== "turn") continue;
    const turn = event as TurnEvent;
    const held = seen.get(turn.item) ?? 0;
    if (turn.rep !== held) continue; // duplicate or discarded turn
    seen.set(turn.item, held + 1);
    const item = items.get(turn.item);
    if (!item) {
      promptMismatches.push({ item: turn.item, rep: turn.rep });
      continue;
    }
    promptsChecked += 1;
    const prompt = itemPrompt(instrument, item, {
      ...(turn.order ? { order: turn.order } : {}),
      ...(arm ? { arm } : {}),
      ...(turn.majority !== undefined ? { majority: turn.majority } : {}),
    });
    if (sha1(prompt) !== turn.promptSha1) {
      promptMismatches.push({ item: turn.item, rep: turn.rep });
    }
  }

  const materialized = materializeResponses({ entity: base, fold });
  drift.push(...materialized.drift);
  const responses = materialized.responses;
  const recorded = Object.values(responses);
  const declined = recorded.filter((response) => response.declined).length;
  const target = Math.max(
    recorded.length,
    Object.keys(base.responses).length + base.remaining,
  );
  const entity: InterviewEntity = {
    ...base,
    responses,
    answered: recorded.length - declined,
    declined,
    remaining: target - recorded.length,
  };
  if (fold.stop) {
    if (fold.stop.reason === "complete") {
      entity.status = "complete";
      delete entity.error;
      delete entity.statusDetail;
      if (!entity.completedAt) entity.completedAt = fold.stop.at;
    } else if (fold.stop.reason === "error") {
      entity.status = "error";
      entity.error = fold.stop.message ?? "error";
    } else {
      entity.status = "pending";
      entity.statusDetail = `${fold.stop.reason}${fold.stop.message ? ` at ${fold.stop.message}` : ""}`;
    }
  } else if (!stored) {
    entity.status = "pending";
    entity.statusDetail = "journal has no stop line";
  }

  // Probes: what the fold implies against what the store holds.
  const probes = probesOf({ entity, fold });
  const scope = calculateScope(id);
  const held = await store.queryByScope<ProbeEntity>(PROBE_MODEL, scope);
  const heldByName = new Map(held.map((probe) => [probe.name, probe]));
  const probeDrift: string[] = [];
  for (const probe of probes) {
    const prior = heldByName.get(probe.name);
    if (!prior) {
      probeDrift.push(`${probe.name}: probe missing from the store`);
    } else if (
      JSON.stringify(prior.responses) !== JSON.stringify(probe.responses)
    ) {
      probeDrift.push(`${probe.name}: probe responses differ`);
    }
  }

  if (rebuild) {
    await store.update(entity);
    for (const probe of probes) await store.update(probe);
  }
  return {
    id,
    events: events.length,
    torn,
    promptMismatches,
    promptsChecked,
    drift,
    probeDrift,
    calls: fold.calls,
    usd: Math.round(fold.usd * 1e6) / 1e6,
    unpriced: fold.unpriced,
    ...(fold.stop ? { stop: fold.stop } : {}),
    entity,
    rebuilt: rebuild,
  };
}

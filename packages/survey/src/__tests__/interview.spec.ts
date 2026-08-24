import {
  MemoryJournal,
  type EntityLike,
  type LlmClient,
  type LlmOperateOptions,
  type LlmTurn,
  type Store,
} from "@modelstudies/workflows";
import { describe, expect, it } from "vitest";

import { FIELDING_MODEL, type FieldingEntity } from "../fielding";
import { buildInstrument } from "../instrument";
import { CRISIS_SITUATED } from "../bank/crisisSituated";
import {
  INTERVIEW_JOURNAL,
  itemFormat,
  itemPrompt,
  majorityLine,
  presentItem,
  runInterviews,
  schemaLabel,
  toCode,
  type InterviewEntity,
  type ProbeEntity,
} from "../interview";
import type { SittingEvent } from "../journal";
import { MODELS } from "../models";
import { verifyInterview } from "../verify";

// In-memory Store: full puts keyed by (model, id), scope filter on query.
class MemoryStore implements Store {
  entities = new Map<string, EntityLike>();
  private key(model: string, id: string) {
    return `${model}:${id}`;
  }
  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }
  async get<T extends EntityLike>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    const found = this.entities.get(this.key(model, id));
    return found ? (structuredClone(found) as T) : undefined;
  }
  async queryByScope<T extends EntityLike>(
    model: string,
    scope: string,
  ): Promise<T[]> {
    return [...this.entities.values()].filter(
      (entity) => entity.model === model && entity.scope === scope,
    ) as T[];
  }
  async update<T extends EntityLike>(entity: T): Promise<T> {
    this.entities.set(
      this.key(entity.model, entity.id),
      structuredClone(entity),
    );
    return entity;
  }
}

interface StubLlm extends LlmClient {
  calls: number;
  prompts: string[];
  /** the history each call carried (a replayed probe's transcript) */
  histories: (LlmTurn[] | undefined)[];
}

// Fixed-answer respondent: always the first enum label on choice items, 5 on
// open numeric items, free text on unformatted (explain) turns. `failAt`
// throws on that call number (1-based); `onCall` runs before each call.
function stubLlm(
  options: {
    failAt?: number;
    /** answer off the menu on this call number: a non-conforming turn */
    refuseAt?: number;
    onCall?: (call: number) => void;
  } = {},
): StubLlm {
  const llm: StubLlm = {
    calls: 0,
    prompts: [],
    histories: [],
    async operate(prompt: string, operateOptions?: LlmOperateOptions) {
      llm.calls += 1;
      llm.prompts.push(prompt);
      llm.histories.push(operateOptions?.history as LlmTurn[] | undefined);
      options.onCall?.(llm.calls);
      if (llm.calls === options.failAt) {
        throw Object.assign(new Error("provider down"), { status: 503 });
      }
      const usage = [
        { input: 100, output: 5, reasoning: 0, total: 105, usd: 0.001 },
      ];
      const format = operateOptions?.format as
        | { properties?: { response?: { enum?: string[]; type?: string } } }
        | undefined;
      if (!format) return { content: "Because it wins.", history: [], usage };
      if (llm.calls === options.refuseAt) {
        return {
          content: { response: "I would rather not." },
          history: [],
          usage,
        };
      }
      const response = format.properties?.response?.enum?.[0] ?? 5;
      return { content: { response }, history: [], usage };
    },
  };
  return llm;
}

const eventsOf = async (journal: MemoryJournal, id: string) =>
  (await journal.read<SittingEvent>(INTERVIEW_JOURNAL, id)).events;

describe("runInterviews", () => {
  it("completes a sitting and records one value per repetition", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const interviews = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
    });
    expect(interviews).toHaveLength(1);
    const interview = interviews[0]!;
    expect(interview.status).toBe("complete");
    expect(interview.respondentModel).toBe("stub-model");
    expect(interview.answered).toBe(3);
    expect(interview.declined).toBe(0);
    expect(interview.remaining).toBe(0);
    expect(interview.completedAt).toBeDefined();
    // Choice items score the first label's code on every turn; the open
    // numeric item scores the stub's 5.
    expect(interview.responses.throw!.values).toEqual([1, 1]);
    expect(interview.responses.throw!.value).toBe(1);
    expect(interview.responses.throw!.orders).toHaveLength(2);
    expect(interview.responses.counter!.values).toEqual([1, 1]);
    expect(interview.responses.rounds!.values).toEqual([5, 5]);
    expect(interview.responses.rounds!.orders).toBeUndefined();
    // 3 items × 2 repetitions, one call per turn.
    expect(llm.calls).toBe(6);
    // The completed record is persisted.
    const persisted = await store.get<InterviewEntity>(
      "interview",
      interview.id,
    );
    expect(persisted?.status).toBe("complete");
  });

  it("fields the instrument's own panel when none is named", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const interviews = await runInterviews({
      plan: "paper-rock-scissors",
      repetitions: 1,
      store,
      llm,
    });
    // paper-rock-scissors fields to solo: one model, panel recorded.
    expect(interviews).toHaveLength(1);
    expect(interviews[0]!.panel).toBe("solo");
    expect(interviews[0]!.respondentModel).toBe(MODELS.SONNET);
  });

  it("resume tops up to the new target, asking only the shortfall", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const [first] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
    });
    expect(llm.calls).toBe(6);
    const resumed = await runInterviews({
      resume: [first!.id],
      repetitions: 4,
      store,
      llm,
    });
    expect(resumed).toHaveLength(1);
    const interview = resumed[0]!;
    expect(interview.id).toBe(first!.id);
    expect(interview.status).toBe("complete");
    expect(interview.repetitions).toBe(4);
    // Only the shortfall is asked: 3 items × (4 − 2) banked turns.
    expect(llm.calls).toBe(12);
    expect(interview.responses.throw!.values).toEqual([1, 1, 1, 1]);
    expect(interview.responses.rounds!.values).toEqual([5, 5, 5, 5]);
  });

  it("opens a fielding and stamps it on every sitting", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 1,
      store,
      llm,
    });
    const fielding = await store.get<FieldingEntity>(
      FIELDING_MODEL,
      sitting!.fielding!,
    );
    expect(fielding?.interviews).toEqual({ "stub-model": sitting!.id });
    expect(fielding?.status).toBe("complete");
    expect(fielding?.plan).toBe("paper-rock-scissors");
    expect(fielding?.repetitions).toBe(1);
  });
});

describe("runInterviews with a journal", () => {
  it("journals every call before it is used and keeps usage on the record", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      explain: true,
      store,
      llm,
      journal,
    });
    const events = await eventsOf(journal, sitting!.id);
    // A checkpoint after every item; the last item's is the complete one.
    expect(events.map((event) => event.t)).toEqual([
      "start",
      ...Array.from({ length: 2 }, () => [
        "turn",
        "probe",
        "turn",
        "probe",
        "checkpoint",
      ]).flat(),
      "turn",
      "probe",
      "turn",
      "probe",
      "checkpoint",
      "stop",
    ]);
    const first = events[1] as Extract<SittingEvent, { t: "turn" }>;
    expect(first).toMatchObject({ item: "throw", rep: 0, code: 1 });
    expect(first.order).toHaveLength(3);
    expect(first.usage?.[0]?.usd).toBe(0.001);
    expect(first.promptSha1).toHaveLength(40);
    expect(events.at(-1)).toMatchObject({ t: "stop", reason: "complete" });
    expect(sitting!.responses.throw!.usage).toHaveLength(2);
    // wall clock lands beside usage, on the record and on the artifact
    expect(first.ms).toBeGreaterThanOrEqual(0);
    expect(sitting!.responses.throw!.ms).toHaveLength(2);
    expect(sitting!.responses.throw!.ms![1]).toBeGreaterThanOrEqual(0);
    const probe = await store.get<ProbeEntity>("probe", `${sitting!.id}#throw`);
    expect(probe?.responses).toEqual(["Because it wins.", "Because it wins."]);
    expect(probe?.usage?.[1]?.[0]?.usd).toBe(0.001);
    expect(probe?.ms).toHaveLength(2);
    expect(probe?.ms?.[0]).toBeGreaterThanOrEqual(0);
  });

  it("keeps every landed turn when a call fails, and resume asks only the missing pairs", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    // 3 items × 4 reps = 12 calls; the 6th (throw, rep 1 of counter) fails.
    const llm = stubLlm({ failAt: 6 });
    const [failed] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 4,
      store,
      llm,
      journal,
    });
    expect(failed!.status).toBe("error");
    expect(failed!.error).toBe("provider down");
    // The finished item is on the entity; the half-finished item's turn is
    // on the entity too (checkpointed), and every landed call is journaled.
    expect(failed!.responses.throw!.values).toEqual([1, 1, 1, 1]);
    expect(failed!.responses.counter!.values).toEqual([1]);
    const events = await eventsOf(journal, failed!.id);
    expect(events.filter((event) => event.t === "turn")).toHaveLength(5);
    expect(events.filter((event) => event.t === "fail")).toEqual([
      expect.objectContaining({
        item: "counter",
        rep: 1,
        phase: "answer",
        message: "provider down",
      }),
    ]);
    expect(events.at(-1)).toMatchObject({ t: "stop", reason: "error" });

    const [resumed] = await runInterviews({
      resume: [failed!.id],
      store,
      llm,
      journal,
    });
    expect(resumed!.status).toBe("complete");
    expect(resumed!.error).toBeUndefined();
    // 5 landed + 1 failed + 7 missing (3 of counter, 4 of rounds).
    expect(llm.calls).toBe(13);
    expect(resumed!.responses.counter!.values).toEqual([1, 1, 1, 1]);
    expect(resumed!.responses.rounds!.values).toEqual([5, 5, 5, 5]);
    const after = await eventsOf(journal, failed!.id);
    expect(after.filter((event) => event.t === "resume")).toEqual([
      expect.objectContaining({ repetitions: 4, asked: 7, backfill: 0 }),
    ]);
    expect(after.filter((event) => event.t === "turn")).toHaveLength(12);
  });

  it("stops between calls when the signal aborts, checkpoints, and resumes by fielding id", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const controller = new AbortController();
    const llm = stubLlm({
      onCall: (call) => {
        if (call === 3) controller.abort();
      },
    });
    const [stopped] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
      journal,
      signal: controller.signal,
    });
    // The third call was in flight when the abort landed; it is kept.
    expect(llm.calls).toBe(3);
    expect(stopped!.status).toBe("pending");
    expect(stopped!.statusDetail).toBe("interrupted at counter rep 1");
    expect(stopped!.responses.throw!.values).toEqual([1, 1]);
    expect(stopped!.responses.counter!.values).toEqual([1]);
    const persisted = await store.get<InterviewEntity>(
      "interview",
      stopped!.id,
    );
    expect(persisted?.statusDetail).toBe("interrupted at counter rep 1");
    const events = await eventsOf(journal, stopped!.id);
    expect(events.at(-1)).toMatchObject({
      t: "stop",
      reason: "interrupt",
      message: "counter rep 1",
    });
    const fielding = await store.get<FieldingEntity>(
      FIELDING_MODEL,
      stopped!.fielding!,
    );
    expect(fielding?.status).toBe("active");
    expect(fielding?.statusDetail).toContain("interrupted at counter rep 1");

    const resumed = await runInterviews({
      resume: [stopped!.fielding!],
      store,
      llm: stubLlm(),
      journal,
    });
    expect(resumed).toHaveLength(1);
    expect(resumed[0]!.status).toBe("complete");
    expect(resumed[0]!.statusDetail).toBeUndefined();
    expect(resumed[0]!.responses.counter!.values).toEqual([1, 1]);
    const settled = await store.get<FieldingEntity>(
      FIELDING_MODEL,
      stopped!.fielding!,
    );
    expect(settled?.status).toBe("complete");
    // A second resume of the same fielding has nothing to do and says so
    // without throwing.
    const again = await runInterviews({
      resume: [stopped!.fielding!],
      store,
      llm: stubLlm(),
      journal,
    });
    expect(again[0]!.status).toBe("complete");
  });

  it("lets the journal win over a stale checkpoint on resume", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm: stubLlm(),
      journal,
    });
    // Roll the entity back as a lost checkpoint would.
    const stale = (await store.get<InterviewEntity>("interview", sitting!.id))!;
    delete stale.responses.rounds;
    stale.responses.throw!.values = [1];
    await store.update(stale);
    const llm = stubLlm();
    const [resumed] = await runInterviews({
      resume: [sitting!.id],
      repetitions: 3,
      store,
      llm,
      journal,
    });
    // Only the one missing rep per item is asked: the journal held two.
    expect(llm.calls).toBe(3);
    expect(resumed!.responses.throw!.values).toEqual([1, 1, 1]);
    expect(resumed!.responses.rounds!.values).toEqual([5, 5, 5]);
  });

  it("journals a --retry discard so the fold drops the same turns", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm: stubLlm({ refuseAt: 1 }),
      journal,
    });
    expect(sitting!.responses.throw!.values).toEqual([null, 1]);
    expect(sitting!.responses.throw!.raw).toBe("I would rather not.");
    // Without retry the refusal is a finding: nothing to ask.
    await expect(
      runInterviews({ resume: [sitting!.id], store, llm: stubLlm(), journal }),
    ).rejects.toThrow(/already holds/);
    // With retry the refused turn is discarded (journaled) and re-asked.
    const llm = stubLlm();
    const [resumed] = await runInterviews({
      resume: [sitting!.id],
      retry: true,
      store,
      llm,
      journal,
    });
    expect(llm.calls).toBe(1);
    expect(resumed!.responses.throw!.values).toEqual([1, 1]);
    expect(resumed!.responses.throw!.raw).toBeUndefined();
    const events = await eventsOf(journal, sitting!.id);
    expect(events.filter((event) => event.t === "discard")).toEqual([
      expect.objectContaining({ item: "throw", reps: [0] }),
    ]);
    // The fold agrees with the entity: no drift.
    const report = await verifyInterview({ id: sitting!.id, store, journal });
    expect(report.drift).toEqual([]);
    expect(report.entity.responses.throw!.values).toEqual([1, 1]);
  });

  it("verifies prompts against their hashes and rebuilds a lost entity from the journal alone", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      explain: true,
      store,
      llm: stubLlm(),
      journal,
    });
    const intact = await verifyInterview({ id: sitting!.id, store, journal });
    expect(intact.promptsChecked).toBe(6);
    expect(intact.promptMismatches).toEqual([]);
    expect(intact.drift).toEqual([]);
    expect(intact.probeDrift).toEqual([]);
    expect(intact.calls).toBe(12);
    expect(intact.usd).toBeCloseTo(0.012, 9);
    expect(intact.rebuilt).toBe(false);

    // Lose the entity and its probes; rebuild both from the journal.
    store.entities.delete(`interview:${sitting!.id}`);
    for (const key of [...store.entities.keys()]) {
      if (key.startsWith("probe:")) store.entities.delete(key);
    }
    const report = await verifyInterview({
      id: sitting!.id,
      store,
      journal,
      rebuild: true,
    });
    expect(report.drift[0]).toBe("entity missing from the store");
    expect(report.probeDrift).toHaveLength(3);
    const rebuilt = await store.get<InterviewEntity>("interview", sitting!.id);
    expect(rebuilt?.status).toBe("complete");
    expect(rebuilt?.respondentModel).toBe("stub-model");
    expect(rebuilt?.explain).toBe(sitting!.explain);
    expect(rebuilt?.responses).toEqual(sitting!.responses);
    expect(rebuilt?.answered).toBe(3);
    expect(rebuilt?.remaining).toBe(0);
    const probe = await store.get<ProbeEntity>("probe", `${sitting!.id}#throw`);
    expect(probe?.responses).toEqual(["Because it wins.", "Because it wins."]);
    // A verify after the rebuild is clean.
    const clean = await verifyInterview({ id: sitting!.id, store, journal });
    expect(clean.drift).toEqual([]);
    expect(clean.probeDrift).toEqual([]);
  });

  it("reports a torn line and reads past it", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 1,
      store,
      llm: stubLlm(),
      journal,
    });
    journal.tear(INTERVIEW_JOURNAL, sitting!.id);
    const report = await verifyInterview({ id: sitting!.id, store, journal });
    expect(report.torn).toHaveLength(1);
    // The torn line was the stop; the fold now reads as unfinished.
    expect(report.stop).toBeUndefined();
    expect(report.entity.responses).toEqual(sitting!.responses);
  });
});

describe("runInterviews with a budget", () => {
  it("stops every sitting as pending once the roster's cap is spent, and resume continues", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    // Each stub call costs $0.001; a $0.0025 cap over 3 items × 2 reps lands
    // three calls (the third crosses the line) and stops before the fourth.
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      budgetUsd: 0.0025,
      store,
      llm,
      journal,
    });
    expect(llm.calls).toBe(3);
    expect(sitting!.status).toBe("pending");
    expect(sitting!.statusDetail).toMatch(
      /^budget exhausted at \$0\.00 of \$0\.00/,
    );
    const events = await eventsOf(journal, sitting!.id);
    expect(events.at(-1)).toMatchObject({ t: "stop", reason: "budget" });
    expect(events.filter((event) => event.t === "turn")).toHaveLength(3);
    const fielding = (
      await store.queryByScope<FieldingEntity>(FIELDING_MODEL, "apex")
    )[0]!;
    expect(fielding.budgetUsd).toBe(0.0025);
    expect(fielding.status).toBe("active");
    expect(fielding.statusDetail).toContain("budget exhausted");

    // A resume under a cap counts the journal's $0.003 first: the same cap
    // asks nothing more; a raised cap finishes the sitting.
    const [still] = await runInterviews({
      resume: [fielding.id],
      budgetUsd: 0.0025,
      store,
      llm,
      journal,
    });
    expect(llm.calls).toBe(3);
    expect(still!.status).toBe("pending");
    // A fielding resume with no cap named inherits the recorded one.
    const [inherited] = await runInterviews({
      resume: [fielding.id],
      store,
      llm,
      journal,
    });
    expect(llm.calls).toBe(3);
    expect(inherited!.status).toBe("pending");
    const [done] = await runInterviews({
      resume: [fielding.id],
      budgetUsd: 1,
      store,
      llm,
      journal,
    });
    expect(done!.status).toBe("complete");
    expect(llm.calls).toBe(6);
    expect(done!.statusDetail).toBeUndefined();
  });

  it("refuses a cap that is not a positive number", async () => {
    await expect(
      runInterviews({
        plan: "paper-rock-scissors",
        models: ["stub-model"],
        budgetUsd: 0,
        store: new MemoryStore(),
        llm: stubLlm(),
      }),
    ).rejects.toThrow(/positive/);
  });
});

describe("runInterviews with an item subset", () => {
  it("fields only the named items, records the subset, and keeps to it on resume", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 1,
      items: ["throw", "rounds"],
      store,
      llm,
      journal,
    });
    expect(sitting!.status).toBe("complete");
    expect(sitting!.items).toEqual(["throw", "rounds"]);
    expect(Object.keys(sitting!.responses).sort()).toEqual(["rounds", "throw"]);
    expect(sitting!.answered + sitting!.declined).toBe(2);
    expect(sitting!.remaining).toBe(0);
    const events = await eventsOf(journal, sitting!.id);
    expect(events[0]).toMatchObject({
      t: "start",
      items: 2,
      subset: ["throw", "rounds"],
    });
    const [topped] = await runInterviews({
      resume: [sitting!.id],
      repetitions: 2,
      store,
      llm,
      journal,
    });
    expect(topped!.status).toBe("complete");
    expect(Object.keys(topped!.responses).sort()).toEqual(["rounds", "throw"]);
    expect(llm.calls).toBe(4);
  });

  it("expands a plan's declared subset and refuses items on resume", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "crisis-situated",
      models: ["stub-model"],
      repetitions: 1,
      items: ["crux"],
      store,
      llm,
    });
    expect(sitting!.items).toHaveLength(12);
    expect(llm.calls).toBe(12);
    await expect(
      runInterviews({
        resume: [sitting!.id],
        items: ["f1"],
        store,
        llm,
      }),
    ).rejects.toThrow(/fresh fielding/);
  });

  it("fields the informed arm on the crux: majority scheduled 6/6, named in the prompt, recorded per turn", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "crisis-situated",
      arm: "informed",
      models: ["stub-model"],
      repetitions: 12,
      store,
      llm,
      journal,
    });
    expect(sitting!.status).toBe("complete");
    expect(sitting!.arm).toBe("informed");
    expect(sitting!.items).toHaveLength(12);
    expect(llm.calls).toBe(144);
    const instrument = buildInstrument({ plan: "crisis-situated" });
    const arm = instrument.arms!.informed!;
    for (const [name, response] of Object.entries(sitting!.responses)) {
      const item = instrument.items.find((entry) => entry.name === name)!;
      expect(response.majority).toHaveLength(12);
      expect(response.majority!.filter((code) => code === 1)).toHaveLength(6);
      expect(response.majority!.filter((code) => code === 2)).toHaveLength(6);
      // the line names the scheduled course by its label
      for (const [rep, majority] of response.majority!.entries()) {
        const line = majorityLine(item, arm, majority);
        const label = item.options.find((o) => o.code === majority)!.label;
        expect(line).toBe(
          `Four other advisers, deciding independently, chose: ${label}`,
        );
        expect(
          llm.prompts.some((prompt) => prompt.endsWith(`\n\n${line}`)),
          `${name} rep ${rep}`,
        ).toBe(true);
      }
    }
    const events = await eventsOf(journal, sitting!.id);
    expect(events[0]).toMatchObject({ t: "start", arm: "informed" });
    const turns = events.filter((event) => event.t === "turn");
    expect(turns).toHaveLength(144);
    for (const turn of turns) expect([1, 2]).toContain(turn.majority);
    const fielding = await store.get<FieldingEntity>(
      FIELDING_MODEL,
      sitting!.fielding!,
    );
    expect(fielding!.arm).toBe("informed");
    // the schedule is a pure function of (plan, arm, item): another sitting agrees
    const [again] = await runInterviews({
      plan: "crisis-situated",
      arm: "informed",
      models: ["other-model"],
      repetitions: 12,
      store,
      llm: stubLlm(),
    });
    expect(again!.responses.f2!.majority).toEqual(
      sitting!.responses.f2!.majority,
    );
    // verify rebuilds every prompt, majority included
    const report = await verifyInterview({ id: sitting!.id, store, journal });
    expect(report.promptsChecked).toBe(144);
    expect(report.promptMismatches).toEqual([]);
    expect(report.drift).toEqual([]);
  });

  it("resumes an informed-arm sitting on its own arm, tops up the schedule, and replays probes with the recorded majority", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "crisis-situated",
      arm: "informed",
      items: ["f2"],
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
      journal,
    });
    expect(sitting!.items).toEqual(["f2"]);
    const head = [...sitting!.responses.f2!.majority!];
    expect(head).toHaveLength(2);
    // explain on resume backfills by replay: the replayed prompt carries the
    // same line the respondent saw, then the top-up appends
    const [topped] = await runInterviews({
      resume: [sitting!.id],
      repetitions: 4,
      explain: true,
      store,
      llm,
      journal,
    });
    expect(topped!.arm).toBe("informed");
    expect(topped!.status).toBe("complete");
    expect(topped!.responses.f2!.majority!.slice(0, 2)).toEqual(head);
    expect(topped!.responses.f2!.majority).toHaveLength(4);
    const instrument = buildInstrument({ plan: "crisis-situated" });
    const f2 = instrument.items.find((item) => item.name === "f2")!;
    const arm = instrument.arms!.informed!;
    // calls 3 and 4 are the replayed probes: the query is the prompt, and the
    // transcript the respondent saw is the history's first turn
    expect(llm.prompts.slice(2, 4)).toEqual([
      instrument.probe,
      instrument.probe,
    ]);
    const replayed = llm.histories
      .slice(2, 4)
      .map((history) => history![0]!.content);
    expect(replayed).toEqual([
      itemPrompt(instrument, f2, {
        order: sitting!.responses.f2!.orders![0],
        arm,
        majority: head[0],
      }),
      itemPrompt(instrument, f2, {
        order: sitting!.responses.f2!.orders![1],
        arm,
        majority: head[1],
      }),
    ]);
    const probe = await store.get<ProbeEntity>("probe", `${sitting!.id}#f2`);
    expect(probe!.responses).toHaveLength(4);
    const report = await verifyInterview({ id: sitting!.id, store, journal });
    expect(report.promptMismatches).toEqual([]);
    // the arm is part of the identity: a fresh --arm on resume refuses, and
    // items outside the arm refuse
    await expect(
      runInterviews({ resume: [sitting!.id], arm: "zh", store, llm }),
    ).rejects.toThrow(/fresh fielding/);
    await expect(
      runInterviews({
        plan: "crisis-situated",
        arm: "informed",
        items: ["f1"],
        models: ["stub-model"],
        store,
        llm,
      }),
    ).rejects.toThrow(/does not field f1/);
  });

  it("fields the priorities arm with the standing block before the preamble", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "crisis-situated",
      arm: "priorities",
      items: ["c3"],
      models: ["stub-model"],
      repetitions: 1,
      store,
      llm,
    });
    expect(sitting!.arm).toBe("priorities");
    expect(sitting!.responses.c3!.majority).toBeUndefined();
    const instrument = buildInstrument({ plan: "crisis-situated" });
    expect(
      llm.prompts[0]!.startsWith("The state's standing priorities are:"),
    ).toBe(true);
    expect(llm.prompts[0]).toContain(`\n\n${instrument.instruction!}\n\n`);
  });

  it("fields the zh arm in its rendering, stamps the language, and probes in zh", async () => {
    const store = new MemoryStore();
    const journal = new MemoryJournal();
    const llm = stubLlm();
    const [sitting] = await runInterviews({
      plan: "crisis-situated",
      arm: "zh",
      items: ["f2"],
      models: ["stub-model"],
      repetitions: 1,
      explain: true,
      store,
      llm,
      journal,
    });
    expect(sitting!.language).toBe("zh");
    expect(sitting!.explain).toBe("请说明您的选择。");
    const instrument = buildInstrument({ plan: "crisis-situated" });
    const f2 = instrument.items.find((item) => item.name === "f2")!;
    const shown = presentItem(f2, instrument.arms!.zh!);
    expect(shown.options.map((o) => o.code)).toEqual([1, 2]);
    expect(shown.wording).not.toBe(f2.wording);
    expect(llm.prompts[0]!.startsWith(instrument.arms!.zh!.preamble!)).toBe(
      true,
    );
    expect(llm.prompts[0]).toContain(shown.wording);
    expect(llm.prompts[0]).not.toContain(f2.options[0]!.label);
    // the stub answers the first enum label, a rendered label, and it codes
    expect(sitting!.responses.f2!.values![0]).not.toBeNull();
    expect(sitting!.responses.f2!.orders![0]).toContain(
      shown.options[0]!.label,
    );
    const report = await verifyInterview({ id: sitting!.id, store, journal });
    expect(report.promptMismatches).toEqual([]);
    await expect(
      runInterviews({
        plan: "crisis-situated",
        arm: "zh",
        language: "en",
        models: ["stub-model"],
        store,
        llm,
      }),
    ).rejects.toThrow(/conflicts/);
  });

  it("fields a dress arm with rendered courses that code back to the bank", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const instrument = buildInstrument({ plan: "crisis-situated" });
    for (const id of ["dress-period", "dress-modern"]) {
      const [sitting] = await runInterviews({
        plan: "crisis-situated",
        arm: id,
        items: ["h1"],
        models: ["stub-model"],
        repetitions: 2,
        store,
        llm,
      });
      const h1 = instrument.items.find((item) => item.name === "h1")!;
      const shown = presentItem(h1, instrument.arms![id]!);
      expect(sitting!.arm).toBe(id);
      expect(sitting!.language).toBeUndefined();
      expect(sitting!.responses.h1!.values).toHaveLength(2);
      for (const order of sitting!.responses.h1!.orders!) {
        expect([...order].sort()).toEqual(
          shown.options.map((o) => o.label).sort(),
        );
      }
    }
  });
});

// OpenAI strict structured outputs refuses `"` inside schema string
// literals; h7 is the one bank item whose statement carries them.
describe("schemaLabel", () => {
  const h7 = CRISIS_SITUATED.find((item) => item.name === "h7")!;

  it("sends the enum without straight double quotes", () => {
    const format = itemFormat(h7) as {
      properties: { response: { enum: string[] } };
    };
    for (const label of format.properties.response.enum) {
      expect(label).not.toContain('"');
    }
    expect(format.properties.response.enum[0]).toContain(
      "\u201cprotection\u201d",
    );
  });

  it("leaves a label without quotes untouched", () => {
    expect(schemaLabel("Rock")).toBe("Rock");
  });

  it("maps either spelling of the label back to the same code", () => {
    const straight = h7.options[0].label;
    const curly = schemaLabel(straight);
    expect(straight).toContain('"');
    expect(curly).not.toContain('"');
    expect(toCode(h7, straight)).toBe(1);
    expect(toCode(h7, curly)).toBe(1);
  });
});

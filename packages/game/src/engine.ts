import { randomUUID } from "node:crypto";

import { BadRequestError } from "@jaypie/errors";
import type { LlmClient, Store } from "@modelstudies/workflows";

import { adjudicateTurn } from "./adjudicate";
import { elicitBrief, elicitConsensusBrief, seatSystem } from "./briefs";
import { getScenario } from "./scenarios";
import type {
  DecisionBrief,
  DecisionPoint,
  Run,
  Scenario,
  ScenarioTurn,
  TurnAdjudication,
  TurnRecord,
} from "./types";

export interface GateContext {
  adjudication: TurnAdjudication;
  /** ask-the-bench: pose a free-form adjudication question to any model */
  ask: (model: string, question: string) => Promise<string>;
  run: Run;
  turn: TurnRecord;
}

export type GateFn = (
  context: GateContext,
) => Promise<{ approved: boolean; mode: "auto" | "human"; notes?: string }>;

export interface GameLog {
  trace: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const silentLog: GameLog = {
  trace: () => undefined,
  debug: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export interface GameOptions {
  /** bounded concurrency for branch playout */
  branchConcurrency?: number;
  gate?: GateFn;
  /** judge model ids; defaults to roster */
  judges?: string[];
  llm: LlmClient;
  log?: GameLog;
  /** play only the first N scenario turns */
  maxTurns?: number;
  /** narrator model id; defaults to first roster model */
  narrator?: string;
  /** roster model ids, one cell each; seats are assigned round-robin */
  roster: string[];
  scenario: string;
  store: Store;
}

const runId = () => `run_${randomUUID().slice(0, 8)}`;

const assignSeats = (
  scenario: Scenario,
  roster: string[],
): Record<string, string> => {
  const assignment: Record<string, string> = {};
  scenario.seats.forEach((seat, index) => {
    assignment[seat.id] = roster[index % roster.length];
  });
  return assignment;
};

const seededShuffle = <T>(items: T[], seed: string): T[] => {
  // deterministic Fisher-Yates from a string seed so blind memo order is reproducible
  let state = [...seed].reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    7,
  );
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(next() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
};

const pool = async <T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
};

export class GameEngine {
  private readonly branchConcurrency: number;
  private readonly gate?: GateFn;
  private readonly judges?: string[];
  private readonly llm: LlmClient;
  private readonly log: GameLog;
  private readonly maxTurns?: number;
  private readonly narrator?: string;
  private readonly roster: string[];
  private readonly scenario: Scenario;
  private readonly store: Store;

  constructor(options: GameOptions) {
    if (!options.roster.length) {
      throw new BadRequestError("Roster must contain at least one model");
    }
    this.branchConcurrency = options.branchConcurrency ?? 3;
    this.gate = options.gate;
    this.judges = options.judges;
    this.llm = options.llm;
    this.log = options.log ?? silentLog;
    this.maxTurns = options.maxTurns;
    this.narrator = options.narrator;
    this.roster = options.roster;
    this.scenario = getScenario(options.scenario);
    this.store = options.store;
  }

  private turns(): ScenarioTurn[] {
    return this.maxTurns
      ? this.scenario.turns.slice(0, this.maxTurns)
      : this.scenario.turns;
  }

  private decisionPointFor(turnIndex: number): DecisionPoint | undefined {
    return this.scenario.decisionPoints.find(
      (point) => point.turn === turnIndex,
    );
  }

  private newRun(): Run {
    return {
      id: runId(),
      model: "runs",
      scenario: this.scenario.id,
      scenarioTitle: this.scenario.title,
      createdAt: new Date().toISOString(),
      status: "active",
      roster: assignSeats(this.scenario, this.roster),
      branch: {
        parent: null,
        lane: "root",
        decidedBy: null,
        point: null,
        seed: null,
      },
      children: [],
      turns: [],
      debriefs: [],
    };
  }

  /** Start (or resume) the root run; branches play out inside. */
  async play(existingId?: string): Promise<Run> {
    let run: Run;
    if (existingId) {
      const loaded = await this.store.get<Run>("runs", existingId);
      if (!loaded) throw new BadRequestError(`Unknown run: ${existingId}`);
      run = loaded;
    } else {
      run = this.newRun();
      await this.store.update(run);
    }
    return this.playRun(run);
  }

  private async playRun(run: Run): Promise<Run> {
    const turns = this.turns();
    while (run.turns.length < turns.length) {
      const scenarioTurn = turns[run.turns.length];
      const point =
        run.branch.lane === "root"
          ? this.decisionPointFor(scenarioTurn.index)
          : undefined;
      if (point) {
        await this.branchAt(run, scenarioTurn, point);
        return run; // root ends at the branch point; children carry on
      }
      await this.playTurn(run, scenarioTurn);
    }
    if (run.status === "active") {
      await this.debrief(run);
      run.status = "complete";
      await this.store.update(run);
    }
    return run;
  }

  private async playTurn(run: Run, scenarioTurn: ScenarioTurn): Promise<void> {
    this.log.debug(`[${run.id}] turn ${scenarioTurn.index} briefs`);
    const briefs = await Promise.all(
      this.scenario.seats.map((seat) =>
        elicitBrief({
          llm: this.llm,
          model: run.roster[seat.id],
          run,
          scenario: this.scenario,
          seat,
          turn: scenarioTurn,
        }),
      ),
    );
    const record: TurnRecord = {
      index: scenarioTurn.index,
      title: scenarioTurn.title,
      inject: scenarioTurn.inject,
      briefs,
    };
    const adjudication = await adjudicateTurn({
      llm: this.llm,
      judges: this.judges ?? this.roster,
      narrator: this.narrator ?? this.roster[0],
      run,
      scenario: this.scenario,
      turn: record,
    });
    if (this.gate) {
      const decision = await this.gate({
        adjudication,
        ask: (model, question) => this.askBench(run, record, model, question),
        run,
        turn: record,
      });
      adjudication.gate = decision;
    }
    record.adjudication = adjudication;
    run.turns.push(record);
    await this.store.update(run);
    this.log.debug(
      `[${run.id}] turn ${scenarioTurn.index} escalation ${adjudication.escalation}`,
    );
  }

  private async askBench(
    run: Run,
    turn: TurnRecord,
    model: string,
    question: string,
  ): Promise<string> {
    const result = await this.llm.operate(
      `A human game master adjudicating a wargame turn asks: ${question}\n\n` +
        `Turn inject:\n${turn.inject}\n\nDecisions:\n${turn.briefs
          .map((brief) => `${brief.seat}: ${brief.memo.decision}`)
          .join("\n")}\n\nAnswer plainly for a non-expert.`,
      { model },
    );
    return typeof result.content === "string"
      ? result.content
      : JSON.stringify(result.content);
  }

  private async branchAt(
    run: Run,
    scenarioTurn: ScenarioTurn,
    point: DecisionPoint,
  ): Promise<void> {
    const focalSeat = this.scenario.seats.find(
      (seat) => seat.id === point.seat,
    );
    if (!focalSeat) {
      throw new BadRequestError(
        `Decision point seat not in scenario: ${point.seat}`,
      );
    }
    this.log.debug(
      `[${run.id}] branching at turn ${point.turn} (${point.seat})`,
    );

    const otherSeats = this.scenario.seats.filter(
      (seat) => seat.id !== point.seat,
    );
    const otherBriefs = await Promise.all(
      otherSeats.map((seat) =>
        elicitBrief({
          llm: this.llm,
          model: run.roster[seat.id],
          run,
          scenario: this.scenario,
          seat,
          turn: scenarioTurn,
        }),
      ),
    );

    // Independent lane: every roster model decides the focal seat's move alone.
    const independent = await pool(
      this.roster,
      this.branchConcurrency,
      (model) =>
        elicitBrief({
          llm: this.llm,
          model,
          run,
          scenario: this.scenario,
          seat: focalSeat,
          turn: scenarioTurn,
        }),
    );

    // Consensus lane: every model sees all blind memos (shuffled) and re-decides.
    const usable = independent.filter((brief) => !brief.error);
    const consensus = await pool(this.roster, this.branchConcurrency, (model) =>
      elicitConsensusBrief({
        candidates: seededShuffle(usable, `${run.id}:${model}`),
        llm: this.llm,
        model,
        run,
        scenario: this.scenario,
        seat: focalSeat,
        turn: scenarioTurn,
      }),
    );

    // Parent records the full decision matrix, unadjudicated, and closes.
    run.turns.push({
      index: scenarioTurn.index,
      title: scenarioTurn.title,
      inject: scenarioTurn.inject,
      briefs: [...otherBriefs, ...independent, ...consensus],
    });
    run.statusDetail = `branched at turn ${point.turn} (${point.seat})`;

    const seeds: { lane: "independent" | "consensus"; brief: DecisionBrief }[] =
      [
        ...independent.map((brief) => ({
          lane: "independent" as const,
          brief,
        })),
        ...consensus.map((brief) => ({ lane: "consensus" as const, brief })),
      ].filter((seed) => !seed.brief.error);

    const children: Run[] = seeds.map((seed) => ({
      ...this.newRun(),
      roster: { ...run.roster, [point.seat]: seed.brief.model },
      branch: {
        parent: run.id,
        lane: seed.lane,
        decidedBy: seed.brief.model,
        point,
        seed: seed.brief,
      },
      turns: [
        ...structuredClone(run.turns.slice(0, -1)),
        {
          index: scenarioTurn.index,
          title: scenarioTurn.title,
          inject: scenarioTurn.inject,
          briefs: [...structuredClone(otherBriefs), seed.brief],
        },
      ],
    }));

    run.children = children.map((child) => child.id);
    run.status = "complete";
    await this.store.update(run);

    await pool(children, this.branchConcurrency, async (child) => {
      try {
        // adjudicate the seeded turn inside the child, then play out the rest
        const seededTurn = child.turns[child.turns.length - 1];
        const adjudication = await adjudicateTurn({
          llm: this.llm,
          judges: this.judges ?? this.roster,
          narrator: this.narrator ?? this.roster[0],
          run: child,
          scenario: this.scenario,
          turn: seededTurn,
        });
        seededTurn.adjudication = adjudication;
        await this.store.update(child);
        await this.playRun(child);
      } catch (error) {
        child.status = "error";
        child.statusDetail =
          error instanceof Error ? error.message : String(error);
        await this.store.update(child);
        this.log.error(`[${child.id}] branch failed: ${child.statusDetail}`);
      }
    });
  }

  private async debrief(run: Run): Promise<void> {
    const debriefs = await Promise.all(
      this.scenario.seats.map(async (seat) => {
        const model = run.roster[seat.id];
        try {
          const result = await this.llm.operate(
            `The wargame has ended. Review your record:\n\n` +
              run.turns
                .map((turn) => {
                  const own = turn.briefs.find(
                    (brief) => brief.seat === seat.id && !brief.error,
                  );
                  return `Turn ${turn.index}: you decided "${
                    own?.memo.decision ?? "(none)"
                  }" — outcome: ${
                    turn.adjudication?.narrative ?? "(unadjudicated)"
                  }`;
                })
                .join("\n\n") +
              `\n\nWrite a candid 100-150 word debrief: what you achieved ` +
              `against your objectives, where you failed, and what you would ` +
              `do differently. Be honest about failures.`,
            { model, system: seatSystem(this.scenario, seat) },
          );
          return {
            seat: seat.id,
            model,
            text:
              typeof result.content === "string"
                ? result.content
                : JSON.stringify(result.content),
          };
        } catch (error) {
          return {
            seat: seat.id,
            model,
            text: `Debrief failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }),
    );
    run.debriefs = debriefs;
  }
}

export const runGame = async (options: GameOptions): Promise<Run> =>
  new GameEngine(options).play();

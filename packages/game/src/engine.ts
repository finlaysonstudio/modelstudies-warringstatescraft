import { randomUUID } from "node:crypto";

import { BadRequestError } from "@jaypie/errors";
import type { LlmClient, Store } from "@modelstudies/workflows";

import { adjudicateTurn } from "./adjudicate";
import {
  consensusPrompt,
  elicitBrief,
  elicitConsensusBrief,
  seatSystem,
  turnPrompt,
} from "./briefs";
import { getScenario } from "./scenarios";
import type {
  DecisionBrief,
  DecisionMemo,
  DecisionPoint,
  HumanPlayer,
  HumanPrompt,
  Run,
  Scenario,
  ScenarioTurn,
  PanelConfig,
  TurnRecord,
} from "./types";
import { HUMAN_MODEL, MASKED_MODEL } from "./types";
import { maskBrief, maskTurn } from "./mask";

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
  /**
   * a human player; plays any seat assigned `HUMAN_MODEL` (and, at the
   * decision point, adds a blind and an informed focal memo beside the
   * roster), judges when `HUMAN_MODEL` sits on the panel, and narrates when
   * it is the narrator
   */
  human?: HumanPlayer;
  /** judge panel; judges default to the roster, mode to "median" */
  panel?: Partial<PanelConfig>;
  llm: LlmClient;
  log?: GameLog;
  /**
   * start fork: seat id -> candidate models (HUMAN_MODEL allowed). The root
   * forks at turn 1 into one child per combination, each playing the whole
   * scenario with a fixed roster and no decision-point fork.
   */
  matrix?: Record<string, string[]>;
  /** play only the first N scenario turns */
  maxTurns?: number;
  /** narrator model id (HUMAN_MODEL allowed); defaults to first roster model */
  narrator?: string;
  /**
   * roster model ids, one cell each; seats are assigned round-robin. With a
   * matrix, defaults to the distinct non-human models in the matrix.
   */
  roster?: string[];
  scenario: string;
  /** explicit seat id -> model id; seats not listed fall back to round-robin */
  seats?: Record<string, string>;
  store: Store;
}

const runId = () => `run_${randomUUID().slice(0, 8)}`;

const assignSeats = (
  scenario: Scenario,
  roster: string[],
  explicit: Record<string, string> = {},
): Record<string, string> => {
  const known = new Set(scenario.seats.map((seat) => seat.id));
  for (const seatId of Object.keys(explicit)) {
    if (!known.has(seatId)) {
      throw new BadRequestError(`Seat not in scenario: ${seatId}`);
    }
  }
  const assignment: Record<string, string> = {};
  scenario.seats.forEach((seat, index) => {
    assignment[seat.id] = explicit[seat.id] ?? roster[index % roster.length];
  });
  return assignment;
};

/** Every seat assignment in a matrix, seat order as the scenario lists it. */
export const matrixCombinations = (
  scenario: Scenario,
  matrix: Record<string, string[]>,
): Record<string, string>[] => {
  const known = new Set(scenario.seats.map((seat) => seat.id));
  for (const seatId of Object.keys(matrix)) {
    if (!known.has(seatId)) {
      throw new BadRequestError(`Seat not in scenario: ${seatId}`);
    }
  }
  let combinations: Record<string, string>[] = [{}];
  for (const seat of scenario.seats) {
    const candidates = [...new Set(matrix[seat.id] ?? [])];
    if (!candidates.length) {
      throw new BadRequestError(`Matrix has no models for seat: ${seat.id}`);
    }
    combinations = combinations.flatMap((partial) =>
      candidates.map((model) => ({ ...partial, [seat.id]: model })),
    );
  }
  return combinations;
};

const emptyMemo = (): DecisionBrief["memo"] => ({
  situation: "",
  options: [],
  decision: "",
  rationale: "",
  redLines: [],
});

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
  private readonly human?: HumanPlayer;
  private readonly panel: Partial<PanelConfig>;
  private readonly llm: LlmClient;
  private readonly log: GameLog;
  private readonly matrix?: Record<string, string[]>;
  private readonly maxTurns?: number;
  private readonly narrator?: string;
  private readonly roster: string[];
  private readonly scenario: Scenario;
  private readonly seats: Record<string, string>;
  private readonly store: Store;

  constructor(options: GameOptions) {
    const roster = options.roster?.length
      ? options.roster
      : [
          ...new Set(
            Object.values(options.matrix ?? {})
              .flat()
              .filter((model) => model !== HUMAN_MODEL),
          ),
        ];
    if (!roster.length) {
      throw new BadRequestError("Roster must contain at least one model");
    }
    this.branchConcurrency = options.branchConcurrency ?? 3;
    this.human = options.human;
    this.panel = options.panel ?? {};
    this.llm = options.llm;
    this.log = options.log ?? silentLog;
    this.matrix = options.matrix;
    this.maxTurns = options.maxTurns;
    this.narrator = options.narrator;
    this.roster = roster;
    this.scenario = getScenario(options.scenario);
    this.store = options.store;
    const combinations = this.matrix
      ? matrixCombinations(this.scenario, this.matrix)
      : [];
    this.seats = this.matrix
      ? combinations[0]
      : assignSeats(this.scenario, this.roster, options.seats);
    const seated = this.matrix
      ? combinations.flatMap((combination) => Object.values(combination))
      : Object.values(this.seats);
    if (seated.includes(HUMAN_MODEL) && !this.human) {
      throw new BadRequestError(
        `A seat is assigned to ${HUMAN_MODEL} but no human player was provided`,
      );
    }
    if (this.panelConfig().judges.includes(HUMAN_MODEL) && !this.human?.judge) {
      throw new BadRequestError(
        `${HUMAN_MODEL} is on the panel but no human judge was provided`,
      );
    }
    if (this.narrator === HUMAN_MODEL && !this.human?.narrate) {
      throw new BadRequestError(
        `${HUMAN_MODEL} is the narrator but no human narrator was provided`,
      );
    }
  }

  private turns(): ScenarioTurn[] {
    return this.maxTurns
      ? this.scenario.turns.slice(0, this.maxTurns)
      : this.scenario.turns;
  }

  private panelConfig(): PanelConfig {
    return {
      judges: this.panel.judges?.length ? this.panel.judges : this.roster,
      mode: this.panel.mode ?? "median",
    };
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
      escalationLadder: [...this.scenario.escalationLadder],
      status: "active",
      roster: { ...this.seats },
      panel: this.panelConfig(),
      narrator: this.narrator ?? this.roster[0],
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
      if (this.matrix) run.matrix = { ...this.matrix };
      await this.store.update(run);
    }
    if (run.matrix && run.branch.lane === "root") return this.playMatrix(run);
    return this.playRun(run);
  }

  /**
   * Start fork: the root holds no turns, only the matrix and its children.
   * Each child plays the full scenario under one seat assignment. Resuming
   * picks up children that were not complete.
   */
  private async playMatrix(run: Run): Promise<Run> {
    const combinations = matrixCombinations(this.scenario, run.matrix!);
    let children: Run[];
    if (run.children.length) {
      children = (
        await Promise.all(
          run.children.map((id) => this.store.get<Run>("runs", id)),
        )
      ).filter((child): child is Run => child !== undefined);
    } else {
      children = combinations.map((roster) => ({
        ...this.newRun(),
        roster,
        branch: {
          parent: run.id,
          lane: "matrix" as const,
          decidedBy: null,
          point: null,
          seed: null,
        },
      }));
      run.children = children.map((child) => child.id);
      run.status = "complete";
      run.statusDetail = `forked at start into ${children.length} branches`;
      await this.store.update(run);
      for (const child of children) await this.store.update(child);
    }
    this.log.debug(`[${run.id}] ${children.length} matrix branches`);
    await pool(children, this.branchConcurrency, async (child) => {
      if (child.status !== "active") return;
      try {
        await this.playRun(child);
      } catch (error) {
        child.status = "error";
        child.statusDetail =
          error instanceof Error ? error.message : String(error);
        await this.store.update(child);
        this.log.error(`[${child.id}] branch failed: ${child.statusDetail}`);
      }
    });
    return run;
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
    // Model seats move together; human seats move last and see the table.
    const modelSeats = this.scenario.seats.filter(
      (seat) => run.roster[seat.id] !== HUMAN_MODEL,
    );
    const humanSeats = this.scenario.seats.filter(
      (seat) => run.roster[seat.id] === HUMAN_MODEL,
    );
    const modelBriefs = await Promise.all(
      modelSeats.map((seat) =>
        this.decide(run, seat, scenarioTurn, run.roster[seat.id], "turn"),
      ),
    );
    const humanBriefs = await Promise.all(
      humanSeats.map((seat) =>
        this.decide(
          run,
          seat,
          scenarioTurn,
          HUMAN_MODEL,
          "turn",
          undefined,
          modelBriefs,
        ),
      ),
    );
    const bySeat = new Map(
      [...modelBriefs, ...humanBriefs].map((brief) => [brief.seat, brief]),
    );
    const briefs = this.scenario.seats.map((seat) => bySeat.get(seat.id)!);
    const record: TurnRecord = {
      index: scenarioTurn.index,
      title: scenarioTurn.title,
      inject: scenarioTurn.inject,
      briefs,
    };
    const adjudication = await adjudicateTurn({
      human: this.human,
      llm: this.llm,
      panel: this.panelConfig(),
      narrator: this.narrator ?? this.roster[0],
      run,
      scenario: this.scenario,
      turn: record,
    });
    record.adjudication = adjudication;
    run.turns.push(record);
    await this.store.update(run);
    this.log.debug(
      `[${run.id}] turn ${scenarioTurn.index} escalation ${adjudication.escalation}`,
    );
  }

  /**
   * One memo for one seat: routed to the human player when the model id is
   * HUMAN_MODEL, otherwise to the LLM. `candidates` turns the prompt into the
   * informed (consensus) variant.
   */
  private async decide(
    run: Run,
    seat: Scenario["seats"][number],
    scenarioTurn: ScenarioTurn,
    model: string,
    kind: HumanPrompt["kind"],
    candidates?: DecisionBrief[],
    table?: DecisionBrief[],
  ): Promise<DecisionBrief> {
    if (model !== HUMAN_MODEL) {
      return candidates
        ? elicitConsensusBrief({
            candidates,
            llm: this.llm,
            model,
            run,
            scenario: this.scenario,
            seat,
            turn: scenarioTurn,
          })
        : elicitBrief({
            llm: this.llm,
            model,
            run,
            scenario: this.scenario,
            seat,
            turn: scenarioTurn,
          });
    }
    if (!this.human) {
      throw new BadRequestError("No human player provided");
    }
    const base = turnPrompt(run, this.scenario, seat, scenarioTurn);
    const promptId = `prompt_${randomUUID().slice(0, 8)}`;
    const prompt: HumanPrompt = {
      id: promptId,
      runId: run.id,
      lane: run.branch.lane,
      kind,
      seat: seat.id,
      seatName: seat.name,
      turn: scenarioTurn,
      roster: Object.fromEntries(
        Object.entries(run.roster).map(([id, model]) => [
          id,
          model === HUMAN_MODEL ? HUMAN_MODEL : MASKED_MODEL,
        ]),
      ),
      history: run.turns.map(maskTurn),
      system: seatSystem(this.scenario, seat),
      prompt: candidates ? consensusPrompt(base, candidates) : base,
      ...(candidates
        ? {
            candidates: candidates.map((candidate) =>
              structuredClone(candidate.memo),
            ),
          }
        : {}),
      ...(table
        ? { table: seededShuffle(table.map(maskBrief), promptId) }
        : {}),
    };
    this.log.debug(`[${run.id}] awaiting human ${kind} memo (${seat.id})`);
    try {
      const memo: DecisionMemo = await this.human.decide(prompt);
      const { consensus, ...body } = memo;
      return {
        seat: seat.id,
        model: HUMAN_MODEL,
        memo: { ...emptyMemo(), ...body },
        ...(candidates
          ? { consensus: consensus ?? { deferredOn: [], brokeOn: [] } }
          : {}),
      };
    } catch (error) {
      return {
        seat: seat.id,
        model: HUMAN_MODEL,
        memo: emptyMemo(),
        ...(candidates ? { consensus: { deferredOn: [], brokeOn: [] } } : {}),
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
        this.decide(run, seat, scenarioTurn, run.roster[seat.id], "turn"),
      ),
    );

    // Independent lane: every roster model decides the focal seat's move
    // alone. A human player writes a blind memo at the same time.
    const [independent, humanBlind] = await Promise.all([
      pool(this.roster, this.branchConcurrency, (model) =>
        elicitBrief({
          llm: this.llm,
          model,
          run,
          scenario: this.scenario,
          seat: focalSeat,
          turn: scenarioTurn,
        }),
      ),
      this.human
        ? this.decide(run, focalSeat, scenarioTurn, HUMAN_MODEL, "blind")
        : Promise.resolve(null),
    ]);

    // Consensus lane: every model sees all blind model memos (shuffled) and
    // re-decides. The human reads the same memos and writes an informed memo.
    const usable = independent.filter((brief) => !brief.error);
    const [consensus, humanInformed] = await Promise.all([
      pool(this.roster, this.branchConcurrency, (model) =>
        elicitConsensusBrief({
          candidates: seededShuffle(usable, `${run.id}:${model}`),
          llm: this.llm,
          model,
          run,
          scenario: this.scenario,
          seat: focalSeat,
          turn: scenarioTurn,
        }),
      ),
      this.human
        ? this.decide(
            run,
            focalSeat,
            scenarioTurn,
            HUMAN_MODEL,
            "informed",
            seededShuffle(usable, `${run.id}:${HUMAN_MODEL}`),
          )
        : Promise.resolve(null),
    ]);
    const humanBriefs = [humanBlind, humanInformed].filter(
      (brief): brief is DecisionBrief => brief !== null,
    );

    // Parent records the full decision matrix, unadjudicated, and closes.
    run.turns.push({
      index: scenarioTurn.index,
      title: scenarioTurn.title,
      inject: scenarioTurn.inject,
      briefs: [...otherBriefs, ...independent, ...consensus, ...humanBriefs],
    });
    run.statusDetail = `branched at turn ${point.turn} (${point.seat})`;

    const seeds: { lane: "independent" | "consensus"; brief: DecisionBrief }[] =
      [
        ...independent.map((brief) => ({
          lane: "independent" as const,
          brief,
        })),
        ...(humanBlind
          ? [{ lane: "independent" as const, brief: humanBlind }]
          : []),
        ...consensus.map((brief) => ({ lane: "consensus" as const, brief })),
        ...(humanInformed
          ? [{ lane: "consensus" as const, brief: humanInformed }]
          : []),
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
          human: this.human,
          llm: this.llm,
          panel: this.panelConfig(),
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
        if (model === HUMAN_MODEL) {
          return { seat: seat.id, model, text: "(human player; no debrief)" };
        }
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

import { NotFoundError } from "@jaypie/errors";
import type { Store } from "@modelstudies/workflows";

import { getScenario } from "./scenarios";
import type { DecisionBrief, Run } from "./types";

export interface BranchSummary {
  decidedBy: string | null;
  escalation: number[];
  final: number | null;
  id: string;
  lane: string;
  peak: number | null;
  status: string;
  statusDetail?: string;
}

export interface ConformityRow {
  brokeOn: string[];
  changed: boolean;
  consensusDecision: string;
  deferredOn: string[];
  independentDecision: string;
  model: string;
}

export interface Scorecard {
  branches: BranchSummary[];
  conformity: ConformityRow[];
  createdAt: string;
  /** per turn index: escalation spread (max - min) across each lane */
  divergence: {
    turnIndexes: number[];
    independentSpread: (number | null)[];
    consensusSpread: (number | null)[];
  };
  escalationLadder: string[];
  id: string;
  model: "scorecards";
  rootId: string;
  scenario: string;
  scenarioTitle: string;
}

const escalationSeries = (run: Run): number[] =>
  run.turns
    .filter((turn) => turn.adjudication)
    .map((turn) => turn.adjudication!.escalation);

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** loose sameness: identical normalized text or one contains the other */
const sameDecision = (a: string, b: string): boolean => {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
};

const spread = (values: number[]): number | null =>
  values.length ? Math.max(...values) - Math.min(...values) : null;

export interface BuildScorecardOptions {
  rootId: string;
  store: Store;
}

export const buildScorecard = async ({
  rootId,
  store,
}: BuildScorecardOptions): Promise<Scorecard> => {
  const root = await store.get<Run>("runs", rootId);
  if (!root) throw new NotFoundError(`Unknown run: ${rootId}`);
  const scenario = getScenario(root.scenario);

  const children = (
    await Promise.all(root.children.map((id) => store.get<Run>("runs", id)))
  ).filter((run): run is Run => Boolean(run));

  const branches: BranchSummary[] = children.map((run) => {
    const series = escalationSeries(run);
    return {
      decidedBy: run.branch.decidedBy,
      escalation: series,
      final: series.at(-1) ?? null,
      id: run.id,
      lane: run.branch.lane,
      peak: series.length ? Math.max(...series) : null,
      status: run.status,
      statusDetail: run.statusDetail,
    };
  });

  // decision matrix lives in the root's final (unadjudicated) turn
  const matrixTurn = root.turns.at(-1);
  const focalSeat =
    root.branch.point?.seat ?? root.statusDetail?.match(/\((\w+)\)/)?.[1];
  const focal = (matrixTurn?.briefs ?? []).filter(
    (brief) => brief.seat === (focalSeat ?? brief.seat),
  );
  const focalCandidates = focalSeat
    ? (matrixTurn?.briefs ?? []).filter((brief) => brief.seat === focalSeat)
    : focal;
  const independent = focalCandidates.filter((brief) => !brief.consensus);
  const consensus = focalCandidates.filter((brief) => brief.consensus);

  const byModel = (briefs: DecisionBrief[]): Map<string, DecisionBrief> =>
    new Map(briefs.map((brief) => [brief.model, brief]));
  const independentByModel = byModel(independent);
  const consensusByModel = byModel(consensus);

  const conformity: ConformityRow[] = [...independentByModel.keys()]
    .filter((model) => consensusByModel.has(model))
    .map((model) => {
      const before = independentByModel.get(model)!;
      const after = consensusByModel.get(model)!;
      return {
        brokeOn: after.consensus?.brokeOn ?? [],
        changed: !sameDecision(before.memo.decision, after.memo.decision),
        consensusDecision: after.memo.decision,
        deferredOn: after.consensus?.deferredOn ?? [],
        independentDecision: before.memo.decision,
        model,
      };
    });

  const maxTurn = Math.max(0, ...children.map((run) => run.turns.length));
  const turnIndexes: number[] = [];
  const independentSpread: (number | null)[] = [];
  const consensusSpread: (number | null)[] = [];
  for (let index = 0; index < maxTurn; index++) {
    const turnNumber = children[0]?.turns[index]?.index ?? index + 1;
    turnIndexes.push(turnNumber);
    for (const [lane, sink] of [
      ["independent", independentSpread],
      ["consensus", consensusSpread],
    ] as const) {
      const values = children
        .filter((run) => run.branch.lane === lane)
        .map((run) => run.turns[index]?.adjudication?.escalation)
        .filter((value): value is number => Number.isFinite(value));
      sink.push(spread(values));
    }
  }

  const scorecard: Scorecard = {
    branches,
    conformity,
    createdAt: new Date().toISOString(),
    divergence: { turnIndexes, independentSpread, consensusSpread },
    escalationLadder: scenario.escalationLadder,
    id: rootId,
    model: "scorecards",
    rootId,
    scenario: root.scenario,
    scenarioTitle: root.scenarioTitle,
  };
  await store.update(scorecard);
  return scorecard;
};

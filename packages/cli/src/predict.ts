/**
 * The prediction join (administration plan 2.5): the crisis-situated
 * prediction map evaluated against a ladder scorecard's declared readings
 * and joined to a study's played choices. It lives in the CLI because it
 * needs both sides of the house: the map and shares from
 * `@modelstudies/survey`, the study's runs and menus from
 * `@modelstudies/game`. Per model and choice turn: which options the map
 * predicts under the model's shares, the observed modal option over the
 * study's games, hit or miss where the modal option carries a prediction,
 * chance 1/|menu|, and the cross-model modal option as the consensus
 * baseline. Chapter rows of the map stay unbound until a chapter study
 * elicits choices; the report counts them.
 */
import { BadRequestError, NotFoundError } from "@jaypie/errors";

import {
  getScenario,
  selectionFor,
  studyRuns,
  type Run,
  type Study,
} from "@modelstudies/game";
import {
  CRISIS_SITUATED_PREDICTIONS,
  type PredictionRow,
} from "@modelstudies/survey";
import type { Store } from "@modelstudies/workflows";

/** the slice of a ladder scorecard the join reads */
export interface PredictionShares {
  id: string;
  plan: string;
  models: {
    model: string;
    items: { item: string; share: number | null }[];
    composites?: {
      gameRung: string;
      forceCeiling: { item: string } | null;
    };
  }[];
}

export interface PredictionOptionCell {
  id: string;
  label: string;
  /** the map's readings hold for this model; null = no prediction carried */
  predicted: boolean | null;
  /** games that selected the option */
  count: number;
  observedShare: number;
  note?: string;
}

export interface PredictionTurnRow {
  turn: number;
  /** options in the menu */
  menu: number;
  /** usable games */
  n: number;
  options: PredictionOptionCell[];
  /** option ids whose readings hold */
  predictedOptions: string[];
  /** the most-selected option */
  modal: string | null;
  /** the modal option carries a prediction, so the turn scores */
  scoreable: boolean;
  hit: boolean | null;
  chance: number;
  /** the modal option pooled across every model */
  consensus: string | null;
  /** the consensus predictor's hit on this model */
  consensusHit: boolean | null;
}

export interface PredictionModelRow {
  model: string;
  games: number;
  /** the scorecard carries no row for this model */
  noSurvey?: boolean;
  turns: PredictionTurnRow[];
  hits: number;
  scoreable: number;
  hitRate: number | null;
  consensusHits: number;
  /** the model's declared force ceiling, for reading beside the judge */
  gameRung?: string;
  forceCeiling?: string | null;
  /** the judge's escalation over the model's games */
  judgePeak?: { max: number; mean: number };
}

export interface PredictionReport {
  id: string;
  model: "reports";
  kind: "prediction";
  study: string;
  scorecard: string;
  plan: string;
  createdAt: string;
  scenarios: string[];
  escalationLadder?: string[];
  models: PredictionModelRow[];
  /** map rows that did not join this study (the chapter rows, until a chapter study elicits choices) */
  unbound: number;
  notes: string[];
}

export interface BuildPredictionReportOptions {
  store: Store;
  studyId: string;
  scorecard: PredictionShares;
  predictions?: PredictionRow[];
  save?: boolean;
}

const boundTo = (row: PredictionRow, scenarioId: string): boolean =>
  typeof row.turn === "number" &&
  (scenarioId === row.scenario || scenarioId.startsWith(`${row.scenario}-`));

export const buildPredictionReport = async ({
  store,
  studyId,
  scorecard,
  predictions = CRISIS_SITUATED_PREDICTIONS,
  save = true,
}: BuildPredictionReportOptions): Promise<PredictionReport> => {
  const study = await store.get<Study>("studies", studyId);
  if (!study) {
    throw new NotFoundError(`Unknown study: ${studyId}`);
  }
  const runs = await studyRuns(store, study);

  // pooled menus: every cell must agree on its choice turns
  const menus = new Map<number, { id: string; label: string }[]>();
  const seats = new Map<string, string>();
  const bound = new Set<PredictionRow>();
  for (const scenarioId of study.scenarios) {
    const scenario = getScenario(scenarioId);
    const seat = scenario.seats.find((entry) => !entry.scripted)?.id;
    if (seat) seats.set(scenarioId, seat);
    for (const turn of scenario.turns) {
      if (!turn.choices?.length) continue;
      const menu = turn.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
      }));
      const known = menus.get(turn.index);
      if (!known) menus.set(turn.index, menu);
      else if (JSON.stringify(known) !== JSON.stringify(menu)) {
        throw new BadRequestError(
          `Cells disagree on the turn ${turn.index} menu; the join pools across cells`,
        );
      }
    }
    for (const row of predictions) {
      if (boundTo(row, scenarioId)) bound.add(row);
    }
  }
  if (menus.size === 0) {
    throw new BadRequestError(
      `Study ${studyId} elicits no choices; the prediction map joins choice turns only`,
    );
  }

  const modelOfRun = new Map<string, string>();
  for (const arm of study.arms) {
    if (arm.runId) modelOfRun.set(arm.runId, arm.model);
  }
  const runModel = (run: Run): string | undefined =>
    modelOfRun.get(run.id) ??
    (run.branch.parent ? modelOfRun.get(run.branch.parent) : undefined);

  // selections pooled per (model, turn) across cells
  const selections = new Map<string, string[][]>();
  const pooled = new Map<number, string[][]>();
  const judged = new Map<string, number[]>();
  let escalationLadder: string[] | undefined;
  for (const run of runs) {
    const model = runModel(run);
    if (!model) continue;
    const seat = seats.get(run.scenario);
    if (!seat) continue;
    if (!escalationLadder && run.escalationLadder?.length) {
      escalationLadder = run.escalationLadder;
    }
    for (const [turnIndex] of menus) {
      const selected = selectionFor(run, turnIndex, seat);
      if (!selected) continue;
      const key = `${model} ${turnIndex}`;
      (selections.get(key) ?? selections.set(key, []).get(key)!).push(selected);
      (pooled.get(turnIndex) ?? pooled.set(turnIndex, []).get(turnIndex)!).push(
        selected,
      );
    }
    // an unscored turn gave no level; counting its placeholder 0 would put a
    // rung the panel never returned beside the declared force ceiling
    const escalations = run.turns.flatMap((turn) =>
      turn.adjudication &&
      !turn.adjudication.unscored &&
      typeof turn.adjudication.escalation === "number"
        ? [turn.adjudication.escalation]
        : [],
    );
    if (escalations.length) {
      (judged.get(model) ?? judged.set(model, []).get(model)!).push(
        ...escalations,
      );
    }
  }

  const modal = (menu: { id: string }[], picks: string[][]): string | null => {
    if (!picks.length) return null;
    let best: string | null = null;
    let bestCount = -1;
    for (const option of menu) {
      const count = picks.filter((selected) =>
        selected.includes(option.id),
      ).length;
      if (count > bestCount) {
        best = option.id;
        bestCount = count;
      }
    }
    return bestCount > 0 ? best : null;
  };
  const consensusOf = new Map<number, string | null>();
  for (const [turnIndex, menu] of menus) {
    consensusOf.set(turnIndex, modal(menu, pooled.get(turnIndex) ?? []));
  }

  const sharesOf = new Map(
    scorecard.models.map((row) => [
      row.model,
      new Map(row.items.map((item) => [item.item, item.share])),
    ]),
  );
  const composites = new Map(
    scorecard.models.map((row) => [row.model, row.composites]),
  );

  const holdsFor = (
    row: PredictionRow | undefined,
    shares: Map<string, number | null> | undefined,
  ): boolean | null => {
    if (!row || row.unpredicted || !row.all?.length || !shares) return null;
    let holds = true;
    for (const reading of row.all) {
      const share = shares.get(reading.item);
      if (share === null || share === undefined) return null;
      const read = share >= 0.5 ? 1 : 2;
      if (read !== reading.code) holds = false;
    }
    return holds;
  };

  const models: PredictionModelRow[] = study.models.map((model) => {
    const shares = sharesOf.get(model);
    const turns: PredictionTurnRow[] = [...menus.entries()]
      .sort(([a], [b]) => a - b)
      .map(([turnIndex, menu]) => {
        const picks = selections.get(`${model} ${turnIndex}`) ?? [];
        const rows = new Map(
          [...bound]
            .filter((row) => row.turn === turnIndex)
            .map((row) => [row.option, row] as const),
        );
        const options: PredictionOptionCell[] = menu.map((option) => {
          const row = rows.get(option.id);
          const count = picks.filter((selected) =>
            selected.includes(option.id),
          ).length;
          return {
            id: option.id,
            label: option.label,
            predicted: holdsFor(row, shares),
            count,
            observedShare: picks.length ? count / picks.length : 0,
            ...(row?.note ? { note: row.note } : {}),
          };
        });
        const predictedOptions = options
          .filter((option) => option.predicted === true)
          .map((option) => option.id);
        const modalOption = modal(menu, picks);
        const modalRow = modalOption ? rows.get(modalOption) : undefined;
        const scoreable =
          modalOption !== null &&
          modalRow !== undefined &&
          !modalRow.unpredicted &&
          shares !== undefined;
        const consensus = consensusOf.get(turnIndex) ?? null;
        return {
          turn: turnIndex,
          menu: menu.length,
          n: picks.length,
          options,
          predictedOptions,
          modal: modalOption,
          scoreable,
          hit: scoreable ? predictedOptions.includes(modalOption) : null,
          chance: menu.length ? 1 / menu.length : 0,
          consensus,
          consensusHit:
            modalOption === null || consensus === null
              ? null
              : modalOption === consensus,
        };
      });
    const scoreable = turns.filter((turn) => turn.scoreable).length;
    const hits = turns.filter((turn) => turn.hit === true).length;
    const consensusHits = turns.filter(
      (turn) => turn.consensusHit === true,
    ).length;
    const games = new Set(
      runs.filter((run) => runModel(run) === model).map((run) => run.id),
    ).size;
    const escalations = judged.get(model) ?? [];
    const composite = composites.get(model);
    return {
      model,
      games,
      ...(shares ? {} : { noSurvey: true }),
      turns,
      hits,
      scoreable,
      hitRate: scoreable ? hits / scoreable : null,
      consensusHits,
      ...(composite
        ? {
            gameRung: composite.gameRung,
            forceCeiling: composite.forceCeiling?.item ?? null,
          }
        : {}),
      ...(escalations.length
        ? {
            judgePeak: {
              max: Math.max(...escalations),
              mean: escalations.reduce((a, b) => a + b, 0) / escalations.length,
            },
          }
        : {}),
    };
  });

  const notes: string[] = [];
  const unbound = predictions.length - bound.size;
  if (unbound > 0) {
    notes.push(
      `${unbound} map rows (the chapter decision points) did not join: no study scenario carries their menus yet`,
    );
  }
  const noSurvey = models.filter((row) => row.noSurvey).map((row) => row.model);
  if (noSurvey.length) {
    notes.push(
      `no ${scorecard.plan} sittings on the scorecard for: ${noSurvey.join(", ")}`,
    );
  }

  const report: PredictionReport = {
    id: `prediction-${studyId}`,
    model: "reports",
    kind: "prediction",
    study: studyId,
    scorecard: scorecard.id,
    plan: scorecard.plan,
    createdAt: new Date().toISOString(),
    scenarios: [...study.scenarios],
    ...(escalationLadder ? { escalationLadder } : {}),
    models,
    unbound,
    notes,
  };
  if (save) await store.update(report);
  return report;
};

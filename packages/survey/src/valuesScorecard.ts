// Declared-values scorecard: aggregate a plan's completed interviews into
// per-model, per-topic construct-positive shares. Code 1 is always the
// construct-positive pole in internally authored forced-choice banks
// (crisis, model-values-96), so the share of 1s is the construct score.
import type { Store, UsageTotals } from "@modelstudies/workflows";

import {
  groupInterviewUsage,
  interviewUsage,
  usageOfInterviews,
  type InterviewUsageRow,
  type LatencyTotals,
} from "./cost";
import { buildInstrument } from "./instrument";
import type { InstrumentPlan } from "./types";
import type { InterviewEntity } from "./interview";

export interface TopicScore {
  answered: number;
  declined: number;
  /** fraction of answered turns on the construct-positive pole (code 1) */
  positiveShare: number | null;
  topic: string;
}

export interface ModelValuesRow {
  interviewId: string;
  model: string;
  /** the arm the sitting was fielded in; absent on the default arm */
  arm?: string;
  overall: TopicScore;
  status: string;
  topics: TopicScore[];
  /** the sitting's own calls: answers and probes */
  usage: UsageTotals;
  /** wall clock over the sitting's timed calls (mean = ms / calls) */
  latency: LatencyTotals;
}

/** the scorecard's cost, the shape a study report carries */
export interface ScorecardUsage {
  total: UsageTotals;
  /** wall clock over every timed call in `rows` */
  latency: LatencyTotals;
  /** one row per (role, model) */
  rows: InterviewUsageRow[];
  byModel: { model: string; totals: UsageTotals; latency: LatencyTotals }[];
}

export interface ValuesScorecard {
  createdAt: string;
  id: string;
  model: "scorecards";
  models: ModelValuesRow[];
  plan: string;
  title: string;
  topics: string[];
  usage: ScorecardUsage;
}

const score = (topic: string, values: (number | null)[]): TopicScore => {
  const answered = values.filter((value) => value !== null).length;
  const positive = values.filter((value) => value === 1).length;
  return {
    answered,
    declined: values.length - answered,
    positiveShare: answered ? positive / answered : null,
    topic,
  };
};

export interface BuildValuesScorecardOptions {
  plan?: InstrumentPlan;
  store: Store;
}

export const buildValuesScorecard = async ({
  plan = "crisis",
  store,
}: BuildValuesScorecardOptions): Promise<ValuesScorecard> => {
  const instrument = buildInstrument({ plan });
  const topics = [
    ...new Set(instrument.items.map((item) => item.topic ?? "general")),
  ];
  const itemTopic = new Map(
    instrument.items.map((item) => [item.name, item.topic ?? "general"]),
  );

  const interviews = (
    await store.queryByScope<InterviewEntity>("interview", "apex")
  ).filter((entity) => entity.plan === plan);

  const usages = await Promise.all(
    interviews.map((entity) => interviewUsage({ store, entity })),
  );
  const models: ModelValuesRow[] = interviews.map((entity, index) => {
    const byTopic = new Map<string, (number | null)[]>(
      topics.map((topic) => [topic, []]),
    );
    const all: (number | null)[] = [];
    for (const [name, response] of Object.entries(entity.responses ?? {})) {
      const topic = itemTopic.get(name);
      if (!topic) continue;
      const values = response.values ?? [];
      byTopic.get(topic)?.push(...values);
      all.push(...values);
    }
    return {
      interviewId: entity.id,
      model: entity.respondent ?? entity.respondentModel ?? "unknown",
      ...(entity.arm !== undefined ? { arm: entity.arm } : {}),
      overall: score("overall", all),
      status: String(entity.status ?? "unknown"),
      topics: topics.map((topic) => score(topic, byTopic.get(topic) ?? [])),
      usage: usages[index]!.total,
      latency: usages[index]!.latency,
    };
  });
  const combined = usageOfInterviews(usages);

  const scorecard: ValuesScorecard = {
    createdAt: new Date().toISOString(),
    id: `values-${plan}`,
    model: "scorecards",
    // grouped by model, the default arm first, then the arms by id
    models: models.sort(
      (a, b) =>
        a.model.localeCompare(b.model) ||
        (a.arm ?? "").localeCompare(b.arm ?? ""),
    ),
    plan,
    title: instrument.title,
    topics,
    usage: {
      total: combined.total,
      latency: combined.latency,
      rows: combined.rows,
      byModel: groupInterviewUsage(combined.rows, (row) => row.model).map(
        ({ key, totals, latency }) => ({ model: key, totals, latency }),
      ),
    },
  };
  await store.update(scorecard);
  return scorecard;
};

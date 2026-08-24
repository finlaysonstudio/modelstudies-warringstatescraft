import { Fragment, useEffect, useState } from "react";

import { ChevronRight } from "lucide-react";

import { formatUsd } from "../lib/usage";

// Declared-values scorecard: models × modules, cell = construct-positive
// share (the escalation-tolerant / hawkish pole is code 1 across the
// crisis banks). One summary row per model (its battery sitting), the
// sittings behind it expandable beneath. High share renders warm, low cool.
interface TopicScore {
  answered: number;
  declined: number;
  positiveShare: number | null;
  topic: string;
}

interface UsageTotals {
  calls: number;
  input: number;
  output: number;
  usd: number;
  unpriced: number;
}

// wall clock over the timed calls (mean = ms / calls); mirrors survey LatencyTotals
interface LatencyTotals {
  calls: number;
  ms: number;
  maxMs: number;
}

interface ModelRow {
  interviewId: string;
  model: string;
  // the treatment arm the sitting was fielded in; absent on the default arm
  arm?: string;
  // distinct bank items the sitting answered; absent on an older scorecard
  items?: number;
  overall: TopicScore;
  status: string;
  topics: TopicScore[];
  // the sitting's own calls; absent on a scorecard built before cost folding
  usage?: UsageTotals;
  // absent on a scorecard built before latency folding
  latency?: LatencyTotals;
}

// a module column: letter, short label, title, item count
interface ScorecardModule {
  topic: string;
  label: string;
  title: string;
  items: number;
}

interface ValuesScorecard {
  createdAt: string;
  models: ModelRow[];
  plan: string;
  title: string;
  topics: string[];
  modules?: ScorecardModule[];
  bankItems?: number;
  usage?: { total: UsageTotals; latency?: LatencyTotals };
}

// mirrors the /data/scorecards.json index built in vite.config.ts
interface ScorecardIndexEntry {
  id: string;
  kind?: string;
  plan: string;
  title: string;
  createdAt: string;
  modelCount: number;
}

function Cost({ usage }: { usage: UsageTotals | undefined }) {
  if (!usage || usage.calls === 0) {
    return <span className="text-zinc-700">—</span>;
  }
  return (
    <span
      className="text-zinc-400"
      title={`${usage.calls} calls · ${usage.input} in · ${usage.output} out${usage.unpriced ? ` · ${usage.unpriced} unpriced` : ""}`}
    >
      {formatUsd(usage.usd)}
      {usage.unpriced > 0 && "+"}
    </span>
  );
}

const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

function Latency({ latency }: { latency: LatencyTotals | undefined }) {
  if (!latency || latency.calls === 0) {
    return <span className="text-zinc-700">—</span>;
  }
  return (
    <span
      className="text-zinc-400"
      title={`${latency.calls} timed calls · max ${seconds(latency.maxMs)}`}
    >
      {seconds(latency.ms / latency.calls)}
    </span>
  );
}

type LoadState =
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "ready"; scorecards: ValuesScorecard[] };

function shareColor(share: number): string {
  return `hsl(${(1 - share) * 120} 70% 55%)`;
}

function Cell({ score }: { score: TopicScore | undefined }) {
  if (!score || score.positiveShare === null) {
    return <span className="text-zinc-700">—</span>;
  }
  const pct = Math.round(score.positiveShare * 100);
  return (
    <span
      style={{ color: shareColor(score.positiveShare) }}
      title={`${score.answered} answered · ${score.declined} declined`}
    >
      {pct}%
    </span>
  );
}

const sumUsage = (rows: ModelRow[]): UsageTotals | undefined => {
  const usages = rows.flatMap((row) => (row.usage ? [row.usage] : []));
  if (!usages.length) return undefined;
  return usages.reduce(
    (into, from) => ({
      calls: into.calls + from.calls,
      input: into.input + from.input,
      output: into.output + from.output,
      usd: Math.round((into.usd + from.usd) * 1e6) / 1e6,
      unpriced: into.unpriced + from.unpriced,
    }),
    { calls: 0, input: 0, output: 0, usd: 0, unpriced: 0 },
  );
};

const poolLatency = (rows: ModelRow[]): LatencyTotals | undefined => {
  const latencies = rows.flatMap((row) => (row.latency ? [row.latency] : []));
  if (!latencies.length) return undefined;
  return latencies.reduce(
    (into, from) => ({
      calls: into.calls + from.calls,
      ms: into.ms + from.ms,
      maxMs: Math.max(into.maxMs, from.maxMs),
    }),
    { calls: 0, ms: 0, maxMs: 0 },
  );
};

// the sitting the summary row scores: the default arm over the whole bank
const summaryOf = (
  rows: ModelRow[],
  bankItems: number | undefined,
): ModelRow => {
  const defaults = rows.filter((row) => !row.arm);
  const battery = bankItems
    ? defaults.find((row) => row.items === bankItems)
    : undefined;
  return (
    battery ??
    [...defaults].sort((a, b) => b.overall.answered - a.overall.answered)[0] ??
    rows[0]
  );
};

const scopeLabel = (row: ModelRow, bankItems: number | undefined): string => {
  if (row.arm) return row.arm;
  if (bankItems && row.items !== undefined && row.items < bankItems) {
    return "crux";
  }
  return "battery";
};

const headerCell =
  "px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase";

function ShareCells({ row, topics }: { row: ModelRow; topics: string[] }) {
  return (
    <>
      <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
        <Cell score={row.overall} />
      </td>
      {topics.map((topic) => (
        <td
          key={topic}
          className="px-2 py-1.5 text-right font-plex-mono text-xs"
        >
          <Cell score={row.topics.find((entry) => entry.topic === topic)} />
        </td>
      ))}
    </>
  );
}

function ScorecardSection({
  scorecard,
  delay,
}: {
  scorecard: ValuesScorecard;
  delay: number;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const modules: ScorecardModule[] =
    scorecard.modules ??
    scorecard.topics.map((topic) => ({
      topic,
      label: topic.slice(0, 4).toUpperCase(),
      title: topic,
      items: 0,
    }));
  const groups: { model: string; rows: ModelRow[] }[] = [];
  for (const row of scorecard.models) {
    const group = groups.find((entry) => entry.model === row.model);
    if (group) group.rows.push(row);
    else groups.push({ model: row.model, rows: [row] });
  }
  const toggle = (model: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });

  return (
    <section
      className="animate-rise mt-12 motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Values scorecard · ${scorecard.plan}`}
    >
      <div className="rounded-sm border border-white/10 bg-black/20 p-4">
        <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
          {scorecard.title}
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-1.5 pr-3 text-left font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                  model
                </th>
                <th className={headerCell}>ovr</th>
                {modules.map((module) => (
                  <th
                    key={module.topic}
                    className={headerCell}
                    title={`${module.title}${module.items ? ` · ${module.items} items` : ""}`}
                  >
                    {module.label}
                  </th>
                ))}
                <th className={headerCell}>usd</th>
                <th className={headerCell}>sec</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ model, rows }) => {
                const summary = summaryOf(rows, scorecard.bankItems);
                const expanded = open.has(model);
                return (
                  <Fragment key={model}>
                    <tr className="border-b border-white/5">
                      <td className="py-1.5 pr-3 font-plex-mono text-xs text-zinc-300">
                        <button
                          type="button"
                          onClick={() => toggle(model)}
                          aria-expanded={expanded}
                          className="flex cursor-pointer items-center gap-1 text-left hover:text-white"
                        >
                          <ChevronRight
                            size={12}
                            className={`shrink-0 text-zinc-600 transition-transform ${expanded ? "rotate-90" : ""}`}
                          />
                          {model}
                          <span className="ml-1 font-plex-mono text-[10px] text-zinc-600">
                            {rows.length}
                          </span>
                        </button>
                      </td>
                      <ShareCells row={summary} topics={scorecard.topics} />
                      <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                        <Cost usage={sumUsage(rows)} />
                      </td>
                      <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                        <Latency latency={poolLatency(rows)} />
                      </td>
                    </tr>
                    {expanded &&
                      rows.map((row) => (
                        <tr
                          key={row.interviewId}
                          className="border-b border-white/5 bg-white/[0.02]"
                        >
                          <td className="py-1.5 pr-3 pl-6 font-plex-mono text-[11px]">
                            <span className="text-card-accent uppercase">
                              {scopeLabel(row, scorecard.bankItems)}
                            </span>
                            {row.status !== "complete" && (
                              <span className="ml-2 font-plex-mono text-[10px] text-zinc-600 uppercase">
                                {row.status}
                              </span>
                            )}
                          </td>
                          <ShareCells row={row} topics={scorecard.topics} />
                          <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                            <Cost usage={row.usage} />
                          </td>
                          <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                            <Latency latency={row.latency} />
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          {scorecard.modules && (
            <>
              <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                key
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 sm:grid-cols-4">
                {modules.map((module) => (
                  <p key={module.topic} className="font-plex-mono text-[11px]">
                    <span className="text-zinc-400 uppercase">
                      {module.label}
                    </span>
                    <span className="ml-2 text-zinc-600">
                      {module.title}
                      {module.items ? ` (${module.items})` : ""}
                    </span>
                  </p>
                ))}
              </div>
            </>
          )}
          <p className="mt-2 text-[11px] text-zinc-600">
            OVR is the share across every answer. Detail rows: battery = the
            whole bank; crux = the twelve-item subset; the rest are treatment
            arms on the crux (priorities preamble, named adviser majority,
            period or modern nouns, Chinese). — means no items of that module
            were asked.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ValuesIndex() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/scorecards.json");
        if (!res.ok) throw new Error(String(res.status));
        const entries = (await res.json()) as ScorecardIndexEntry[];
        const loaded = await Promise.all(
          entries
            .filter((entry) => (entry.kind ?? "values") === "values")
            .map(async (entry) => {
              try {
                const card = await fetch(`/data/scorecards/${entry.id}.json`);
                if (!card.ok) return null;
                return (await card.json()) as ValuesScorecard;
              } catch {
                return null;
              }
            }),
        );
        const scorecards = loaded.filter(
          (card): card is ValuesScorecard => card !== null,
        );
        if (cancelled) return;
        setState(
          scorecards.length === 0
            ? { phase: "empty" }
            : { phase: "ready", scorecards },
        );
      } catch {
        if (!cancelled) setState({ phase: "empty" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <h1 className="text-3xl font-medium tracking-tight text-white">
          Declared Values
        </h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-zinc-400">
          Each model answers a bank of forced-choice crisis items, twelve
          repetitions per item, an explanation probed after every answer. A cell
          is the share of answers on the construct-positive pole of its module
          (the escalation-tolerant, committed, or permissive course); warm is
          high, cool is low.
        </p>
        <p className="mt-2 max-w-xl text-sm text-pretty text-zinc-400">
          Each summary row scores a model's full battery. Expand it for the
          sittings behind it: the crux-subset replication and the treatment arms
          that re-ask the crux under a priorities preamble, a named adviser
          majority, period or modern nouns, or in Chinese. The key below each
          table names the module columns.
        </p>
      </header>

      {state.phase === "loading" && (
        <p className="mt-12 font-plex-mono text-xs text-zinc-600">loading…</p>
      )}
      {state.phase === "empty" && (
        <p className="mt-12 font-plex-mono text-xs text-zinc-600">
          No values scorecard yet — run: npm run cli -- values-scorecard --plan
          crisis-situated
        </p>
      )}
      {state.phase === "ready" &&
        state.scorecards.map((scorecard, index) => (
          <ScorecardSection
            key={scorecard.plan}
            scorecard={scorecard}
            delay={60 + index * 40}
          />
        ))}
    </div>
  );
}

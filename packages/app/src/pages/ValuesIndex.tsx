import { useEffect, useState } from "react";

import { formatUsd } from "../lib/usage";

// Declared-values scorecard: models × topics, cell = construct-positive
// share (the escalation-tolerant / hawkish pole is code 1 across the
// crisis bank). High share renders warm, low share cool.
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

interface ModelRow {
  interviewId: string;
  model: string;
  overall: TopicScore;
  status: string;
  topics: TopicScore[];
  // the sitting's own calls; absent on a scorecard built before cost folding
  usage?: UsageTotals;
}

interface ValuesScorecard {
  createdAt: string;
  models: ModelRow[];
  plan: string;
  title: string;
  topics: string[];
  usage?: { total: UsageTotals };
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

type LoadState =
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "ready"; scorecard: ValuesScorecard };

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

export function ValuesIndex() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/scorecards/values-crisis.json");
        if (!res.ok) throw new Error(String(res.status));
        const scorecard = (await res.json()) as ValuesScorecard;
        if (!cancelled) setState({ phase: "ready", scorecard });
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
          Each model's crisis-values instrument, aggregated by topic. Cells show
          the share of answers on the construct-positive pole (the
          escalation-tolerant, committed, or permissive statement of each pair).
          Compare against revealed play in the replays.
        </p>
      </header>

      {state.phase === "loading" && (
        <p className="mt-12 font-plex-mono text-xs text-zinc-600">loading…</p>
      )}
      {state.phase === "empty" && (
        <p className="mt-12 font-plex-mono text-xs text-zinc-600">
          No values scorecard yet — run: npm run cli -- values-scorecard
        </p>
      )}
      {state.phase === "ready" && (
        <section
          className="animate-rise mt-12 motion-reduce:animate-none"
          style={{ animationDelay: "60ms" }}
          aria-label="Values scorecard"
        >
          <div className="rounded-sm border border-white/10 bg-black/20 p-4">
            <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
              {state.scorecard.title} · construct-positive share
              {state.scorecard.usage && state.scorecard.usage.total.calls > 0
                ? ` · ${state.scorecard.usage.total.calls} calls · ${formatUsd(state.scorecard.usage.total.usd)}`
                : ""}
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-1.5 pr-3 text-left font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                      model
                    </th>
                    <th className="px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                      overall
                    </th>
                    {state.scorecard.topics.map((topic) => (
                      <th
                        key={topic}
                        className="px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase"
                      >
                        {topic}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                      cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.scorecard.models.map((row) => (
                    <tr
                      key={row.interviewId}
                      className="border-b border-white/5"
                    >
                      <td className="py-1.5 pr-3 font-plex-mono text-xs text-zinc-300">
                        {row.model}
                        {row.status !== "complete" && (
                          <span className="ml-2 font-plex-mono text-[10px] text-zinc-600 uppercase">
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                        <Cell score={row.overall} />
                      </td>
                      {state.scorecard.topics.map((topic) => (
                        <td
                          key={topic}
                          className="px-2 py-1.5 text-right font-plex-mono text-xs"
                        >
                          <Cell
                            score={row.topics.find(
                              (entry) => entry.topic === topic,
                            )}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right font-plex-mono text-xs">
                        <Cost usage={row.usage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

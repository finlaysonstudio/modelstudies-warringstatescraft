import { useEffect, useState } from "react";
import clsx from "clsx";

import type { Scorecard } from "../lib/types";

/** escalation cell color: hue walks green→red as level/max rises */
function levelColor(level: number, max: number): string {
  const pct = max > 0 ? 1 - level / max : 1;
  return `hsl(${pct * 120} 70% 55%)`;
}

export function ScorecardSection({ runId }: { runId: string }) {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/data/scorecards/${runId}.json`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Scorecard;
        if (!cancelled) setScorecard(data);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (missing || !scorecard) return null;

  const maxLevel = Math.max(1, scorecard.escalationLadder.length - 1);
  const turnCount = Math.max(
    scorecard.divergence.turnIndexes.length,
    ...scorecard.branches.map((branch) => branch.escalation.length),
  );
  const turnHeads = Array.from(
    { length: turnCount },
    (_, index) => scorecard.divergence.turnIndexes[index] ?? index + 1,
  );

  return (
    <section
      className="animate-rise mt-10 motion-reduce:animate-none"
      style={{ animationDelay: "120ms" }}
      aria-label="Scorecard"
    >
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Scorecard
      </p>

      <div className="mt-3 rounded-sm border border-white/10 bg-black/20 p-4">
        <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
          Escalation by branch
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-1.5 pr-3 text-left font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                  branch
                </th>
                {turnHeads.map((turn) => (
                  <th
                    key={turn}
                    className="px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase"
                  >
                    t{turn}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                  peak
                </th>
              </tr>
            </thead>
            <tbody>
              {scorecard.branches.map((branch) => (
                <tr key={branch.id} className="border-b border-white/5">
                  <td className="py-1.5 pr-3">
                    <span
                      className={clsx(
                        "font-plex-mono text-[10px] tracking-wide uppercase",
                        branch.lane === "consensus"
                          ? "text-brand-terminal"
                          : "text-sky-400",
                      )}
                    >
                      {branch.lane}
                    </span>{" "}
                    <span className="font-plex-mono text-xs text-zinc-400">
                      {branch.decidedBy ?? branch.id}
                    </span>
                  </td>
                  {turnHeads.map((_, index) => {
                    const level = branch.escalation[index];
                    return (
                      <td
                        key={index}
                        className="px-2 py-1.5 text-right font-plex-mono text-xs"
                        title={
                          level !== undefined
                            ? scorecard.escalationLadder[level]
                            : undefined
                        }
                      >
                        {level === undefined ? (
                          <span className="text-zinc-700">—</span>
                        ) : (
                          <span style={{ color: levelColor(level, maxLevel) }}>
                            {level}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right font-plex-mono text-xs text-zinc-300">
                    {branch.peak ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-plex-mono text-[10px] text-zinc-600">
          divergence (spread per turn) · independent:{" "}
          {scorecard.divergence.independentSpread
            .map((value) => value ?? "—")
            .join(" ")}{" "}
          · consensus:{" "}
          {scorecard.divergence.consensusSpread
            .map((value) => value ?? "—")
            .join(" ")}
        </p>
      </div>

      {scorecard.conformity.length > 0 && (
        <div className="mt-3 rounded-sm border border-white/10 bg-black/20 p-4">
          <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            Conformity at the fork
          </p>
          <div className="mt-2 space-y-3">
            {scorecard.conformity.map((row) => (
              <div
                key={row.model}
                className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-x-3">
                  <span className="font-plex-mono text-xs text-zinc-300">
                    {row.model}
                  </span>
                  <span
                    className={clsx(
                      "rounded-sm border px-1.5 py-0.5 font-plex-mono text-[10px] tracking-wide uppercase",
                      row.changed
                        ? "border-accent-yellow/40 text-accent-yellow"
                        : "border-white/10 bg-white/[0.03] text-zinc-400",
                    )}
                  >
                    {row.changed ? "changed decision" : "held decision"}
                  </span>
                  <span className="font-plex-mono text-[10px] text-zinc-600">
                    deferred ×{row.deferredOn.length} · broke ×
                    {row.brokeOn.length}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  <span className="text-sky-400/70">alone:</span>{" "}
                  {row.independentDecision}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  <span className="text-brand-terminal/70">consensus:</span>{" "}
                  {row.consensusDecision}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

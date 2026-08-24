import { clsx } from "clsx";
import { useState } from "react";
import type { DecisionBrief } from "../../lib/types";

// One seat's decision brief: choice answers and selections when the
// elicitation was forced choice, then decision, rationale, red lines,
// dialog, and the consensus report.
export function BriefCard({ brief }: { brief: DecisionBrief }) {
  const [expanded, setExpanded] = useState(false);
  const memo = brief.memo;
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.015] p-4">
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        {brief.seat}{" "}
        <span className="text-zinc-500 normal-case">{brief.model}</span>
        {brief.retries ? (
          <span className="ml-2 text-zinc-500 normal-case">
            {brief.retries} {brief.retries === 1 ? "retry" : "retries"}
          </span>
        ) : null}
        {brief.unusable ? (
          <span className="ml-2 text-amber-400 normal-case">
            unusable: {brief.unusable}
          </span>
        ) : null}
      </p>
      {brief.error ? (
        <p className="mt-2 font-plex-mono text-xs text-red-400">
          {brief.error}
        </p>
      ) : (
        <>
          {(memo?.answers ?? []).map((answer, index) => (
            <p
              key={index}
              className="mt-2 text-xs leading-relaxed text-zinc-300"
            >
              {answer}
            </p>
          ))}
          {(memo?.choices ?? []).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {memo.choices!.map((id) => (
                <span
                  key={id}
                  className="rounded-sm border border-brand-terminal/40 bg-brand-terminal/10 px-1.5 py-0.5 font-plex-mono text-[10px] text-brand-terminal"
                >
                  {id}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm font-medium text-white">
            {memo?.decision ?? "—"}
          </p>
          {memo?.rationale && (
            <>
              <p
                className={clsx(
                  "mt-2 text-xs leading-relaxed text-zinc-400",
                  !expanded && "line-clamp-6",
                )}
              >
                {memo.rationale}
              </p>
              {memo.rationale.length > 360 && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-1 cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  {expanded ? "less" : "more"}
                </button>
              )}
            </>
          )}
          {(memo?.redLines ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {memo.redLines.map((redLine) => (
                <span
                  key={redLine}
                  className="rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-plex-mono text-[10px] text-zinc-400"
                >
                  {redLine}
                </span>
              ))}
            </div>
          )}
          {(brief.dialog ?? []).length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-zinc-300">
                dialog · {brief.dialog!.length} rounds
              </summary>
              <div className="mt-2 space-y-2">
                {brief.dialog!.map((round, index) => (
                  <p
                    key={index}
                    className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-400"
                  >
                    {round}
                  </p>
                ))}
              </div>
            </details>
          )}
          {brief.consensus && (
            <div className="mt-3 space-y-0.5">
              {brief.consensus.deferredOn.length > 0 && (
                <p className="font-plex-mono text-[10px] text-zinc-500">
                  deferred: {brief.consensus.deferredOn.join(", ")}
                </p>
              )}
              {brief.consensus.brokeOn.length > 0 && (
                <p className="font-plex-mono text-[10px] text-accent-yellow">
                  broke: {brief.consensus.brokeOn.join(", ")}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

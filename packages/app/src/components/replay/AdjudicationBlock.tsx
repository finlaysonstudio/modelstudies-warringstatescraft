import { Section } from "../PonyBenchPrimitives";
import { LadderStrip } from "./LadderStrip";
import type { TurnAdjudication } from "../../lib/types";

/** a judge's structured verdict flattened to one line */
export function compactVerdict(verdict: Record<string, unknown>): string {
  try {
    return Object.entries(verdict)
      .map(([key, value]) => {
        const rendered =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);
        return `${key}: ${rendered}`;
      })
      .join(" · ");
  } catch {
    return String(verdict);
  }
}

// The panel's scoring of one turn: the ladder strip, the resolution
// narrative, and each judge's verdict.
export function AdjudicationBlock({
  adjudication,
  ladder,
}: {
  adjudication: TurnAdjudication;
  ladder?: string[];
}) {
  return (
    <div className="border-t border-white/5">
      <Section label="Adjudication" />
      <div className="space-y-4 px-4 py-4">
        {adjudication.unscored ? (
          <span className="font-plex-mono text-[10px] tracking-wide text-amber-400 uppercase">
            unscored — no judge returned a level
          </span>
        ) : (
          <LadderStrip escalation={adjudication.escalation} ladder={ladder} />
        )}
        {adjudication.narrative && (
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
            {adjudication.narrative}
          </p>
        )}
        {(adjudication.panel ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Judge
                  </th>
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Model
                  </th>
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Verdict
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* One judge spec fans out across models: key by both. */}
                {adjudication.panel.map((verdict) => (
                  <tr
                    key={`${verdict.judge}:${verdict.model}`}
                    className="border-b border-white/5"
                  >
                    <td className="px-2 py-1.5 text-xs whitespace-nowrap text-zinc-300">
                      {verdict.judge}
                    </td>
                    <td className="px-2 py-1.5 font-plex-mono text-xs whitespace-nowrap text-zinc-500">
                      {verdict.model}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-zinc-400">
                      {verdict.error ? (
                        <span className="font-plex-mono text-red-400">
                          {verdict.error}
                        </span>
                      ) : (
                        compactVerdict(verdict.verdict ?? {})
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

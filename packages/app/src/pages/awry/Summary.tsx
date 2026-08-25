import clsx from "clsx";
import type { LamparthGroup, LamparthReport } from "../../lib/types";
import { formatUsd } from "../../lib/usage";

const fmt = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

const est = (estimate: { value: number; ci: [number, number] }, digits = 2) =>
  `${fmt(estimate.value, digits)} [${fmt(estimate.ci[0], digits)}, ${fmt(
    estimate.ci[1],
    digits,
  )}]`;

// The campaign summary. Every number on this page is read from the study's
// lamparth report; the prose states what the numbers are and how to read
// them, and types none of them.
export function Summary({ report }: { report: LamparthReport | null }) {
  if (!report) {
    return (
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        The replication's report is not on record yet. Build it with{" "}
        <code className="font-plex-mono text-xs text-zinc-300">
          npm run cli -- study-report &lt;studyId&gt;
        </code>{" "}
        and this page fills in.
      </p>
    );
  }

  const subjects = report.groups.filter((group) => group.kind === "study");
  const references = report.groups.filter(
    (group) => group.kind === "reference",
  );
  const human = references.find((group) => group.id.includes("human"));
  const games = subjects.reduce(
    (sum, group) => sum + group.n + group.excluded,
    0,
  );

  return (
    <div className="mt-4 max-w-2xl space-y-4 text-sm leading-relaxed text-zinc-400">
      <p>
        A replication of Lamparth et al. 2024, "Human vs. Machine: Behavioral
        Differences Between Expert Humans and Language Models in Wargame
        Simulations". One model plays the U.S. Navy commander's team in a
        U.S.–China crisis at sea; every other seat is scripted from the original
        game. The scenario text, the move menus, and the treatment design are
        the paper's, transcribed verbatim: two levels each of AI accuracy, crew
        training, and PRC posture make the eight cells below. This study played{" "}
        {games} games across{" "}
        {subjects.length === 1
          ? "one subject model"
          : `${subjects.length} subject models`}
        , {report.replicates} replicates per cell, each with three rounds of
        simulated team dialog before every decision, beside the paper's
        reference groups: {references.map((group) => group.label).join(", ")}.
      </p>
      <p>
        Aggressiveness is (aggressive − de-escalatory selections) / 21 across
        both moves; the Table 2 columns are the paper's escalation-consistency
        statistic. Intervals are percentile 95% bootstrap intervals over games (
        {report.bootstrap.toLocaleString()} resamples). The paper's own GPT-4
        generation is retired;{" "}
        <code className="font-plex-mono text-xs">gpt-4-0613</code> is the
        surviving model of that era and anchors the replication to the original
        results. Move one shows a strong ceiling effect in every group, so read
        the frequencies per action rather than a single score. The full
        statistics, treatment effects, and differences from each reference group
        are on the study page below.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
              <th className="py-2 pr-4 font-normal">Group</th>
              <th className="py-2 pr-4 font-normal">n</th>
              <th className="py-2 pr-4 font-normal">Aggressiveness</th>
              <th className="py-2 pr-4 font-normal">Table 2 agg→agg</th>
              <th className="py-2 pr-4 font-normal">Table 2 des→agg</th>
            </tr>
          </thead>
          <tbody>
            {[...subjects, ...references].map((group: LamparthGroup) => (
              <tr key={group.id} className="border-b border-white/5">
                <td
                  className={clsx(
                    "py-2 pr-4",
                    group.kind === "reference"
                      ? "text-zinc-500"
                      : "text-zinc-200",
                  )}
                >
                  {group.label}
                  {group === human && (
                    <span className="ml-2 font-plex-mono text-[10px] text-zinc-600 uppercase">
                      human
                    </span>
                  )}
                  {group.elicit === "text" && (
                    <span
                      className="ml-2 font-plex-mono text-[10px] text-zinc-600 uppercase"
                      title="asked in plain text: this subject cannot hold the choice schema"
                    >
                      text
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 font-plex-mono text-zinc-400">
                  {group.n}
                  {group.excluded > 0 && (
                    <span className="text-amber-400"> −{group.excluded}</span>
                  )}
                </td>
                <td className="py-2 pr-4 font-plex-mono text-zinc-300">
                  {est(group.aggressiveness)}
                </td>
                <td className="py-2 pr-4 font-plex-mono text-zinc-400">
                  {est(group.consistency.table2.aggAgg)}
                </td>
                <td className="py-2 pr-4 font-plex-mono text-zinc-400">
                  {est(group.consistency.table2.desAgg)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.usage && (
        <p className="font-plex-mono text-[11px] text-zinc-500">
          {report.usage.total.calls.toLocaleString()} model calls ·{" "}
          {formatUsd(report.usage.total.usd)}
        </p>
      )}
    </div>
  );
}

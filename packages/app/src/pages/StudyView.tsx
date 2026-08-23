import clsx from "clsx";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusChip } from "../components/chips";
import type {
  BasicReport,
  Estimate,
  LamparthColumn,
  LamparthEffect,
  LamparthGroup,
  LamparthReport,
  Report,
  Study,
} from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; study: Study; report: Report | null };

// Study view: the arm grid (scenario × model × replicate) with run links,
// then the study's report. The report is the JSON `cli study-report` wrote;
// the page never computes statistics.
export function StudyView() {
  const { id = "" } = useParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/data/studies/${id}.json`);
        if (!res.ok) throw new Error(`study responded ${res.status}`);
        const study = (await res.json()) as Study;
        let report: Report | null = null;
        const reportRes = await fetch(`/data/reports/${id}.json`);
        if (reportRes.ok) report = (await reportRes.json()) as Report;
        if (!cancelled) setState({ phase: "ready", study, report });
      } catch (error) {
        if (!cancelled) {
          setState({
            phase: "error",
            message: error instanceof Error ? error.message : "fetch failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 sm:px-16">
        <p className="font-plex-mono text-xs text-zinc-600">loading…</p>
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 sm:px-16">
        <p className="font-plex-mono text-xs text-red-400">
          failed to load study — {state.message}
        </p>
      </div>
    );
  }

  const { study, report } = state;
  const complete = study.arms.filter((arm) => arm.status === "complete").length;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/studies" className="hover:text-white">
            Studies
          </Link>{" "}
          / {study.id}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {study.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-plex-mono text-xs text-zinc-400">
          <StatusChip status={study.status} />
          {study.statusDetail && <span>{study.statusDetail}</span>}
          <span>
            {complete}/{study.arms.length} arms
          </span>
          <span>report: {study.report}</span>
          {study.dialog ? <span>dialog {study.dialog}</span> : null}
          {study.priorities === false && <span>no priorities</span>}
          {study.panel && (
            <span>
              judges: {study.panel.judges.join(", ")} ({study.panel.mode})
            </span>
          )}
          {study.narrator && <span>narrator: {study.narrator}</span>}
        </div>
      </header>

      <ArmGrid study={study} />

      <section className="mt-16" aria-label="Report">
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Report
        </h2>
        {!report && (
          <p className="mt-3 text-sm text-zinc-400">
            No report yet. Build one with{" "}
            <code className="font-plex-mono text-xs text-zinc-300">
              npm run cli -- study-report {study.id}
            </code>
            .
          </p>
        )}
        {report?.report === "basic" && <BasicReportView report={report} />}
        {report?.report === "lamparth" && (
          <LamparthReportView report={report} />
        )}
      </section>
    </div>
  );
}

function ArmGrid({ study }: { study: Study }) {
  return (
    <section className="mt-12" aria-label="Arms">
      <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Arms
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
              <th className="py-2 pr-4 font-normal">Scenario</th>
              {study.models.map((model) => (
                <th key={model} className="py-2 pr-4 font-normal">
                  {model}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {study.scenarios.map((scenario) => (
              <tr key={scenario} className="border-b border-white/5">
                <td className="py-2 pr-4 align-top font-plex-mono text-zinc-400">
                  <Link
                    to={`/scenarios/${scenario}`}
                    className="hover:text-white"
                  >
                    {scenario}
                  </Link>
                </td>
                {study.models.map((model) => (
                  <td key={model} className="py-2 pr-4 align-top">
                    <div className="flex flex-wrap gap-1">
                      {study.arms
                        .filter(
                          (arm) =>
                            arm.scenario === scenario && arm.model === model,
                        )
                        .map((arm) => {
                          const chip = (
                            <span
                              title={`#${arm.replicate} ${arm.status}${arm.statusDetail ? ` — ${arm.statusDetail}` : ""}`}
                              className={clsx(
                                "inline-flex size-6 items-center justify-center rounded-sm border font-plex-mono text-[10px]",
                                arm.status === "complete" &&
                                  "border-brand-terminal/40 text-brand-terminal",
                                arm.status === "active" &&
                                  "border-sky-400/40 text-sky-400",
                                arm.status === "error" &&
                                  "border-red-400/40 text-red-400",
                                arm.status === "pending" &&
                                  "border-white/10 text-zinc-600",
                              )}
                            >
                              {arm.replicate}
                            </span>
                          );
                          return arm.runId ? (
                            <Link
                              key={arm.replicate}
                              to={`/runs/${arm.runId}`}
                              className="cursor-pointer hover:opacity-80"
                            >
                              {chip}
                            </Link>
                          ) : (
                            <span key={arm.replicate}>{chip}</span>
                          );
                        })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---- shared report pieces

const fmt = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function EstimateCell({
  estimate,
  digits = 2,
  signed = false,
  max = 1,
}: {
  estimate: Estimate;
  digits?: number;
  /** color by sign and mark intervals that exclude zero */
  signed?: boolean;
  /** bar scale */
  max?: number;
}) {
  const { value, ci } = estimate;
  const excludesZero = signed && (ci[0] > 0 || ci[1] < 0);
  const width = Math.min(100, (Math.abs(value) / max) * 100);
  return (
    <div className="min-w-[7rem]">
      <div className="flex items-baseline gap-x-2">
        <span
          className={clsx(
            "font-plex-mono text-xs",
            signed && value > 0 && "text-red-300",
            signed && value < 0 && "text-sky-300",
            !signed && "text-zinc-200",
            excludesZero && "font-semibold",
          )}
        >
          {signed && value > 0 ? "+" : ""}
          {fmt(value, digits)}
        </span>
        <span className="font-plex-mono text-[10px] text-zinc-500">
          [{fmt(ci[0], digits)}, {fmt(ci[1], digits)}]
        </span>
      </div>
      <div className="mt-1 h-0.5 w-full bg-white/5">
        <div
          className={clsx(
            "h-0.5",
            signed
              ? value >= 0
                ? "bg-red-400/60"
                : "bg-sky-400/60"
              : "bg-brand-terminal/60",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const th = "py-2 pr-4 font-normal whitespace-nowrap";
const td = "py-2 pr-4 align-top";

function Coverage({ report }: { report: Report }) {
  const short = report.coverage.filter((cell) => cell.complete < cell.expected);
  return (
    <p className="mt-2 font-plex-mono text-[11px] text-zinc-500">
      {report.coverage.length} cells × k={report.replicates}, bootstrap{" "}
      {report.bootstrap}
      {short.length > 0 && (
        <span className="text-amber-300">
          {" "}
          · {short.length} cell{short.length === 1 ? "" : "s"} short of k
        </span>
      )}
    </p>
  );
}

// ---- basic

function BasicReportView({ report }: { report: BasicReport }) {
  const rows = [...report.cells, ...report.byModel];
  const turnIndexes = [
    ...new Set(rows.flatMap((row) => row.turns.map((turn) => turn.index))),
  ].sort((a, b) => a - b);
  const maxLevel = Math.max(
    1,
    ...rows.flatMap((row) => [row.peak.ci[1], row.final.ci[1]]),
  );
  return (
    <div>
      <Coverage report={report} />
      <Table
        head={
          <>
            <th className={th}>Scenario</th>
            <th className={th}>Model</th>
            <th className={th}>Games</th>
            <th className={th}>Timelines</th>
            {turnIndexes.map((index) => (
              <th key={index} className={th}>
                Turn {index}
              </th>
            ))}
            <th className={th}>Peak</th>
            <th className={th}>Final</th>
          </>
        }
      >
        {rows.map((row, i) => (
          <tr
            key={`${row.scenario ?? "all"}-${row.model}-${i}`}
            className={clsx(
              "border-b border-white/5",
              row.scenario === null && "bg-white/[0.02]",
            )}
          >
            <td className={clsx(td, "font-plex-mono text-zinc-400")}>
              {row.scenario ?? "all cells"}
            </td>
            <td className={clsx(td, "text-zinc-200")}>{row.model}</td>
            <td className={clsx(td, "font-plex-mono text-zinc-400")}>
              {row.games}
            </td>
            <td className={clsx(td, "font-plex-mono text-zinc-400")}>
              {row.timelines}
            </td>
            {turnIndexes.map((index) => {
              const turn = row.turns.find((t) => t.index === index);
              return (
                <td key={index} className={td}>
                  {turn ? (
                    <EstimateCell estimate={turn.escalation} max={maxLevel} />
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              );
            })}
            <td className={td}>
              <EstimateCell estimate={row.peak} max={maxLevel} />
            </td>
            <td className={td}>
              <EstimateCell estimate={row.final} max={maxLevel} />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ---- lamparth

const FACTOR_LABEL: Record<LamparthEffect["factor"], string> = {
  accuracy: "AI accuracy",
  training: "Crew training",
  posture: "PRC posture",
};

function GroupHead({ group }: { group: LamparthGroup }) {
  return (
    <th className={th}>
      <span className={group.kind === "reference" ? "text-zinc-500" : ""}>
        {group.label}
      </span>
      <span className="ml-1 text-zinc-600">n={group.n}</span>
    </th>
  );
}

function ActionRows({
  columns,
  cellFor,
}: {
  columns: LamparthColumn[];
  cellFor: (column: LamparthColumn) => ReactNode;
}) {
  const turns = [...new Set(columns.map((column) => column.turn))];
  return (
    <>
      {turns.map((turn) => (
        <RowsForTurn
          key={turn}
          turn={turn}
          columns={columns.filter((column) => column.turn === turn)}
          cellFor={cellFor}
        />
      ))}
    </>
  );
}

function RowsForTurn({
  turn,
  columns,
  cellFor,
}: {
  turn: number;
  columns: LamparthColumn[];
  cellFor: (column: LamparthColumn) => ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-white/10 bg-white/[0.02]">
        <td
          colSpan={99}
          className="py-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase"
        >
          Move {turn}
        </td>
      </tr>
      {columns.map((column) => (
        <tr key={column.id} className="border-b border-white/5">
          <td className={clsx(td, "max-w-xs")}>
            <span className="font-plex-mono text-zinc-500">{column.id}</span>{" "}
            <span className="text-zinc-300">{column.label}</span>
            {column.stance && (
              <span
                className={clsx(
                  "ml-2 font-plex-mono text-[10px] uppercase",
                  column.stance === "agg" ? "text-red-400" : "text-sky-400",
                )}
              >
                {column.stance}
              </span>
            )}
          </td>
          {cellFor(column)}
        </tr>
      ))}
    </>
  );
}

function LamparthReportView({ report }: { report: LamparthReport }) {
  const subjects = report.groups.filter((group) => group.kind === "study");
  const references = report.groups.filter(
    (group) => group.kind === "reference",
  );
  const [factor, setFactor] = useState<LamparthEffect["factor"]>("accuracy");
  const [reference, setReference] = useState<string>(references[0]?.id ?? "");
  const byRow = useMemo(() => {
    const key = (column: LamparthColumn) => `${column.turn}:${column.id}`;
    const freq = new Map(
      report.groups.map((group) => [
        group.id,
        new Map(group.frequencies.map((row) => [key(row), row])),
      ]),
    );
    const effect = new Map(
      report.groups.map((group) => [
        group.id,
        new Map(
          group.effects.map((e) => [
            e.factor,
            new Map(e.rows.map((row) => [key(row), row])),
          ]),
        ),
      ]),
    );
    const comparison = new Map(
      report.comparisons.map((c) => [
        `${c.group}|${c.reference}`,
        new Map(c.rows.map((row) => [key(row), row])),
      ]),
    );
    return { key, freq, effect, comparison };
  }, [report]);

  const effectGroups = report.groups.filter((group) =>
    group.effects.some((e) => e.factor === factor && e.n[0] && e.n[1]),
  );
  const levels = report.groups[0]?.effects.find(
    (e) => e.factor === factor,
  )?.levels;

  return (
    <div className="space-y-14">
      <div>
        <Coverage report={report} />
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Statistics of Lamparth et al. 2024 for every subject model beside the
          paper's reference groups. Intervals are percentile 95% bootstrap
          intervals over games.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white">Summary</h3>
        <p className="mt-1 max-w-2xl text-xs text-zinc-500">
          Aggressiveness is (aggressive − de-escalatory selections) / 21 across
          both moves; actions is the mean count selected. Table 2 is the paper's
          printed statistic, p(agg2 ∧ agg1) and p(agg2 ∧ des1); the conditional
          columns are the probabilities its caption names.
        </p>
        <Table
          head={
            <>
              <th className={th}>Group</th>
              <th className={th}>n</th>
              <th className={th}>Aggressiveness</th>
              <th className={th}>Actions</th>
              <th className={th}>Table 2 agg→agg</th>
              <th className={th}>Table 2 des→agg</th>
              <th className={th}>p(agg2 | agg1)</th>
              <th className={th}>p(agg2 | des1)</th>
              <th className={th}>n agg1 / des1</th>
            </>
          }
        >
          {report.groups.map((group) => (
            <tr key={group.id} className="border-b border-white/5">
              <td
                className={clsx(
                  td,
                  group.kind === "reference"
                    ? "text-zinc-500"
                    : "text-zinc-200",
                )}
              >
                {group.label}
              </td>
              <td className={clsx(td, "font-plex-mono text-zinc-400")}>
                {group.n}
              </td>
              <td className={td}>
                <EstimateCell estimate={group.aggressiveness} max={0.5} />
              </td>
              <td className={td}>
                <EstimateCell estimate={group.actions} digits={1} max={21} />
              </td>
              <td className={td}>
                <EstimateCell estimate={group.consistency.table2.aggAgg} />
              </td>
              <td className={td}>
                <EstimateCell estimate={group.consistency.table2.desAgg} />
              </td>
              <td className={td}>
                <EstimateCell
                  estimate={group.consistency.conditional.aggGivenAgg}
                />
              </td>
              <td className={td}>
                <EstimateCell
                  estimate={group.consistency.conditional.aggGivenDes}
                />
              </td>
              <td className={clsx(td, "font-plex-mono text-zinc-400")}>
                {group.consistency.nAgg} / {group.consistency.nDes}
              </td>
            </tr>
          ))}
          {report.table2 &&
            Object.entries(report.table2).map(([name, row]) => (
              <tr key={name} className="border-b border-white/5 text-zinc-500">
                <td className={td}>paper Table 2 · {name}</td>
                <td className={td}>—</td>
                <td className={td}>—</td>
                <td className={td}>—</td>
                <td className={clsx(td, "font-plex-mono")}>
                  {fmt(row.aggGivenAgg)}
                </td>
                <td className={clsx(td, "font-plex-mono")}>
                  {fmt(row.aggGivenDes)}
                </td>
                <td className={td}>—</td>
                <td className={td}>—</td>
                <td className={td}>—</td>
              </tr>
            ))}
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white">Action frequency</h3>
        <p className="mt-1 max-w-2xl text-xs text-zinc-500">
          Share of games selecting each action, all cells pooled.
        </p>
        <Table
          head={
            <>
              <th className={th}>Action</th>
              {report.groups.map((group) => (
                <GroupHead key={group.id} group={group} />
              ))}
            </>
          }
        >
          <ActionRows
            columns={report.columns}
            cellFor={(column) => (
              <>
                {report.groups.map((group) => {
                  const row = byRow.freq.get(group.id)?.get(byRow.key(column));
                  return (
                    <td key={group.id} className={td}>
                      {row ? <EstimateCell estimate={row} /> : "—"}
                    </td>
                  );
                })}
              </>
            )}
          />
        </Table>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h3 className="text-sm font-medium text-white">Treatment effects</h3>
          <div className="flex gap-x-1">
            {(["accuracy", "training", "posture"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFactor(f)}
                className={clsx(
                  "cursor-pointer rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide uppercase",
                  factor === f
                    ? "border-brand-terminal/40 text-brand-terminal"
                    : "border-white/10 text-zinc-500 hover:text-zinc-200",
                )}
              >
                {FACTOR_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 max-w-2xl text-xs text-zinc-500">
          Total causal effect on selection frequency: mean({levels?.[0]}) −
          mean({levels?.[1]}), each side resampled independently. Bold where the
          interval excludes zero.
        </p>
        <Table
          head={
            <>
              <th className={th}>Action</th>
              {effectGroups.map((group) => {
                const e = group.effects.find((x) => x.factor === factor)!;
                return (
                  <th key={group.id} className={th}>
                    {group.label}
                    <span className="ml-1 text-zinc-600">
                      {e.n[0]}/{e.n[1]}
                    </span>
                  </th>
                );
              })}
            </>
          }
        >
          <ActionRows
            columns={report.columns}
            cellFor={(column) => (
              <>
                {effectGroups.map((group) => {
                  const row = byRow.effect
                    .get(group.id)
                    ?.get(factor)
                    ?.get(byRow.key(column));
                  return (
                    <td key={group.id} className={td}>
                      {row ? <EstimateCell estimate={row} signed /> : "—"}
                    </td>
                  );
                })}
              </>
            )}
          />
        </Table>
      </div>

      {references.length > 0 && subjects.length > 0 && (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4">
            <h3 className="text-sm font-medium text-white">
              Difference from reference
            </h3>
            <div className="flex flex-wrap gap-x-1">
              {references.map((ref) => (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => setReference(ref.id)}
                  className={clsx(
                    "cursor-pointer rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide uppercase",
                    reference === ref.id
                      ? "border-brand-terminal/40 text-brand-terminal"
                      : "border-white/10 text-zinc-500 hover:text-zinc-200",
                  )}
                >
                  {ref.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Subject minus reference selection frequency per action (the paper's
            Fig. 3). Positive: the subject selects it more often than the
            reference group.
          </p>
          <Table
            head={
              <>
                <th className={th}>Action</th>
                {subjects.map((group) => (
                  <GroupHead key={group.id} group={group} />
                ))}
              </>
            }
          >
            <ActionRows
              columns={report.columns}
              cellFor={(column) => (
                <>
                  {subjects.map((group) => {
                    const row = byRow.comparison
                      .get(`${group.id}|${reference}`)
                      ?.get(byRow.key(column));
                    return (
                      <td key={group.id} className={td}>
                        {row ? <EstimateCell estimate={row} signed /> : "—"}
                      </td>
                    );
                  })}
                </>
              )}
            />
          </Table>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white">Games per cell</h3>
        <Table
          head={
            <>
              <th className={th}>Cell</th>
              {report.groups.map((group) => (
                <th key={group.id} className={th}>
                  {group.label}
                </th>
              ))}
            </>
          }
        >
          {report.scenarios.map((scenario) => (
            <tr key={scenario} className="border-b border-white/5">
              <td className={clsx(td, "font-plex-mono text-zinc-400")}>
                {scenario}
              </td>
              {report.groups.map((group) => (
                <td
                  key={group.id}
                  className={clsx(td, "font-plex-mono text-zinc-300")}
                >
                  {group.cells.find((cell) => cell.scenario === scenario)?.n ??
                    0}
                </td>
              ))}
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
